#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use chrono::Local;
use image::imageops::{self, FilterType};
use image::{DynamicImage, ImageFormat, RgbaImage};
use regex::RegexBuilder;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::sync::OnceLock;
use std::time::UNIX_EPOCH;
use tauri::api::dialog::blocking::FileDialogBuilder;
use font_kit::source::SystemSource;
use rayon::prelude::*;

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();
    let mut names: Vec<String> = source.all_families().unwrap_or_default();
    // 先按小写 key 排序，避免比较器里重复分配字符串。
    names.sort_by_cached_key(|name| name.to_lowercase());
    names.dedup();
    names
}

// 鍓嶇鐢ㄤ簬灞曠ず涓庡鍑虹殑鏂囦欢鍏冧俊鎭€?
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ImageFile {
    id: String,
    path: String,
    name: String,
    extension: String,
    width: u32,
    height: u32,
    size_bytes: u64,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ResizeOptions {
    enabled: bool,
    width: Option<u32>,
    height: Option<u32>,
    mode: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct CropOptions {
    enabled: bool,
    x: u32,
    y: u32,
    width: Option<u32>,
    height: Option<u32>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct WatermarkItem {
    base64: String,
    x: Option<i64>,
    y: Option<i64>,
    margin: u32,
    position: String,
    opacity: f32,
    ref_width: u32,
    ref_height: u32,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct OverlayOptions {
    enabled: bool,
    path: Option<String>,
    scale_percent: u32,
    opacity: f32,
    margin: u32,
    position: String,
    x: Option<i64>,
    y: Option<i64>,
    ref_width: u32,
    ref_height: u32,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct NamingOptions {
    template: String,
    output_format: String,
    regex_enabled: bool,
    regex_pattern: String,
    regex_replacement: String,
    regex_flags: String,
    start_number: u32,
    step: u32,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ProcessPayload {
    files: Vec<ImageFile>,
    output_directory: Option<String>,
    resize: ResizeOptions,
    crop: CropOptions,
    watermarks: Vec<WatermarkItem>,
    overlays: Vec<OverlayOptions>,
    naming: NamingOptions,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct ProcessResultItem {
    output_path: String,
    width: u32,
    height: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct ProcessErrorItem {
    file_path: String,
    message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct ProcessSummary {
    output_directory: String,
    results: Vec<ProcessResultItem>,
    errors: Vec<ProcessErrorItem>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct RuntimeInfo {
    platform: String,
    locale: Option<String>,
    app_version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct PreviewData {
    data_url: String,
}

// 缁熶竴闄愬畾褰撳墠鐗堟湰鍙鐞嗙殑鍥剧墖鏍煎紡銆?
fn is_supported_format(format: ImageFormat) -> bool {
    matches!(
        format,
        ImageFormat::Png
            | ImageFormat::Jpeg
            | ImageFormat::WebP
            | ImageFormat::Bmp
            | ImageFormat::Gif
            | ImageFormat::Tiff
            | ImageFormat::Tga
            | ImageFormat::Pnm
            | ImageFormat::Dds
            | ImageFormat::Farbfeld
    )
}

fn normalized_extension(format: ImageFormat) -> &'static str {
    match format {
        ImageFormat::Jpeg => "jpg",
        ImageFormat::WebP => "webp",
        ImageFormat::Bmp => "bmp",
        ImageFormat::Gif => "gif",
        ImageFormat::Tiff => "tiff",
        ImageFormat::Tga => "tga",
        _ => "png",
    }
}

fn mime_for_format(format: ImageFormat) -> &'static str {
    match format {
        ImageFormat::Jpeg => "image/jpeg",
        ImageFormat::WebP => "image/webp",
        ImageFormat::Bmp => "image/bmp",
        ImageFormat::Gif => "image/gif",
        ImageFormat::Tiff => "image/tiff",
        _ => "image/png",
    }
}

fn probe_image(path: &Path) -> Result<(ImageFormat, (u32, u32)), String> {
    let reader = image::ImageReader::open(path).map_err(|error| error.to_string())?;
    let guessed = reader
        .with_guessed_format()
        .map_err(|error| error.to_string())?;
    let format = guessed
        .format()
        .ok_or_else(|| format!("Unsupported image format: {}", path.display()))?;

    if !is_supported_format(format) {
        return Err(format!("Unsupported image format: {}", path.display()));
    }

    let dimensions = guessed.into_dimensions().map_err(|error| error.to_string())?;
    Ok((format, dimensions))
}

fn stable_modified_token(metadata: &fs::Metadata) -> u128 {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

fn normalize_file(path: &Path) -> Result<ImageFile, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err(format!("Not a file: {}", path.display()));
    }

    let (detected_format, dimensions) = probe_image(path)?;
    let extension = normalized_extension(detected_format).to_string();
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    let modified_token = stable_modified_token(&metadata);
    let file_size = metadata.len();

    Ok(ImageFile {
        id: format!("{}:{}:{}", path.display(), file_size, modified_token),
        path: path.to_string_lossy().to_string(),
        name,
        extension,
        width: dimensions.0,
        height: dimensions.1,
        size_bytes: file_size,
    })
}

#[tauri::command]
fn pick_files() -> Result<Vec<ImageFile>, String> {
    let picked = FileDialogBuilder::new()
        .add_filter("Images", &["png", "jpg", "jpeg", "webp", "bmp", "gif", "tiff", "tga", "avif"])
        .pick_files();

    let mut files = Vec::new();
    if let Some(paths) = picked {
        for path in paths {
            if let Ok(file) = normalize_file(&path) {
                files.push(file);
            }
        }
    }
    Ok(files)
}

#[tauri::command]
fn load_files_from_paths(paths: Vec<String>) -> Result<Vec<ImageFile>, String> {
    let mut files = Vec::new();
    for path in paths {
        let path_buf = PathBuf::from(path);
        if path_buf.is_file() {
            if let Ok(file) = normalize_file(&path_buf) {
                files.push(file);
            }
        }
    }
    Ok(files)
}

#[tauri::command]
fn pick_overlay() -> Result<Option<ImageFile>, String> {
    let picked = FileDialogBuilder::new()
        .add_filter("Images", &["png", "jpg", "jpeg", "webp", "bmp", "gif", "tiff"])
        .pick_file();

    match picked {
        Some(path) => Ok(Some(normalize_file(&path)?)),
        None => Ok(None),
    }
}

fn default_output_directory() -> String {
    String::from("source")
}

fn source_directory(file: &ImageFile) -> PathBuf {
    Path::new(&file.path)
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(std::env::temp_dir)
}

#[tauri::command]
fn pick_output_directory(current_dir: Option<String>) -> Result<Option<String>, String> {
    let mut builder = FileDialogBuilder::new();
    if let Some(current) = current_dir {
        builder = builder.set_directory(current);
    } else {
        builder = builder.set_directory(default_output_directory());
    }

    Ok(builder
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
fn get_runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        platform: std::env::consts::OS.to_string(),
        locale: sys_locale::get_locale(),
        app_version: app_version_from_tauri_conf(),
    }
}

/// 版本号以 tauri.conf.json 为准，确保前端“关于”展示与打包配置一致。
fn app_version_from_tauri_conf() -> String {
    static VERSION: OnceLock<String> = OnceLock::new();
    VERSION
        .get_or_init(|| {
            serde_json::from_str::<Value>(include_str!("../tauri.conf.json"))
                .ok()
                .and_then(|json| {
                    json.get("package")
                        .and_then(|pkg| pkg.get("version"))
                        .and_then(Value::as_str)
                        .map(str::to_string)
                })
                .unwrap_or_else(|| env!("CARGO_PKG_VERSION").to_string())
        })
        .clone()
}

#[tauri::command]
fn get_preview_data(path: String) -> Result<PreviewData, String> {
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let format = image::guess_format(&bytes).map_err(|error| error.to_string())?;
    if !is_supported_format(format) {
        return Err(format!("Unsupported image format: {}", path));
    }
    let mime = mime_for_format(format);

    Ok(PreviewData {
        data_url: format!(
            "data:{};base64,{}",
            mime,
            BASE64_STANDARD.encode(bytes)
        ),
    })
}

/// 高性能版本：使用调用方预加载的 overlay / watermark，避免批处理时重复解码。
fn process_single_frame_with_preloaded(
    image: DynamicImage,
    payload: &ProcessPayload,
    preloaded_overlays: &[Option<RgbaImage>],
    preloaded_watermarks: &[RgbaImage],
) -> Result<DynamicImage, String> {
    let mut image = image;

    // 1. 瑁佸壀銆?
    image = crop_image(image, &payload.crop);

    // 2. 缂╂斁銆?
    if payload.resize.enabled {
        image = resize_image(image, &payload.resize);
    }

    // 3. 鍙犲姞鎵€鏈夊浘灞傦紙浣跨敤棰勫姞杞藉浘鐗囷紝鏃犻渶閲嶅璇荤鐩橈級銆?
    for (i, overlay) in payload.overlays.iter().enumerate() {
        if let Some(pre) = preloaded_overlays.get(i).and_then(|o| o.as_ref()) {
            apply_overlay_with_image(&mut image, overlay, pre)?;
        } else {
            apply_overlay(&mut image, overlay)?;
        }
    }

    // 4. 搴旂敤鐙珛姘村嵃灞傘€?
    apply_watermark_with_images(&mut image, &payload.watermarks, preloaded_watermarks)?;

    Ok(image)
}

fn crop_image(image: DynamicImage, options: &CropOptions) -> DynamicImage {
    if !options.enabled {
        return image;
    }

    let safe_x = options.x.min(image.width().saturating_sub(1));
    let safe_y = options.y.min(image.height().saturating_sub(1));
    let width = options
        .width
        .unwrap_or_else(|| image.width().saturating_sub(safe_x))
        .max(1)
        .min(image.width().saturating_sub(safe_x));
    let height = options
        .height
        .unwrap_or_else(|| image.height().saturating_sub(safe_y))
        .max(1)
        .min(image.height().saturating_sub(safe_y));

    image.crop_imm(safe_x, safe_y, width, height)
}

fn resize_image(image: DynamicImage, options: &ResizeOptions) -> DynamicImage {
    if !options.enabled || (options.width.is_none() && options.height.is_none()) {
        return image;
    }

    let source_width = image.width();
    let source_height = image.height();
    let target_width = options.width.unwrap_or(source_width).max(1);
    let target_height = options.height.unwrap_or(source_height).max(1);

    match options.mode.as_str() {
        "stretch" => image.resize_exact(target_width, target_height, FilterType::Lanczos3),
        "fill" => image.resize_to_fill(target_width, target_height, FilterType::Lanczos3),
        _ => image.resize(target_width, target_height, FilterType::Lanczos3),
    }
}

fn overlay_position(
    base_width: u32,
    base_height: u32,
    top_width: u32,
    top_height: u32,
    position: &str,
    margin_x: u32,
    margin_y: u32,
) -> (i64, i64) {
    let (vertical, horizontal) = position.split_once('-').unwrap_or(("center", "center"));
    let left = match horizontal {
        "left" => margin_x as i64,
        "right" => base_width.saturating_sub(top_width + margin_x) as i64,
        _ => (base_width.saturating_sub(top_width) / 2) as i64,
    };
    let top = match vertical {
        "top" => margin_y as i64,
        "bottom" => base_height.saturating_sub(top_height + margin_y) as i64,
        _ => (base_height.saturating_sub(top_height) / 2) as i64,
    };
    (left.max(0), top.max(0))
}

fn apply_alpha(image: &mut RgbaImage, opacity: f32) {
    if (opacity - 1.0).abs() < 0.001 { return; }
    for pixel in image.pixels_mut() {
        let alpha = (pixel[3] as f32 * opacity.clamp(0.0, 1.0)).round() as u8;
        pixel[3] = alpha;
    }
}

fn apply_overlay(base: &mut DynamicImage, overlay: &OverlayOptions) -> Result<(), String> {
    if !overlay.enabled { return Ok(()); }
    let Some(path) = &overlay.path else { return Ok(()); };
    let raw = image::open(path)
        .map_err(|e| format!("Cannot open overlay '{}': {}", path, e))?;
    apply_overlay_with_image(base, overlay, &raw.to_rgba8())
}

/// 鎺ユ敹宸茶В鐮佺殑 RgbaImage锛屼緵鎵归噺澶勭悊鏃跺鐢ㄩ鍔犺浇鏁版嵁銆?
fn apply_overlay_with_image(
    base: &mut DynamicImage,
    overlay: &OverlayOptions,
    source: &RgbaImage,
) -> Result<(), String> {
    if !overlay.enabled { return Ok(()); }

    let base_width = base.width();
    let base_height = base.height();
    let ref_width = overlay.ref_width.max(1);
    let ref_height = overlay.ref_height.max(1);
    let scale_factor_x = base_width as f32 / ref_width as f32;
    let scale_factor_y = base_height as f32 / ref_height as f32;

    // 姣斾緥缂╂斁 Overlay 鏈韩鐨勫ぇ灏?(缁熶竴浠ュ搴︿负鍩哄噯, 淇濇寔鍘熷瀹介珮姣?銆?
    let target_width = ((base_width as f32) * (overlay.scale_percent.max(1) as f32 / 100.0)).round() as u32;
    let safe_target_width = target_width.max(1);
    let scale = if source.width() == 0 { 1.0 } else { safe_target_width as f32 / source.width() as f32 };
    let safe_target_height = ((source.height() as f32) * scale).round().max(1.0) as u32;

    let mut top = imageops::resize(source, safe_target_width, safe_target_height, FilterType::Lanczos3);
    apply_alpha(&mut top, overlay.opacity);

    // 缂╂斁 Margin 涓庡潗鏍囥€?
    let scaled_margin_x = (overlay.margin as f32 * scale_factor_x).round() as u32;
    let scaled_margin_y = (overlay.margin as f32 * scale_factor_y).round() as u32;

    // 浼樺厛浣跨敤寮哄埗鍧愭爣 (x, y)锛屽惁鍒欎娇鐢ㄤ節瀹牸瀵归綈閫昏緫銆?
    let (left, top_pos) = if let (Some(x), Some(y)) = (overlay.x, overlay.y) {
        ((x as f32 * scale_factor_x).round() as i64, (y as f32 * scale_factor_y).round() as i64)
    } else {
        overlay_position(base_width, base_height, top.width(), top.height(),
            &overlay.position, scaled_margin_x, scaled_margin_y)
    };

    imageops::overlay(base, &top, left, top_pos);
    Ok(())
}

fn apply_watermark_with_images(base: &mut DynamicImage, watermarks: &[WatermarkItem], preloaded_watermarks: &[RgbaImage]) -> Result<(), String> {
    let base_width = base.width();
    let base_height = base.height();

    for (i, wm) in watermarks.iter().enumerate() {
        let Some(img) = preloaded_watermarks.get(i) else { continue; };
        let ref_width = wm.ref_width.max(1);
        let ref_height = wm.ref_height.max(1);
        let scale_factor_x = base_width as f32 / ref_width as f32;
        let scale_factor_y = base_height as f32 / ref_height as f32;

        // 缂╂斁姘村嵃鍥剧墖鏈韩鐨勫ぇ灏?(缁熶竴浠ュ搴︿负鍩哄噯, 浣跨敤姝ｇ‘鐨?Y 杞存瘮渚嬩慨澶?Bug)銆?
        let target_w = (img.width() as f32 * scale_factor_x).round() as u32;
        let target_h = (img.height() as f32 * scale_factor_y).round() as u32;
        
        if target_w == 0 || target_h == 0 { continue; }
        
        let mut rgba = imageops::resize(img, target_w, target_h, FilterType::Lanczos3);
        apply_alpha(&mut rgba, wm.opacity);

        // 缂╂斁杈硅窛涓庡潗鏍囥€?
        let scaled_margin_x = (wm.margin as f32 * scale_factor_x).round() as u32;
        let scaled_margin_y = (wm.margin as f32 * scale_factor_y).round() as u32;

        let (left, top_pos) = if let (Some(x), Some(y)) = (wm.x, wm.y) {
            ((x as f32 * scale_factor_x).round() as i64, (y as f32 * scale_factor_y).round() as i64)
        } else {
            overlay_position(
                base_width,
                base_height,
                rgba.width(),
                rgba.height(),
                &wm.position,
                scaled_margin_x,
                scaled_margin_y,
            )
        };

        imageops::overlay(base, &rgba, left, top_pos);
    }
    Ok(())
}

/// 接收预编译 regex 与批处理时间戳，减少并行处理中重复构建开销。
fn output_name_with_regex(
    file: &ImageFile,
    index: usize,
    naming: &NamingOptions,
    compiled: Option<&regex::Regex>,
    batch_timestamp: &str,
) -> Result<String, String> {
    let mut base_name = Path::new(&file.path)
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    if naming.regex_enabled && !naming.regex_pattern.is_empty() {
        if let Some(re) = compiled {
            base_name = re
                .replace_all(&base_name, naming.regex_replacement.as_str())
                .to_string();
        } else {
            let re = RegexBuilder::new(&naming.regex_pattern)
                .case_insensitive(naming.regex_flags.contains('i'))
                .multi_line(naming.regex_flags.contains('m'))
                .dot_matches_new_line(naming.regex_flags.contains('s'))
                .build()
                .map_err(|error| error.to_string())?;
            base_name = re
                .replace_all(&base_name, naming.regex_replacement.as_str())
                .to_string();
        }
    }

    let current_index = (index as u32 * naming.step) + naming.start_number;
    let index_str = format!("{:02}", current_index);

    let output_ext = if naming.output_format.eq_ignore_ascii_case("original") {
        file.extension.clone()
    } else {
        naming.output_format.to_ascii_lowercase()
    };
    let rendered = naming
        .template
        .replace("{name}", &base_name)
        .replace("{index}", &index_str)
        .replace("{ext}", &output_ext)
        .replace("{timestamp}", batch_timestamp)
        .replace("{width}", &file.width.to_string())
        .replace("{height}", &file.height.to_string());

    let safe = rendered
        .chars()
        .map(|ch| if "<>:\"/\\|?*".contains(ch) { '_' } else { ch })
        .collect::<String>()
        .trim()
        .to_string();

    if safe.is_empty() {
        return Ok(format!("export_{}.{}", index_str, output_ext));
    }

    Ok(if safe.ends_with(&format!(".{}", output_ext)) {
        safe
    } else {
        format!("{}.{}", safe, output_ext)
    })
}

fn save_image(image: &DynamicImage, format_name: &str, path: &Path) -> Result<(), String> {
    use image::codecs::jpeg::JpegEncoder;
    use image::codecs::png::{CompressionType, FilterType as PngFilterType, PngEncoder};
    use image::codecs::webp::WebPEncoder;
    use image::ImageEncoder;

    let file = fs::File::create(path).map_err(|error| error.to_string())?;
    let mut writer = std::io::BufWriter::new(file);

    match format_name {
        "jpg" | "jpeg" => {
            let rgb = image.to_rgb8();
            let (w, h) = rgb.dimensions();
            let encoder = JpegEncoder::new_with_quality(&mut writer, 85);
            encoder.write_image(rgb.as_raw(), w, h, image::ColorType::Rgb8.into())
                .map_err(|error| error.to_string())
        }
        "webp" => {
            let rgba = image.to_rgba8();
            let (w, h) = rgba.dimensions();
            let encoder = WebPEncoder::new_lossless(&mut writer);
            encoder.write_image(rgba.as_raw(), w, h, image::ColorType::Rgba8.into())
                .map_err(|error| error.to_string())
        }
        // 这些格式直接复用当前 writer，避免再次打开文件路径。
        "bmp" => image.write_to(&mut writer, ImageFormat::Bmp).map_err(|error| error.to_string()),
        "gif" => image.write_to(&mut writer, ImageFormat::Gif).map_err(|error| error.to_string()),
        "tiff" => image.write_to(&mut writer, ImageFormat::Tiff).map_err(|error| error.to_string()),
        "tga" => image.write_to(&mut writer, ImageFormat::Tga).map_err(|error| error.to_string()),
        _ => {
            let rgba = image.to_rgba8();
            let (w, h) = rgba.dimensions();
            let encoder = PngEncoder::new_with_quality(
                &mut writer,
                CompressionType::Best,
                PngFilterType::Adaptive
            );
            encoder.write_image(rgba.as_raw(), w, h, image::ColorType::Rgba8.into())
                .map_err(|error| error.to_string())
        }
    }
}

/// 尽量减少重复的 create_dir_all 调用，降低大量文件导出时的系统调用开销。
fn ensure_output_directory(
    output_directory: &Path,
    created_dirs: &Mutex<HashSet<PathBuf>>,
) -> Result<(), String> {
    let mut cache = created_dirs
        .lock()
        .map_err(|_| "Output directory cache lock poisoned".to_string())?;
    if cache.contains(output_directory) {
        return Ok(());
    }
    fs::create_dir_all(output_directory).map_err(|e| e.to_string())?;
    cache.insert(output_directory.to_path_buf());
    Ok(())
}

/// 为并行导出预留唯一文件名，避免同批任务写入时发生重名竞争。
fn reserve_unique_output_path(
    output_directory: &Path,
    file_name: &str,
    reservations: &Mutex<HashMap<PathBuf, HashSet<String>>>,
) -> Result<PathBuf, String> {
    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    let ext = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let mut counter = 0usize;
    loop {
        let candidate_name = if counter == 0 {
            file_name.to_string()
        } else if ext.is_empty() {
            format!("{} ({})", stem, counter)
        } else {
            format!("{} ({}).{}", stem, counter, ext)
        };
        let candidate_path = output_directory.join(&candidate_name);

        let mut cache = reservations
            .lock()
            .map_err(|_| "Output path reservation lock poisoned".to_string())?;
        let set = cache
            .entry(output_directory.to_path_buf())
            .or_insert_with(HashSet::new);

        // 先检查本批次是否已占用，再检查磁盘上是否已存在。
        if !set.contains(&candidate_name) && !candidate_path.exists() {
            set.insert(candidate_name);
            return Ok(candidate_path);
        }
        drop(cache);
        counter += 1;
    }
}

#[tauri::command]
fn process_images(payload: ProcessPayload) -> Result<ProcessSummary, String> {
    let summary_directory = payload.output_directory.clone().unwrap_or_else(default_output_directory);
    if summary_directory != "source" { fs::create_dir_all(&summary_directory).map_err(|e| e.to_string())?; }
    let output_dir_override = payload.output_directory.as_ref().map(PathBuf::from);
    // 整批共用一个时间戳，减少格式化开销并保证同批文件命名一致。
    let batch_timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();

    let compiled_regex = if payload.naming.regex_enabled && !payload.naming.regex_pattern.is_empty() {
        Some(RegexBuilder::new(&payload.naming.regex_pattern)
            .case_insensitive(payload.naming.regex_flags.contains('i'))
            .multi_line(payload.naming.regex_flags.contains('m'))
            .dot_matches_new_line(payload.naming.regex_flags.contains('s'))
            .build().map_err(|e| e.to_string())?)
    } else { None };

    // 2. 棰勫姞杞借祫婧愩€?
    // 2.1 棰勫姞杞?Overlay
    let preloaded_overlays: Vec<Option<RgbaImage>> = payload.overlays.iter().map(|o| {
        if !o.enabled { return None; }
        o.path.as_ref().and_then(|p| image::open(p).ok()).map(|img| img.to_rgba8())
    }).collect();

    // 2.2 棰勫鐞?Watermarks (Base64 瑙ｇ爜)
    let mut preloaded_watermarks = Vec::with_capacity(payload.watermarks.len());
    for wm in &payload.watermarks {
        let decoded = BASE64_STANDARD.decode(&wm.base64).map_err(|e| e.to_string())?;
        let img = image::load_from_memory_with_format(&decoded, ImageFormat::Png).map_err(|e| e.to_string())?;
        preloaded_watermarks.push(img.to_rgba8());
    }
    let path_reservations = Arc::new(Mutex::new(HashMap::<PathBuf, HashSet<String>>::new()));
    let created_dirs = Arc::new(Mutex::new(HashSet::<PathBuf>::new()));
    if let Some(dir) = output_dir_override.as_ref() {
        ensure_output_directory(dir, created_dirs.as_ref())?;
    }

    let items: Vec<Result<ProcessResultItem, ProcessErrorItem>> = payload.files.par_iter().enumerate().map(|(index, file)| {
        let res = (|| -> Result<ProcessResultItem, String> {
            let guessed_reader = image::ImageReader::open(&file.path)
                .map_err(|e| format!("Open error: {}", e))?
                .with_guessed_format()
                .map_err(|e| format!("Format error: {}", e))?;
            let format = guessed_reader
                .format()
                .ok_or_else(|| "Unsupported image format".to_string())?;
            if !is_supported_format(format) {
                return Err("Unsupported image format".to_string());
            }
            let file_name = output_name_with_regex(
                file,
                index,
                &payload.naming,
                compiled_regex.as_ref(),
                &batch_timestamp,
            )?;
            let output_directory = output_dir_override.clone().unwrap_or_else(|| source_directory(file));
            ensure_output_directory(&output_directory, created_dirs.as_ref())?;
            let output_path = reserve_unique_output_path(&output_directory, &file_name, path_reservations.as_ref())?;
            let output_format_str = if payload.naming.output_format.eq_ignore_ascii_case("original") { file.extension.as_str() } else { payload.naming.output_format.as_str() };

            if format == ImageFormat::Gif && output_format_str == "gif" {
                use image::AnimationDecoder;
                let gif_file = fs::File::open(&file.path).map_err(|e| format!("Read error: {}", e))?;
                let decoder = image::codecs::gif::GifDecoder::new(std::io::BufReader::new(gif_file))
                    .map_err(|e| e.to_string())?;
                let mut frames = decoder.into_frames();
                let first = frames.next().transpose().map_err(|e| e.to_string())?;
                if let Some(first_frame) = first {
                    let second = frames.next().transpose().map_err(|e| e.to_string())?;
                    if let Some(second_frame) = second {
                        let out_file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
                        let mut encoder = image::codecs::gif::GifEncoder::new(out_file);
                        let mut last_size = None;

                        for frame in std::iter::once(Ok(first_frame))
                            .chain(std::iter::once(Ok(second_frame)))
                            .chain(frames)
                        {
                            let frame = frame.map_err(|e| e.to_string())?;
                            let delay = frame.delay();
                            let buffer = frame.into_buffer();
                            let processed = process_single_frame_with_preloaded(DynamicImage::ImageRgba8(buffer), &payload, &preloaded_overlays, &preloaded_watermarks)?;
                            last_size = Some((processed.width(), processed.height()));
                            let new_frame = image::Frame::from_parts(processed.to_rgba8(), 0, 0, delay);
                            encoder.encode_frame(new_frame).map_err(|e| e.to_string())?;
                        }
                        let (out_w, out_h) = last_size.unwrap_or((file.width, file.height));
                        return Ok(ProcessResultItem { output_path: output_path.to_string_lossy().to_string(), width: out_w, height: out_h });
                    }

                    // 单帧 GIF：直接复用已解码首帧，避免再次打开文件。
                    let delay = first_frame.delay();
                    let buffer = first_frame.into_buffer();
                    let processed = process_single_frame_with_preloaded(
                        DynamicImage::ImageRgba8(buffer),
                        &payload,
                        &preloaded_overlays,
                        &preloaded_watermarks,
                    )?;
                    let out_file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
                    let mut encoder = image::codecs::gif::GifEncoder::new(out_file);
                    let new_frame = image::Frame::from_parts(processed.to_rgba8(), 0, 0, delay);
                    encoder.encode_frame(new_frame).map_err(|e| e.to_string())?;
                    return Ok(ProcessResultItem {
                        output_path: output_path.to_string_lossy().to_string(),
                        width: processed.width(),
                        height: processed.height(),
                    });
                }

                return Err("GIF has no frames".to_string());
            }

            // 非 GIF 的常规路径直接复用已经打开的 reader 解码，避免重复打开文件。
            let image = guessed_reader.decode().map_err(|e| e.to_string())?;
            let processed = process_single_frame_with_preloaded(image, &payload, &preloaded_overlays, &preloaded_watermarks)?;
            save_image(&processed, output_format_str, &output_path)?;
            Ok(ProcessResultItem { output_path: output_path.to_string_lossy().to_string(), width: processed.width(), height: processed.height() })
        })();

        match res {
            Ok(item) => Ok(item),
            Err(message) => Err(ProcessErrorItem {
                file_path: file.path.clone(),
                message,
            }),
        }
    }).collect();

    let (results, errors) = items.into_iter().fold((Vec::new(), Vec::new()), |(mut rs, mut es), item| {
        match item { Ok(r) => rs.push(r), Err(e) => es.push(e) }; (rs, es)
    });

    Ok(ProcessSummary { output_directory: summary_directory, results, errors })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_runtime_info,
            get_preview_data,
            pick_files,
            load_files_from_paths,
            pick_overlay,
            pick_output_directory,
            process_images,
            get_system_fonts
        ])
        .run(tauri::generate_context!())
        .expect("error while running EZCut");
}

