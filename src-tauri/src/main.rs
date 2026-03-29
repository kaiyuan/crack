#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use chrono::Local;
use image::imageops::{self, FilterType};
use image::{DynamicImage, ImageFormat, RgbaImage};
use regex::RegexBuilder;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri::api::dialog::blocking::FileDialogBuilder;

// 前端用于展示与导出的文件元信息。
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
struct OverlayOptions {
    enabled: bool,
    path: Option<String>,
    scale_percent: u32,
    opacity: f32,
    margin: u32,
    position: String,
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
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ProcessPayload {
    files: Vec<ImageFile>,
    output_directory: Option<String>,
    resize: ResizeOptions,
    crop: CropOptions,
    overlay: OverlayOptions,
    naming: NamingOptions,
    watermark_png_base64: Option<String>,
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
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct PreviewData {
    data_url: String,
}

// 统一限定当前版本可处理的图片格式。
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
    }
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

fn process_single_frame(
    image: DynamicImage,
    payload: &ProcessPayload,
) -> Result<DynamicImage, String> {
    let image = crop_image(image, &payload.crop);
    let mut image = resize_image(image, &payload.resize);
    apply_overlay(&mut image, &payload.overlay)?;
    apply_watermark(&mut image, &payload.watermark_png_base64)?;
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
    margin: u32,
) -> (i64, i64) {
    let (vertical, horizontal) = position.split_once('-').unwrap_or(("center", "center"));
    let left = match horizontal {
        "left" => margin as i64,
        "right" => base_width.saturating_sub(top_width + margin) as i64,
        _ => (base_width.saturating_sub(top_width) / 2) as i64,
    };
    let top = match vertical {
        "top" => margin as i64,
        "bottom" => base_height.saturating_sub(top_height + margin) as i64,
        _ => (base_height.saturating_sub(top_height) / 2) as i64,
    };
    (left.max(0), top.max(0))
}

fn apply_alpha(image: &mut RgbaImage, opacity: f32) {
    for pixel in image.pixels_mut() {
        let alpha = (pixel[3] as f32 * opacity.clamp(0.0, 1.0)).round() as u8;
        pixel[3] = alpha;
    }
}

fn apply_overlay(base: &mut DynamicImage, overlay: &OverlayOptions) -> Result<(), String> {
    if !overlay.enabled {
        return Ok(());
    }

    let Some(path) = &overlay.path else {
        return Ok(());
    };

    let base_width = base.width();
    let base_height = base.height();
    let mut top = image::open(path).map_err(|error| error.to_string())?.to_rgba8();
    let target_width =
        ((base_width as f32) * (overlay.scale_percent.max(1) as f32 / 100.0)).round() as u32;
    let safe_target_width = target_width.max(1);
    let scale = if top.width() == 0 {
        1.0
    } else {
        safe_target_width as f32 / top.width() as f32
    };
    let safe_target_height = ((top.height() as f32) * scale).round().max(1.0) as u32;

    top = imageops::resize(
        &top,
        safe_target_width,
        safe_target_height,
        FilterType::Lanczos3,
    );
    apply_alpha(&mut top, overlay.opacity);

    let (left, top_pos) = overlay_position(
        base_width,
        base_height,
        top.width(),
        top.height(),
        &overlay.position,
        overlay.margin,
    );

    imageops::overlay(base, &DynamicImage::ImageRgba8(top), left, top_pos);
    Ok(())
}

fn apply_watermark(base: &mut DynamicImage, watermark_png_base64: &Option<String>) -> Result<(), String> {
    let Some(encoded) = watermark_png_base64 else {
        return Ok(());
    };

    let decoded = BASE64_STANDARD
        .decode(encoded)
        .map_err(|error| error.to_string())?;
    let overlay = image::load_from_memory_with_format(&decoded, ImageFormat::Png)
        .map_err(|error| error.to_string())?
        .resize(base.width(), base.height(), FilterType::Lanczos3)
        .to_rgba8();

    imageops::overlay(base, &DynamicImage::ImageRgba8(overlay), 0, 0);
    Ok(())
}

fn output_name(file: &ImageFile, index: usize, naming: &NamingOptions) -> Result<String, String> {
    let mut base_name = Path::new(&file.path)
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    if naming.regex_enabled && !naming.regex_pattern.is_empty() {
        let regex = RegexBuilder::new(&naming.regex_pattern)
            .case_insensitive(naming.regex_flags.contains('i'))
            .multi_line(naming.regex_flags.contains('m'))
            .dot_matches_new_line(naming.regex_flags.contains('s'))
            .build()
            .map_err(|error| error.to_string())?;
        base_name = regex
            .replace_all(&base_name, naming.regex_replacement.as_str())
            .to_string();
    }

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let output_ext = if naming.output_format.eq_ignore_ascii_case("original") {
        file.extension.clone()
    } else {
        naming.output_format.to_ascii_lowercase()
    };
    let rendered = naming
        .template
        .replace("{name}", &base_name)
        .replace("{index}", &format!("{:02}", index + 1))
        .replace("{ext}", &output_ext)
        .replace("{timestamp}", &timestamp)
        .replace("{width}", &file.width.to_string())
        .replace("{height}", &file.height.to_string());

    let safe = rendered
        .chars()
        .map(|ch| if "<>:\"/\\|?*".contains(ch) { '_' } else { ch })
        .collect::<String>()
        .trim()
        .to_string();

    if safe.is_empty() {
        return Ok(format!("export_{:02}.{}", index + 1, output_ext));
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

    let rgba = image.to_rgba8();
    let (width, height) = rgba.dimensions();
    let file = fs::File::create(path).map_err(|error| error.to_string())?;
    let mut writer = std::io::BufWriter::new(file);

    match format_name {
        "jpg" | "jpeg" => {
            let rgb = image.to_rgb8();
            let (rgb_width, rgb_height) = rgb.dimensions();
            let encoder = JpegEncoder::new_with_quality(&mut writer, 82);
            encoder
                .write_image(rgb.as_raw(), rgb_width, rgb_height, image::ColorType::Rgb8.into())
                .map_err(|error| error.to_string())
        }
        "webp" => {
            let encoder = WebPEncoder::new_lossless(&mut writer);
            encoder
                .write_image(rgba.as_raw(), width, height, image::ColorType::Rgba8.into())
                .map_err(|error| error.to_string())
        }
        "bmp" => image.save_with_format(path, ImageFormat::Bmp).map_err(|error| error.to_string()),
        "gif" => image.save_with_format(path, ImageFormat::Gif).map_err(|error| error.to_string()),
        "tiff" => image.save_with_format(path, ImageFormat::Tiff).map_err(|error| error.to_string()),
        "tga" => image.save_with_format(path, ImageFormat::Tga).map_err(|error| error.to_string()),
        _ => {
            let encoder = PngEncoder::new_with_quality(
                &mut writer,
                CompressionType::Best,
                PngFilterType::Adaptive
            );
            encoder
                .write_image(rgba.as_raw(), width, height, image::ColorType::Rgba8.into())
                .map_err(|error| error.to_string())
        }
    }
}

#[tauri::command]
fn process_images(payload: ProcessPayload) -> Result<ProcessSummary, String> {
    let summary_directory = payload
        .output_directory
        .clone()
        .unwrap_or_else(default_output_directory);

    if summary_directory != "source" {
        fs::create_dir_all(&summary_directory).map_err(|error| error.to_string())?;
    }

    let mut results = Vec::new();
    let mut errors = Vec::new();

    for (index, file) in payload.files.iter().enumerate() {
        let result = (|| -> Result<ProcessResultItem, String> {
            let file_bytes = fs::read(&file.path).map_err(|error| error.to_string())?;
            let format = image::guess_format(&file_bytes).map_err(|error| error.to_string())?;
            
            let file_name = output_name(file, index, &payload.naming)?;
            let output_directory = payload
                .output_directory
                .clone()
                .map(PathBuf::from)
                .unwrap_or_else(|| source_directory(file));
            fs::create_dir_all(&output_directory).map_err(|error| error.to_string())?;
            let output_path = output_directory.join(file_name);
            let output_format_str = if payload.naming.output_format.eq_ignore_ascii_case("original") {
                file.extension.as_str()
            } else {
                payload.naming.output_format.as_str()
            };

            // 特殊处理 GIF 动图分帧。
            if format == ImageFormat::Gif && output_format_str == "gif" {
                use image::AnimationDecoder;
                let decoder = image::codecs::gif::GifDecoder::new(Cursor::new(&file_bytes)).map_err(|e| e.to_string())?;
                let frames = decoder.into_frames().collect::<image::ImageResult<Vec<image::Frame>>>().map_err(|e: image::ImageError| e.to_string())?;
                
                if frames.len() > 1 {
                    let out_file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
                    let mut encoder = image::codecs::gif::GifEncoder::new(out_file);
                    
                    for frame in frames {
                        let delay = frame.delay();
                        let buffer = frame.into_buffer();
                        let dyn_img = DynamicImage::ImageRgba8(buffer);
                        let processed = process_single_frame(dyn_img, &payload)?;
                        let new_frame = image::Frame::from_parts(processed.to_rgba8(), 0, 0, delay);
                        encoder.encode_frame(new_frame).map_err(|e| e.to_string())?;
                    }
                    
                    return Ok(ProcessResultItem {
                        output_path: output_path.to_string_lossy().to_string(),
                        width: 0,
                        height: 0,
                    });
                }
            }

            let image = image::load_from_memory_with_format(&file_bytes, format).map_err(|error| error.to_string())?;
            let processed = process_single_frame(image, &payload)?;
            save_image(&processed, output_format_str, &output_path)?;

            Ok(ProcessResultItem {
                output_path: output_path.to_string_lossy().to_string(),
                width: processed.width(),
                height: processed.height(),
            })
        })();

        match result {
            Ok(item) => results.push(item),
            Err(message) => errors.push(ProcessErrorItem {
                file_path: file.path.clone(),
                message,
            }),
        }
    }

    Ok(ProcessSummary {
        output_directory: summary_directory,
        results,
        errors,
    })
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
            process_images
        ])
        .run(tauri::generate_context!())
        .expect("error while running EZCut");
}
