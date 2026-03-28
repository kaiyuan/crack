(function () {
  const translations = {
    en: {
      navFeatures: "Features",
      navPreview: "Preview",
      navDownload: "Download",
      heroEyebrow: "Batch Image Editor",
      heroTitle: "Fast, lightweight image editing for desktop.",
      heroBody:
        "crack helps you resize, crop, watermark, rename, and export multiple images with a clean desktop workflow on Windows and macOS.",
      downloadCurrent: "Download for your device",
      viewGithub: "View on GitHub",
      metaWindows: "Windows 10+",
      metaMac: "macOS 10.15+",
      metaPortable: "Portable build",
      featuresEyebrow: "Capabilities",
      featuresTitle: "Built for practical image production work.",
      featureBatchTitle: "Batch workflow",
      featureBatchBody: "Drag in multiple images and process them in one clean session.",
      featurePreviewTitle: "Live preview",
      featurePreviewBody: "Preview crop, watermark, and layer changes before export.",
      featureRenameTitle: "Flexible naming",
      featureRenameBody: "Use templates and regex rules to generate export filenames.",
      featureSmallTitle: "Small and fast",
      featureSmallBody: "Built with Tauri for quick startup and a lightweight footprint.",
      previewEyebrow: "Interface",
      previewSectionTitle: "A compact layout focused on the work.",
      previewSectionBody:
        "The left side keeps preview and image list visible, while the right side groups output controls into collapsible panels.",
      downloadEyebrow: "Downloads",
      downloadTitle: "Choose your device.",
      downloadBody:
        "The recommended build is highlighted automatically based on your current system.",
      downloadRecommended: "Recommended",
      downloadIntel: "Intel Mac",
      downloadAppleSilicon: "Apple Silicon",
      downloadWindowsTitle: "Windows x64",
      downloadWindowsBody: "For Windows 10 and later",
      downloadMacIntelTitle: "macOS x64",
      downloadMacIntelBody: "For Intel-based Macs on macOS 10.15+",
      downloadMacArmTitle: "macOS arm64",
      downloadMacArmBody: "For M-series Macs on macOS 10.15+"
    },
    "zh-CN": {
      navFeatures: "功能",
      navPreview: "界面",
      navDownload: "下载",
      heroEyebrow: "批量图片编辑器",
      heroTitle: "轻量、快速的桌面图片处理工具。",
      heroBody:
        "crack 适合在 Windows 和 macOS 上进行批量图片尺寸调整、裁剪、水印、重命名和导出，界面直接围绕实际工作流设计。",
      downloadCurrent: "下载当前设备版本",
      viewGithub: "查看 GitHub 仓库",
      metaWindows: "Windows 10+",
      metaMac: "macOS 10.15+",
      metaPortable: "免安装便携版",
      featuresEyebrow: "能力",
      featuresTitle: "围绕实际图片生产流程打造。",
      featureBatchTitle: "批量处理",
      featureBatchBody: "一次拖入多张图片，在同一个工作区里集中处理。",
      featurePreviewTitle: "实时预览",
      featurePreviewBody: "裁剪、水印和图层覆盖都可以先预览再导出。",
      featureRenameTitle: "灵活命名",
      featureRenameBody: "支持模板变量和正则规则来生成导出文件名。",
      featureSmallTitle: "体积小，启动快",
      featureSmallBody: "基于 Tauri 构建，启动更快，整体体积也更轻。",
      previewEyebrow: "界面",
      previewSectionTitle: "紧凑而直接的双栏工作布局。",
      previewSectionBody:
        "左侧始终显示预览和图片列表，右侧用折叠面板组织输出相关设置，适合连续处理多张图片。",
      downloadEyebrow: "下载",
      downloadTitle: "选择你的设备版本。",
      downloadBody: "页面会根据你当前的系统自动高亮推荐的下载项。",
      downloadRecommended: "推荐",
      downloadIntel: "Intel Mac",
      downloadAppleSilicon: "Apple Silicon",
      downloadWindowsTitle: "Windows x64",
      downloadWindowsBody: "适用于 Windows 10 及以上系统",
      downloadMacIntelTitle: "macOS x64",
      downloadMacIntelBody: "适用于 Intel 芯片 Mac，最低 macOS 10.15",
      downloadMacArmTitle: "macOS arm64",
      downloadMacArmBody: "适用于 M 系列 Mac，最低 macOS 10.15"
    }
  };

  const platformLinks = {
    windows: "https://github.com/Kaiyuan/crack/releases/latest/download/crack-windows-x64.zip",
    "mac-x64": "https://github.com/Kaiyuan/crack/releases/latest/download/crack-macos-x64.zip",
    "mac-arm64": "https://github.com/Kaiyuan/crack/releases/latest/download/crack-macos-arm64.zip"
  };

  const languagePicker = document.getElementById("language-picker");
  const primaryDownload = document.getElementById("primary-download");
  const downloadCards = Array.from(document.querySelectorAll(".download-card"));

  function detectLocale() {
    const raw = navigator.language || "en";
    return raw.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
  }

  function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (ua.includes("windows") || platform.includes("win")) return "windows";
    if (ua.includes("mac") || platform.includes("mac")) {
      const isAppleSilicon =
        ua.includes("arm") ||
        ua.includes("apple silicon") ||
        platform.includes("arm") ||
        platform.includes("iphone") ||
        platform.includes("ipad");
      return isAppleSilicon ? "mac-arm64" : "mac-x64";
    }
    return "windows";
  }

  function translate(locale) {
    const dict = translations[locale] || translations.en;
    document.documentElement.lang = locale;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      node.textContent = dict[key] || translations.en[key] || key;
    });
  }

  function applyPlatform(platform) {
    downloadCards.forEach((card) => {
      card.classList.toggle("is-detected", card.dataset.platform === platform);
    });
    primaryDownload.href = platformLinks[platform] || "https://github.com/Kaiyuan/crack/releases/latest";
  }

  const locale = detectLocale();
  const platform = detectPlatform();
  languagePicker.value = locale;
  translate(locale);
  applyPlatform(platform);

  languagePicker.addEventListener("change", (event) => {
    translate(event.target.value);
  });
})();
