(function () {
  const translations = {
    en: {
      navFeatures: "Features",
      navPreview: "Preview",
      navDownload: "Download",
      heroEyebrow: "Batch Image Editor",
      heroTitle: "Fast, lightweight image editing for desktop.",
      heroBody:
        "EZCut helps you resize, crop, watermark, rename, and export multiple images with a clean desktop workflow on Windows and macOS.",
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
      heroTitle: "轻量、快速的桌面图片编辑工具。",
      heroBody:
        "EZCut 适合在 Windows 和 macOS 上进行批量图片尺寸调整、裁剪、水印、重命名和导出，界面直接围绕实际工作流设计。",
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
    },
    "zh-TW": {
      navFeatures: "功能",
      navPreview: "介面",
      navDownload: "下載",
      heroEyebrow: "批次圖片編輯器",
      heroTitle: "輕量、快速的桌面圖片編輯工具。",
      heroBody:
        "EZCut 適合在 Windows 和 macOS 上進行批次圖片尺寸調整、裁剪、浮水印、重新命名與匯出，介面直接圍繞實際工作流程設計。",
      downloadCurrent: "下載目前裝置版本",
      viewGithub: "查看 GitHub 倉庫",
      metaWindows: "Windows 10+",
      metaMac: "macOS 10.15+",
      metaPortable: "免安裝便攜版",
      featuresEyebrow: "能力",
      featuresTitle: "圍繞實際圖片生產流程打造。",
      featureBatchTitle: "批次處理",
      featureBatchBody: "一次拖入多張圖片，在同一個工作區中集中處理。",
      featurePreviewTitle: "即時預覽",
      featurePreviewBody: "裁剪、浮水印與圖層覆蓋都可以先預覽再匯出。",
      featureRenameTitle: "靈活命名",
      featureRenameBody: "支援樣板變數與正則規則來生成匯出檔名。",
      featureSmallTitle: "體積小，啟動快",
      featureSmallBody: "基於 Tauri 構建，啟動更快，整體體積也更輕。",
      previewEyebrow: "介面",
      previewSectionTitle: "緊湊而直接的雙欄工作佈局。",
      previewSectionBody:
        "左側持續顯示預覽與圖片列表，右側用可折疊面板整理輸出相關設定，適合連續處理多張圖片。",
      downloadEyebrow: "下載",
      downloadTitle: "選擇你的裝置版本。",
      downloadBody: "頁面會依照你目前的系統自動高亮推薦的下載項目。",
      downloadRecommended: "推薦",
      downloadIntel: "Intel Mac",
      downloadAppleSilicon: "Apple Silicon",
      downloadWindowsTitle: "Windows x64",
      downloadWindowsBody: "適用於 Windows 10 及以上系統",
      downloadMacIntelTitle: "macOS x64",
      downloadMacIntelBody: "適用於 Intel 晶片 Mac，最低 macOS 10.15",
      downloadMacArmTitle: "macOS arm64",
      downloadMacArmBody: "適用於 M 系列 Mac，最低 macOS 10.15"
    },
    ja: {
      navFeatures: "機能",
      navPreview: "プレビュー",
      navDownload: "ダウンロード",
      heroEyebrow: "バッチ画像エディター",
      heroTitle: "高速で軽量なデスクトップ画像編集ツール。",
      heroBody:
        "EZCut は Windows と macOS で、複数画像のリサイズ、切り抜き、透かし追加、リネーム、書き出しを効率よく行えるデスクトップアプリです。",
      downloadCurrent: "このデバイス向けにダウンロード",
      viewGithub: "GitHub で見る",
      metaWindows: "Windows 10+",
      metaMac: "macOS 10.15+",
      metaPortable: "ポータブル版",
      featuresEyebrow: "特長",
      featuresTitle: "実用的な画像制作フローのために設計。",
      featureBatchTitle: "バッチ処理",
      featureBatchBody: "複数の画像をまとめて読み込み、1 つの画面で整理して処理できます。",
      featurePreviewTitle: "ライブプレビュー",
      featurePreviewBody: "切り抜き、透かし、レイヤーの変更を出力前に確認できます。",
      featureRenameTitle: "柔軟な命名",
      featureRenameBody: "テンプレート変数と正規表現ルールで出力ファイル名を生成できます。",
      featureSmallTitle: "小さくて速い",
      featureSmallBody: "Tauri ベースなので、起動が速くアプリ容量も軽量です。",
      previewEyebrow: "インターフェース",
      previewSectionTitle: "作業に集中できるコンパクトな 2 カラム構成。",
      previewSectionBody:
        "左側にプレビューと画像一覧、右側に折りたたみ式の出力設定を配置し、連続作業しやすいレイアウトにしています。",
      downloadEyebrow: "ダウンロード",
      downloadTitle: "デバイスに合った版を選択。",
      downloadBody: "現在の環境に応じて、おすすめのダウンロード項目が自動で強調表示されます。",
      downloadRecommended: "おすすめ",
      downloadIntel: "Intel Mac",
      downloadAppleSilicon: "Apple Silicon",
      downloadWindowsTitle: "Windows x64",
      downloadWindowsBody: "Windows 10 以降向け",
      downloadMacIntelTitle: "macOS x64",
      downloadMacIntelBody: "Intel Mac 向け、最低 macOS 10.15",
      downloadMacArmTitle: "macOS arm64",
      downloadMacArmBody: "M シリーズ Mac 向け、最低 macOS 10.15"
    },
    ko: {
      navFeatures: "기능",
      navPreview: "미리보기",
      navDownload: "다운로드",
      heroEyebrow: "배치 이미지 편집기",
      heroTitle: "빠르고 가벼운 데스크톱 이미지 편집 도구.",
      heroBody:
        "EZCut은 Windows와 macOS에서 여러 이미지를 한 번에 리사이즈, 자르기, 워터마크 추가, 이름 변경, 내보내기 할 수 있도록 설계된 데스크톱 앱입니다.",
      downloadCurrent: "현재 기기에 맞는 버전 다운로드",
      viewGithub: "GitHub에서 보기",
      metaWindows: "Windows 10+",
      metaMac: "macOS 10.15+",
      metaPortable: "포터블 빌드",
      featuresEyebrow: "특징",
      featuresTitle: "실무용 이미지 작업 흐름에 맞춰 설계되었습니다.",
      featureBatchTitle: "배치 작업",
      featureBatchBody: "여러 이미지를 한 번에 불러와 하나의 작업 화면에서 처리할 수 있습니다.",
      featurePreviewTitle: "실시간 미리보기",
      featurePreviewBody: "자르기, 워터마크, 레이어 변경 내용을 내보내기 전에 확인할 수 있습니다.",
      featureRenameTitle: "유연한 이름 규칙",
      featureRenameBody: "템플릿 변수와 정규식을 사용해 출력 파일명을 만들 수 있습니다.",
      featureSmallTitle: "작고 빠름",
      featureSmallBody: "Tauri 기반이라 실행이 빠르고 전체 용량도 가볍습니다.",
      previewEyebrow: "인터페이스",
      previewSectionTitle: "작업에 집중할 수 있는 콤팩트한 2단 레이아웃.",
      previewSectionBody:
        "왼쪽에는 미리보기와 이미지 목록을 두고, 오른쪽에는 접이식 출력 설정 패널을 배치해 연속 작업에 적합합니다.",
      downloadEyebrow: "다운로드",
      downloadTitle: "기기에 맞는 버전을 선택하세요.",
      downloadBody: "현재 시스템을 기준으로 추천 다운로드 항목이 자동으로 강조 표시됩니다.",
      downloadRecommended: "추천",
      downloadIntel: "Intel Mac",
      downloadAppleSilicon: "Apple Silicon",
      downloadWindowsTitle: "Windows x64",
      downloadWindowsBody: "Windows 10 이상용",
      downloadMacIntelTitle: "macOS x64",
      downloadMacIntelBody: "Intel Mac용, 최소 macOS 10.15",
      downloadMacArmTitle: "macOS arm64",
      downloadMacArmBody: "M 시리즈 Mac용, 최소 macOS 10.15"
    }
  };

  const fallbackReleasePage = "https://github.com/Kaiyuan/ezcut/releases/latest";
  const platformLinks = {
    windows: fallbackReleasePage,
    "mac-x64": fallbackReleasePage,
    "mac-arm64": fallbackReleasePage
  };
  const assetMatchers = {
    windows: /windows-x64\.zip$/i,
    "mac-x64": /macos-x64\.zip$/i,
    "mac-arm64": /macos-arm64\.zip$/i
  };

  const languagePicker = document.getElementById("language-picker");
  const primaryDownload = document.getElementById("primary-download");
  const downloadCards = Array.from(document.querySelectorAll(".download-card"));
  const sponsorEyebrow = document.getElementById("sponsor-eyebrow");
  const sponsorTitle = document.getElementById("sponsor-title");
  const sponsorBody = document.getElementById("sponsor-body");

  const sponsorTranslations = {
    en: {
      eyebrow: "Support",
      title: "Sponsor EZCut",
      body: "If EZCut helps your daily workflow, you can support ongoing development here."
    },
    "zh-CN": {
      eyebrow: "赞助",
      title: "支持 EZCut",
      body: "如果 EZCut 对你的日常工作有帮助，欢迎在这里赞助支持项目持续开发。"
    },
    "zh-TW": {
      eyebrow: "贊助",
      title: "支持 EZCut",
      body: "如果 EZCut 對你的日常工作有幫助，歡迎在這裡贊助支持專案持續開發。"
    },
    ja: {
      eyebrow: "サポート",
      title: "EZCut を支援",
      body: "EZCut が日々の作業に役立っている場合は、こちらから開発を支援できます。"
    },
    ko: {
      eyebrow: "후원",
      title: "EZCut 후원",
      body: "EZCut이 일상적인 작업에 도움이 된다면 이곳에서 개발을 후원해 주세요."
    }
  };

  function detectLocale() {
    const raw = (navigator.language || "en").toLowerCase();

    if (raw.startsWith("zh-cn") || raw.startsWith("zh-sg")) return "zh-CN";
    if (raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-mo")) {
      return "zh-TW";
    }
    if (raw.startsWith("ja")) return "ja";
    if (raw.startsWith("ko")) return "ko";
    if (raw.startsWith("zh")) return "zh-CN";
    return "en";
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
    const sponsorDict = sponsorTranslations[locale] || sponsorTranslations.en;
    if (sponsorEyebrow) sponsorEyebrow.textContent = sponsorDict.eyebrow;
    if (sponsorTitle) sponsorTitle.textContent = sponsorDict.title;
    if (sponsorBody) sponsorBody.textContent = sponsorDict.body;
  }

  function applyPlatform(platform) {
    downloadCards.forEach((card) => {
      card.classList.toggle("is-detected", card.dataset.platform === platform);
      card.href = platformLinks[card.dataset.platform] || fallbackReleasePage;
    });
    primaryDownload.href = platformLinks[platform] || fallbackReleasePage;
  }

  async function hydrateLatestReleaseLinks() {
    try {
      const response = await fetch("https://api.github.com/repos/Kaiyuan/ezcut/releases/latest");
      if (!response.ok) return;
      const release = await response.json();
      const assets = Array.isArray(release.assets) ? release.assets : [];
      Object.keys(assetMatchers).forEach((platform) => {
        const asset = assets.find((item) => assetMatchers[platform].test(item.name));
        if (asset && asset.browser_download_url) {
          platformLinks[platform] = asset.browser_download_url;
        }
      });
      applyPlatform(detectPlatform());
    } catch (_error) {
      // Keep fallback links pointing at the latest release page.
    }
  }

  const locale = detectLocale();
  const platform = detectPlatform();
  languagePicker.value = locale;
  translate(locale);
  applyPlatform(platform);
  void hydrateLatestReleaseLinks();

  languagePicker.addEventListener("change", (event) => {
    translate(event.target.value);
  });
})();
