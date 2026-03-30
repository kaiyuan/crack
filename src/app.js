(function(){
/* EZCut 前端主流程：Tauri桥接、状态管理、实时预览与批量导出。 */
const T=window.__TAURI__||{},I=window.__TAURI_INTERNALS__||{};
const invoke=I.invoke||T.core?.invoke||T.tauri?.invoke||T.tauri?.invoke||null;
const listen=T.event?.listen||T.listen||null;
const convert=I.convertFileSrc||T.core?.convertFileSrc||T.tauri?.convertFileSrc||T.convertFileSrc||((p)=>p);

/* 多语言文案表。 */
const tr={en:{appTitle:'EZCut',appSubtitle:'Batch image editor',previewEyebrow:'Preview',previewTitle:'Image Preview',addImages:'Add Images',dropHere:'Drop images here',dropSupport:'PNG, JPG, WEBP, TIFF, BMP, GIF',noImageSelected:'No image selected',libraryEyebrow:'Library',imagesTitle:'Images',noImagesYet:'No images yet.',settingsEyebrow:'Settings',outputSettings:'Output Settings',resize:'Resize',crop:'Crop',textWatermark:'Text Watermark',overlayImage:'Overlay Image',filename:'Filename',export:'Export',width:'Width',height:'Height',mode:'Mode',fit:'Fit',fill:'Fill',stretch:'Stretch',enableThis:'Enable this section',text:'Text',size:'Size',opacity:'Opacity',margin:'Margin',color:'Color',position:'Position',topLeft:'Top Left',topCenter:'Top Center',topRight:'Top Right',centerLeft:'Left',center:'Center',centerRight:'Right',bottomLeft:'Bottom Left',bottomCenter:'Bottom',bottomRight:'Bottom Right',choose:'Choose',noOverlaySelected:'No overlay selected',scalePercent:'Scale %',template:'Template',exportCategory:'Export Category',keepOriginal:'Keep original',useRegexRename:'Use regex rename',pattern:'Pattern',replace:'Replace',flags:'Flags',chooseSaveFolder:'Choose Save Folder',defaultSaveFolder:'Default: save next to each source image',defaultSaveFolderRuntime:'Default: saved next to each source image',clearAfterExport:'Clear image list after export',ready:'Ready',remove:'Remove',loadedCount:'Loaded {count} image(s)',overlaySelected:'Overlay selected',customSaveFolderUpdated:'Custom save folder updated',customSaveFolder:'Custom save folder: {path}',processing:'Processing...',tauriUnavailable:'Tauri API not available',addAtLeastOne:'Please add at least one image',doneSummary:'Done: {ok} exported, {fail} failed',processingFailed:'Processing failed: {error}',droppedCount:'Dropped {count} image(s)',remainingCount:'Remaining {count} image(s)',saved:'Saved: {path}',failed:'Failed: {path} - {message}',selectedMeta:'{name} · {width} x {height} · {size}',placeholderLeaveEmpty:'Leave empty',placeholderOriginalWidth:'Original width',placeholderOriginalHeight:'Original height',placeholderWatermark:'Watermark text',placeholderRegex:'^IMG_',placeholderReplace:'product_',close:'Close',regexHelpTitle:'Filename Regex Guide',addText:'+ Add Text',addImage:'+ Add Image',layerX:'X Coord',layerY:'Y Coord',fontFamily:'Font Family',regexHelpContent:'<h4>Basic Syntax</h4><ul><li><code>^</code>: Start of string</li><li><code>$</code>: End of string</li><li><code>.*</code>: Any characters</li></ul><h4>Capture Groups</h4><ul><li>Use <code>( )</code> to group parts of the name.</li><li>Use <code>$1</code>, <code>$2</code> in Replace field to refer to these groups.</li></ul><h4>Example</h4><ul><li>Pattern: <code>^IMG_(\d+)</code></li><li>Replace: <code>Product_$1</code></li><li>Result: <code>IMG_001.jpg</code> &rarr; <code>Product_001.jpg</code></li></ul>'},'zh-CN':{appTitle:'EZCut',appSubtitle:'批量图片编辑器',previewEyebrow:'预览',previewTitle:'图片预览',addImages:'添加图片',dropHere:'将图片拖到这里',dropSupport:'支持 PNG、JPG、WEBP、TIFF、BMP、GIF',noImageSelected:'未选择图片',libraryEyebrow:'列表',imagesTitle:'图片列表',noImagesYet:'还没有图片。',settingsEyebrow:'设置',outputSettings:'输出设置',resize:'修改尺寸',crop:'裁剪',textWatermark:'文字水印',overlayImage:'图层覆盖',filename:'文件名',export:'导出',width:'宽度',height:'高度',mode:'模式',fit:'等比适配',fill:'铺满裁切',stretch:'强制拉伸',enableThis:'启用此分组',text:'文字',size:'大小',opacity:'透明度',margin:'边距',color:'颜色',position:'位置',topLeft:'左上',topCenter:'上中',topRight:'右上',centerLeft:'左中',center:'居中',centerRight:'右中',bottomLeft:'左下',bottomCenter:'下中',bottomRight:'右下',choose:'选择',noOverlaySelected:'未选择覆盖图层',scalePercent:'缩放 %',template:'模板',exportCategory:'导出分类',keepOriginal:'保持原格式',useRegexRename:'启用正则改名',pattern:'正则',replace:'替换',flags:'标志',chooseSaveFolder:'选择保存目录',defaultSaveFolder:'默认保存到每张原图所在目录',defaultSaveFolderRuntime:'默认保存到每张原图所在目录',clearAfterExport:'导出后清空图片列表',ready:'就绪',remove:'移除',loadedCount:'已载入 {count} 张图片',overlaySelected:'已选择覆盖图层',customSaveFolderUpdated:'已更新自定义保存目录',customSaveFolder:'自定义保存目录：{path}',processing:'正在处理...',tauriUnavailable:'Tauri 接口不可用',addAtLeastOne:'请至少添加一张图片',doneSummary:'处理完成：成功 {ok} 张，失败 {fail} 张',processingFailed:'处理失败：{error}',droppedCount:'已拖入 {count} 张图片',remainingCount:'剩余 {count} 张图片',saved:'已保存：{path}',failed:'失败：{path} - {message}',selectedMeta:'{name} · {width} x {height} · {size}',placeholderLeaveEmpty:'留空则不限制',placeholderOriginalWidth:'原图宽度',placeholderOriginalHeight:'原图高度',placeholderWatermark:'输入水印文字',placeholderRegex:'^IMG_',placeholderReplace:'product_',close:'关闭',regexHelpTitle:'文件名正则手册',addText:'+ 添加文字',addImage:'+ 添加图片',layerX:'X 坐标',layerY:'Y 坐标',fontFamily:'字体',regexHelpContent:'<h4>基础语法</h4><ul><li><code>^</code>：匹配开头</li><li><code>$</code>：匹配结尾</li><li><code>.*</code>：匹配任意字符</li></ul><h4>捕获组</h4><ul><li>使用 <code>( )</code> 包裹需要保留的部分。</li><li>在“替换”栏中使用 <code>$1</code>, <code>$2</code> 引用这些部分。</li></ul><h4>实际案例</h4><ul><li>正则：<code>^IMG_(\d+)</code></li><li>替换：<code>产品_$1</code></li><li>效果：<code>IMG_001.jpg</code> &rarr; <code>产品_001.jpg</code></li></ul>'},'zh-TW':{appTitle:'EZCut',appSubtitle:'批量圖片編輯器',previewEyebrow:'預覽',previewTitle:'圖片預覽',addImages:'新增圖片',dropHere:'將圖片拖曳至此',dropSupport:'支援 PNG、JPG、WEBP、TIFF、BMP、GIF',noImageSelected:'未選擇圖片',libraryEyebrow:'列表',imagesTitle:'圖片清單',noImagesYet:'暫無圖片。',settingsEyebrow:'設定',outputSettings:'輸出設定',resize:'調整大小',crop:'裁剪',textWatermark:'文字浮水印',overlayImage:'圖層疊加',filename:'檔案名稱',export:'匯出',width:'寬度',height:'高度',mode:'模式',fit:'等比縮放',fill:'鋪滿裁切',stretch:'強制拉伸',enableThis:'啟用此分組',text:'文字',size:'大小',opacity:'不透明度',margin:'邊距',color:'顏色',position:'位置',topLeft:'左上',topCenter:'上中',topRight:'右上',centerLeft:'左中',center:'居中',centerRight:'右中',bottomLeft:'左下',bottomCenter:'下中',bottomRight:'右下',choose:'選擇',noOverlaySelected:'未選擇疊加圖層',scalePercent:'縮放 %',template:'模板',exportCategory:'匯出分類',keepOriginal:'保留原始格式',useRegexRename:'使用正則更名',pattern:'正則',replace:'替換',flags:'標記',chooseSaveFolder:'選擇儲存目錄',defaultSaveFolder:'預設儲存到每張原圖所在目錄',defaultSaveFolderRuntime:'預設儲存到每張原圖所在目錄',clearAfterExport:'匯出後清空清單',ready:'就緒',remove:'移除',loadedCount:'已載入 {count} 張圖片',overlaySelected:'已選擇疊加圖層',customSaveFolderUpdated:'已更新自定義儲存目錄',customSaveFolder:'自定義儲存目錄：{path}',processing:'處理中...',tauriUnavailable:'Tauri 接口不可用',addAtLeastOne:'請至少新增一張圖片',doneSummary:'處理完成：成功 {ok} 張，失敗 {fail} 張',processingFailed:'處理失敗：{error}',droppedCount:'已拖入 {count} 個檔案',remainingCount:'剩餘 {count} 張',saved:'已儲存：{path}',failed:'失敗：{path} - {message}',selectedMeta:'{name} · {width} x {height} · {size}',placeholderLeaveEmpty:'留空不限制',placeholderOriginalWidth:'原始寬度',placeholderOriginalHeight:'原始高度',placeholderWatermark:'輸入浮水印文字',placeholderRegex:'^IMG_',placeholderReplace:'product_',close:'關閉',regexHelpTitle:'檔案名稱正則手冊',addText:'+ 新增文字',addImage:'+ 新增圖片',layerX:'X 座標',layerY:'Y 座標',fontFamily:'字體',regexHelpContent:'<h4>基礎語法</h4><ul><li><code>^</code>：匹配開頭</li><li><code>$</code>：匹配結尾</li><li><code>.*</code>：匹配任意字元</li></ul><h4>捕獲組</h4><ul><li>使用 <code>( )</code> 包裹需要保留的部分。</li><li>在「替換」欄中使用 <code>$1</code>, <code>$2</code> 引用這些部分。</li></ul>'},'ja':{appTitle:'EZCut',appSubtitle:'一括画像エディタ',previewEyebrow:'プレビュー',previewTitle:'画像プレビュー',addImages:'画像を追加',dropHere:'ここに画像をドロップ',dropSupport:'PNG, JPG, WEBP, TIFF, BMP, GIF 対応',noImageSelected:'画像が選択されていません',libraryEyebrow:'ライブラリ',imagesTitle:'画像リスト',noImagesYet:'画像がありません。',settingsEyebrow:'設定',outputSettings:'出力設定',resize:'サイズ変更',crop:'切り抜き',textWatermark:'テキスト透かし',overlayImage:'画像オーバーレイ',filename:'ファイル名',export:'エクスポート',width:'幅',height:'高さ',mode:'モード',fit:'フィット',fill:'塗りつぶし',stretch:'ストレッチ',enableThis:'有効化',text:'テキスト',size:'サイズ',opacity:'不透明度',margin:'マージン',color:'色',position:'位置',topLeft:'左上',topCenter:'上中央',topRight:'右上',centerLeft:'左中央',center:'中央',centerRight:'右中央',bottomLeft:'左下',bottomCenter:'下中央',bottomRight:'右下',choose:'選択',noOverlaySelected:'未選択',scalePercent:'スケール %',template:'テンプレート',exportCategory:'エクスポート',keepOriginal:'オリジナルを保持',useRegexRename:'正規表現で変更',pattern:'パターン',replace:'置換',flags:'フラグ',chooseSaveFolder:'保存先を選択',defaultSaveFolder:'デフォルト：元の場所',defaultSaveFolderRuntime:'デフォルト：元の場所',clearAfterExport:'完了後にリストをクリア',ready:'準備完了',remove:'削除',loadedCount:'{count} 枚読み込み済み',overlaySelected:'オーバーレイ選択済み',customSaveFolderUpdated:'保存先を更新しました',customSaveFolder:'保存先：{path}',processing:'処理中...',tauriUnavailable:'Tauri 使用不可',addAtLeastOne:'画像を追加してください',doneSummary:'完了：成功 {ok}, 失敗 {fail}',processingFailed:'失敗：{error}',droppedCount:'{count} 個ドロップ',remainingCount:'残り {count} 枚',saved:'保存：{path}',failed:'失敗：{path} - {message}',selectedMeta:'{name} · {width} x {height} · {size}',placeholderLeaveEmpty:'空のままにする',placeholderOriginalWidth:'元の幅',placeholderOriginalHeight:'元の高さ',placeholderWatermark:'テキストを入力',placeholderRegex:'^IMG_',placeholderReplace:'product_',close:'閉じる',regexHelpTitle:'正規表現ヘルプ',addText:'+ テキスト追加',addImage:'+ 画像追加',layerX:'X 座標',layerY:'Y 座標',fontFamily:'フォント',regexHelpContent:'<h4>基本構文</h4><ul><li><code>^</code>：先頭</li><li><code>$</code>：末尾</li><li><code>.*</code>：任意の文字</li></ul><h4>キャプチャグループ</h4><ul><li><code>( )</code> で囲んでグループ化します。</li><li>置換で <code>$1</code> や <code>$2</code> を使って参照します。</li></ul>'},'ko':{appTitle:'EZCut',appSubtitle:'일괄 이미지 편집기',previewEyebrow:'미리보기',previewTitle:'이미지 미리보기',addImages:'이미지 추가',dropHere:'여기에 이미지 놓기',dropSupport:'PNG, JPG, WEBP, TIFF, BMP, GIF 지원',noImageSelected:'선택된 이미지 없음',libraryEyebrow:'라이브러리',imagesTitle:'이미지 목록',noImagesYet:'이미지가 없습니다.',settingsEyebrow:'설정',outputSettings:'출력 설정',resize:'크기 조절',crop:'자르기',textWatermark:'텍스트 워터마크',overlayImage:'이미지 오버레이',filename:'파일명',export:'내보내기',width:'너비',height:'높이',mode:'모드',fit:'맞춤',fill:'채우기',stretch:'늘리기',enableThis:'사용',text:'텍스트',size:'크기',opacity:'불투명도',margin:'여백',color:'색상',position:'위치',topLeft:'왼쪽 상단',topCenter:'상단 중앙',topRight:'오른쪽 상단',centerLeft:'왼쪽 중앙',center:'중앙',centerRight:'오른쪽 중앙',bottomLeft:'왼쪽 하단',bottomCenter:'하단 중앙',bottomRight:'오른쪽 하단',choose:'선택',noOverlaySelected:'선택 안 함',scalePercent:'비율 %',template:'템플릿',exportCategory:'내보내기',keepOriginal:'원본 유지',useRegexRename:'정규식 이름 변경',pattern:'패턴',replace:'교체',flags:'플래그',chooseSaveFolder:'저장 폴더 선택',defaultSaveFolder:'기본: 원본 위치',defaultSaveFolderRuntime:'기본: 원본 위치',clearAfterExport:'완료 후 목록 비우기',ready:'준비 완료',remove:'제거',loadedCount:'{count}개 로드됨',overlaySelected:'오버레이 선택됨',customSaveFolderUpdated:'저장 폴더 업데이트됨',customSaveFolder:'저장 폴더: {path}',processing:'처리 중...',tauriUnavailable:'Tauri 사용 불가',addAtLeastOne:'이미지를 추가하세요',doneSummary:'완료: 성공 {ok}, 실패 {fail}',processingFailed:'실패: {error}',droppedCount:'{count}개 드롭됨',remainingCount:'남은 항목 {count}개',saved:'저장: {path}',failed:'실패: {path} - {message}',selectedMeta:'{name} · {width} x {height} · {size}',placeholderLeaveEmpty:'비워두기',placeholderOriginalWidth:'원본 너비',placeholderOriginalHeight:'원본 높이',placeholderWatermark:'텍스트 입력',placeholderRegex:'^IMG_',placeholderReplace:'product_',close:'닫기',regexHelpTitle:'정규식 도움말',addText:'+ 텍스트 추가',addImage:'+ 이미지 추가',layerX:'X 좌표',layerY:'Y 좌표',fontFamily:'글꼴',regexHelpContent:'<h4>基本 구문</h4><ul><li><code>^</code>: 시작</li><li><code>$</code>: 끝</li><li><code>.*</code>: 모든 문자</li></ul><h4>캡처 그룹</h4><ul><li><code>( )</code>를 사용하여 그룹화합니다.</li><li>교체 필드에서 <code>$1</code>, <code>$2</code>로 참조합니다.</li></ul>'}};

/* 运行期状态：增加对多图层（watermarks, overlays）的支持。 */
const s={files:[],selectedId:null,outputDirectory:'',platform:'windows',locale:'en',isDragOverlayVisible:false,previewCache:{},previewToken:0,previewImage:null,previewCropRect:null,watermarks:[],overlays:[],interaction:null,fonts:[]};
const e={windowShell:document.querySelector('.window-shell'),leftColumn:document.getElementById('left-column'),fileInput:document.getElementById('file-input'),imageList:document.getElementById('image-list'),imageCount:document.getElementById('image-count'),previewCanvas:document.getElementById('preview-canvas'),previewMeta:document.getElementById('preview-meta'),pickFilesButton:document.getElementById('pick-files-button'),watermarkList:document.getElementById('watermark-list'),overlayList:document.getElementById('overlay-list'),addWatermarkBtn:document.getElementById('add-watermark-button'),addOverlayBtn:document.getElementById('add-overlay-button'),pickOutputButton:document.getElementById('pick-output-button'),outputDirectory:document.getElementById('output-directory'),processButton:document.getElementById('process-button'),clearAfterExport:document.getElementById('clear-after-export'),statusBox:document.getElementById('status-box'),resultList:document.getElementById('result-list'),dropOverlay:document.getElementById('drop-overlay'),languagePicker:document.getElementById('language-picker'),regexModal:document.getElementById('regex-modal'),regexHelpButton:document.getElementById('regex-help-button'),closeModalButtons:document.querySelectorAll('#close-modal, #close-modal-btn'),regexHelpBody:document.getElementById('regex-help-body')};
let timer=null,isRendering=false;
const n=(v,min,max)=>Math.round(Math.min(max,Math.max(min,v)));
const loc=(raw)=>{if(!raw)return'en';const v=raw.toLowerCase();if(v.startsWith('zh-cn')||v.startsWith('zh-sg'))return'zh-CN';if(v.startsWith('zh-tw')||v.startsWith('zh-hk')||v.startsWith('zh-mo'))return'zh-TW';if(v.startsWith('ja'))return'ja';if(v.startsWith('ko'))return'ko';if(v.startsWith('zh'))return'zh-CN';return'en';};
const tt=(k,vars={})=>((tr[s.locale]||tr.en)[k]||tr.en[k]||k).replace(/\{(\w+)\}/g,(_,t)=>String(vars[t]??''));
const num=(id)=>{const v=document.getElementById(id).value.trim();return v===''?null:Number(v);};
const val=(id)=>document.getElementById(id).value;
const chk=(id)=>document.getElementById(id).checked;
const rgb=(hex)=>{const h=hex.replace('#','');const v=(h.length===3?h.split('').map((p)=>p+p).join(''):h);const i=parseInt(v,16);return{r:(i>>16)&255,g:(i>>8)&255,b:i&255};};
const sel=()=>s.files.find((f)=>f.id===s.selectedId)||null;
const setStatus=(text,tone)=>{e.statusBox.textContent=text;e.statusBox.className=`info-box${tone?` ${tone}`:''}`;};
const cmd=async(c,a)=>{if(!invoke)throw new Error(tt('tauriUnavailable'));return invoke(c,a);};

const applyTranslations=()=>{
    document.documentElement.lang=s.locale;
    document.querySelectorAll('[data-i18n]').forEach((node)=>{node.textContent=tt(node.dataset.i18n);});
    if(e.addWatermarkBtn) e.addWatermarkBtn.textContent=tt('addText');
    if(e.addOverlayBtn) e.addOverlayBtn.textContent=tt('addImage');
    e.regexHelpBody.innerHTML=tt('regexHelpContent');
    document.getElementById('resize-width').placeholder=tt('placeholderLeaveEmpty');
    document.getElementById('resize-height').placeholder=tt('placeholderLeaveEmpty');
    document.getElementById('crop-width').placeholder=tt('placeholderOriginalWidth');
    document.getElementById('crop-height').placeholder=tt('placeholderOriginalHeight');
    document.getElementById('watermark-text').placeholder=tt('placeholderWatermark');
    document.getElementById('regex-pattern').placeholder=tt('placeholderRegex');
    document.getElementById('regex-replacement').placeholder=tt('placeholderReplace');
    e.pickFilesButton.title=tt('addImages');e.pickFilesButton.setAttribute('aria-label',tt('addImages'));
};
const applyPlatform=()=>{document.body.classList.remove('platform-windows','platform-macos','platform-linux');document.body.classList.add(`platform-${s.platform}`);};
const renderOverlay=()=>e.dropOverlay.classList.toggle('is-visible',s.isDragOverlayVisible);
const renderLeft=()=>{e.windowShell.classList.toggle('has-files',s.files.length>0);};
const bytes=(size)=>{if(!size)return'0 B';const u=['B','KB','MB','GB'];let v=size,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++;}return `${v.toFixed(v>=100||i===0?0:1)} ${u[i]}`;};
const p_pos=(v)=>{const p=String(v||'bottom-right').split('-');return{vertical:p[0]||'bottom',horizontal:p[1]||'right'};};

const settings=()=>({
    crop:{enabled:chk('crop-enabled'),x:Math.round(num('crop-x')||0),y:Math.round(num('crop-y')||0),width:num('crop-width')?Math.round(num('crop-width')):null,height:num('crop-height')?Math.round(num('crop-height')):null},
    resize:{enabled:chk('resize-enabled'),width:num('resize-width')?Math.round(num('resize-width')):null,height:num('resize-height')?Math.round(num('resize-height')):null,mode:val('resize-mode')},
    overlays: s.overlays.map((o,i)=>({...o, 
        enabled: chk(`ov-enabled-${i}`),
        x: num(`ov-x-${i}`)!==null?Math.round(num(`ov-x-${i}`)):null,
        y: num(`ov-y-${i}`)!==null?Math.round(num(`ov-y-${i}`)):null,
        scale_percent: Math.round(num(`ov-scale-${i}`)||25),
        opacity: num(`ov-opacity-${i}`)||0.75,
        margin: Math.round(num(`ov-margin-${i}`)||20),
        position: val(`ov-pos-${i}`)
    })),
    watermarks: s.watermarks.map((w,i)=>({...w,
        enabled: chk(`wm-enabled-${i}`),
        text: val(`wm-text-${i}`),
        fontSize: Math.round(num(`wm-size-${i}`)||30),
        fontFamily: val(`wm-font-${i}`),
        opacity: num(`wm-opacity-${i}`)||0.35,
        color: val(`wm-color-${i}`),
        x: num(`wm-x-${i}`)!==null?Math.round(num(`wm-x-${i}`)):null,
        y: num(`wm-y-${i}`)!==null?Math.round(num(`wm-y-${i}`)):null,
        margin: Math.round(num(`wm-margin-${i}`)||20),
        position: val(`wm-pos-${i}`)
    }))
});

const loadImage=(src)=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
const previewData=async(path)=>{if(s.previewCache[path])return s.previewCache[path];try{const p=await cmd('get_preview_data',{path});s.previewCache[path]=p.data_url;}catch(_){s.previewCache[path]=convert(path);}return s.previewCache[path];};
const ensureCropDefaults=(img)=>{if(!img||!chk('crop-enabled'))return;if(!val('crop-width'))document.getElementById('crop-width').value=String(img.naturalWidth);if(!val('crop-height'))document.getElementById('crop-height').value=String(img.naturalHeight);};

const cropRect=(img)=>{
    const c=settings().crop;if(!c.enabled||!img)return null;
    const w=n(c.width||img.naturalWidth,1,img.naturalWidth),h=n(c.height||img.naturalHeight,1,img.naturalHeight);
    return{x:n(c.x,0,img.naturalWidth-w),y:n(c.y,0,img.naturalHeight-h),width:w,height:h};
};
const syncCrop=(r)=>{
    document.getElementById('crop-x').value=String(Math.round(r.x));
    document.getElementById('crop-y').value=String(Math.round(r.y));
    document.getElementById('crop-width').value=String(Math.round(r.width));
    document.getElementById('crop-height').value=String(Math.round(r.height));
};
const canvasPoint=(event)=>{
    const canvas=e.previewCanvas,rect=canvas.getBoundingClientRect();
    const cw=canvas.width,ch=canvas.height,sw=rect.width,sh=rect.height;
    const scale=Math.min(sw/cw,sh/ch);
    const shownW=cw*scale,shownH=ch*scale;
    const xOff=(sw-shownW)/2,yOff=(sh-shownH)/2;
    return{x:n((event.clientX-rect.left-xOff)*(cw/shownW),0,cw),y:n((event.clientY-rect.top-yOff)*(ch/shownH),0,ch)};
};

const watermarkModel=(ctx,w,h,wm)=>{
    if(!wm.enabled||!wm.text)return null;
    const fontSize=wm.fontSize; 
    const font=wm.fontFamily||'sans-serif';
    ctx.font=`600 ${fontSize}px "${font}", sans-serif`;
    const measured=ctx.measureText(wm.text).width;
    const a=p_pos(wm.position);
    const x=(wm.x!==null)?wm.x:(a.horizontal==='left'?wm.margin:a.horizontal==='right'?w-measured-wm.margin:(w-measured)/2);
    const y=(wm.y!==null)?wm.y:(a.vertical==='top'?wm.margin:a.vertical==='bottom'?h-fontSize-wm.margin:(h-fontSize)/2);
    return{x,y,width:measured,height:fontSize,fontSize,text:wm.text,id:wm.id,font};
};
const overlayModel=(canvasW,canvasH,overlayImg,o)=>{
    if(!o.enabled||!overlayImg)return null;
    const ow=Math.max(1,Math.round(canvasW*(o.scale_percent/100)));
    const oh=Math.max(1,Math.round(overlayImg.naturalHeight*(ow/overlayImg.naturalWidth)));
    const p=p_pos(o.position);
    const ox=(o.x!==null)?o.x:(p.horizontal==='left'?o.margin:p.horizontal==='right'?canvasW-ow-o.margin:Math.round((canvasW-ow)/2));
    const oy=(o.y!==null)?o.y:(p.vertical==='top'?o.margin:p.vertical==='bottom'?canvasH-oh-o.margin:Math.round((canvasH-oh)/2));
    return{x:ox,y:oy,width:ow,height:oh,id:o.id};
};

const drawHandles=(ctx,r,color)=>{
    if(!r)return; const sz=getVisualSize();
    ctx.save(); ctx.globalAlpha=0.75;
    ctx.fillStyle='#fff'; ctx.strokeStyle=color; ctx.lineWidth=sz/4;
    const h=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x,y:r.y+r.height},{x:r.x+r.width,y:r.y+r.height}];
    h.forEach(p=>{
        ctx.beginPath();ctx.arc(p.x,p.y,sz/1.2,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,sz/3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';
    });
    ctx.restore();
};

const drawCrop=(ctx,r,w,h)=>{
    ctx.save();ctx.fillStyle='rgba(18, 24, 33, 0.35)';ctx.beginPath();ctx.rect(0,0,w,h);ctx.rect(r.x,r.y,r.width,r.height);ctx.fill('evenodd');
    ctx.strokeStyle='rgba(37, 116, 255, 0.95)';ctx.lineWidth=Math.max(2,w/500);ctx.strokeRect(r.x,r.y,r.width,r.height);
    drawHandles(ctx,r,'rgba(37, 116, 255, 0.95)');ctx.restore();
};

const drawWatermark=(ctx,m,wm)=>{
    const c=rgb(wm.color);ctx.save();
    ctx.font=`600 ${m.fontSize}px "${m.font}", sans-serif`;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle=`rgba(${c.r}, ${c.g}, ${c.b}, ${wm.opacity})`;ctx.fillText(m.text,m.x,m.y);
    ctx.strokeStyle='rgba(45, 108, 223, 0.6)';ctx.lineWidth=1;ctx.strokeRect(m.x-2,m.y-2,m.width+4,m.height+4);
    drawHandles(ctx,m,'rgba(45, 108, 223, 0.9)');ctx.restore();
};

const drawOverlayRect=(ctx,r)=>{
    ctx.save();ctx.strokeStyle='rgba(45, 108, 223, 0.6)';ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.width,r.height);
    drawHandles(ctx,r,'rgba(45, 108, 223, 0.9)');ctx.restore();
};

const schedule=(delay=150)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
        if(!isRendering) void renderPreview();
    },delay);
};

async function renderPreview(){
    const file=sel(); if(!file && s.previewImage){ s.previewImage=null; schedule(0); return; }
    if(isRendering) return;
    const token=++s.previewToken,canvas=e.previewCanvas,ctx=canvas.getContext('2d');
    isRendering=true;
    try{
        if(!file){ canvas.width=1;canvas.height=1;ctx.clearRect(0,0,1,1); e.previewMeta.textContent=tt('noImageSelected'); return; }
        e.previewMeta.textContent=tt('selectedMeta',{name:file.name,width:file.width,height:file.height,size:bytes(file.size_bytes)});
        const src=await previewData(file.path),img=await loadImage(src);
        if(token!==s.previewToken) return;
        s.previewImage=img;ensureCropDefaults(img);
        canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const st=settings();
        
        s.previewOverlays=[];
        for(let i=0; i<st.overlays.length; i++){
            const o=st.overlays[i]; if(!o.enabled||!o.path)continue;
            try{
                const oImg=await loadImage(await previewData(o.path));
                const rect=overlayModel(canvas.width,canvas.height,oImg,o);
                if(token===s.previewToken && rect){
                    s.previewOverlays[i]=rect; ctx.save(); ctx.globalAlpha=o.opacity;
                    ctx.drawImage(oImg,rect.x,rect.y,rect.width,rect.height); ctx.restore(); drawOverlayRect(ctx,rect);
                }
            }catch(_){}
        }
        
        s.previewWatermarks=[];
        for(let i=0; i<st.watermarks.length; i++){
            const wm=st.watermarks[i]; if(!wm.enabled||!wm.text)continue;
            const model=watermarkModel(ctx,canvas.width,canvas.height,wm);
            if(token===s.previewToken && model){ s.previewWatermarks[i]=model; drawWatermark(ctx,model,wm); }
        }

        if(st.crop.enabled){
            const cr=cropRect(img);if(token===s.previewToken && cr){ s.previewCropRect=cr; drawCrop(ctx,cr,canvas.width,canvas.height); }
        }
    }catch(_){canvas.width=1;canvas.height=1;ctx.clearRect(0,0,1,1);}
    finally{ isRendering=false; }
}

const renderWatermarkList=()=>{
    e.watermarkList.innerHTML=''; 
    s.watermarks.forEach((wm,i)=>{
        const item=document.createElement('div'); item.className='layer-item';
        const fontOpts=s.fonts.map(f=>`<option value="${f}" ${wm.fontFamily===f?'selected':''}>${f}</option>`).join('');
        item.innerHTML=`<div class="layer-item-header"><span>${tt('textWatermark')} #${i+1}</span><button class="remove-layer-btn" data-type="wm" data-id="${wm.id}">×</button></div><div class="layer-body"><label class="switch"><input id="wm-enabled-${i}" type="checkbox" ${wm.enabled?'checked':''} /><span>${tt('enableThis')}</span></label><input id="wm-text-${i}" type="text" value="${wm.text}" placeholder="${tt('placeholderWatermark')}" /><label><span>${tt('fontFamily')}</span><select id="wm-font-${i}"><option value="sans-serif">Default</option>${fontOpts}</select></label><div class="grid two"><label><span>${tt('layerX')}</span><input id="wm-x-${i}" type="number" value="${wm.x??''}" /></label><label><span>${tt('layerY')}</span><input id="wm-y-${i}" type="number" value="${wm.y??''}" /></label></div><div class="grid three"><label><span>${tt('size')}</span><input id="wm-size-${i}" type="number" value="${wm.fontSize}" /></label><label><span>${tt('opacity')}</span><input id="wm-opacity-${i}" type="number" step="0.05" value="${wm.opacity}" /></label><label><span>${tt('color')}</span><input id="wm-color-${i}" type="color" value="${wm.color}" /></label></div><div class="grid two"><label><span>${tt('margin')}</span><input id="wm-margin-${i}" type="number" value="${wm.margin}" /></label><label><span>${tt('position')}</span><select id="wm-pos-${i}"><option value="top-left" ${wm.position==='top-left'?'selected':''}>${tt('topLeft')}</option><option value="top-center" ${wm.position==='top-center'?'selected':''}>${tt('topCenter')}</option><option value="top-right" ${wm.position==='top-right'?'selected':''}>${tt('topRight')}</option><option value="center-center" ${wm.position==='center-center'?'selected':''}>${tt('center')}</option><option value="bottom-left" ${wm.position==='bottom-left'?'selected':''}>${tt('bottomLeft')}</option><option value="bottom-center" ${wm.position==='bottom-center'?'selected':''}>${tt('bottomCenter')}</option><option value="bottom-right" ${wm.position==='bottom-right'?'selected':''}>${tt('bottomRight')}</option></select></label></div></div>`;
        e.watermarkList.appendChild(item);
        ['wm-enabled-','wm-text-','wm-font-','wm-size-','wm-opacity-','wm-color-','wm-x-','wm-y-','wm-margin-','wm-pos-'].forEach(p=>{
            document.getElementById(p+i).addEventListener('input',(ev)=>{ if(!p.includes('opacity')&&!p.includes('color')) { wm.x=null; wm.y=null; if(document.getElementById(`wm-x-${i}`)) document.getElementById(`wm-x-${i}`).value=''; if(document.getElementById(`wm-y-${i}`)) document.getElementById(`wm-y-${i}`).value=''; } schedule(0); });
        });
    });
};
const renderOverlayList=()=>{
    e.overlayList.innerHTML='';
    s.overlays.forEach((ov,i)=>{
        const item=document.createElement('div'); item.className='layer-item';
        item.innerHTML=`<div class="layer-item-header"><span>${ov.name}</span><button class="remove-layer-btn" data-type="ov" data-id="${ov.id}">×</button></div><div class="layer-body"><label class="switch"><input id="ov-enabled-${i}" type="checkbox" ${ov.enabled?'checked':''} /><span>${tt('enableThis')}</span></label><div class="grid two"><label><span>${tt('layerX')}</span><input id="ov-x-${i}" type="number" value="${ov.x??''}" /></label><label><span>${tt('layerY')}</span><input id="ov-y-${i}" type="number" value="${ov.y??''}" /></label></div><div class="grid three"><label><span>${tt('scalePercent')}</span><input id="ov-scale-${i}" type="number" value="${ov.scale}" /></label><label><span>${tt('opacity')}</span><input id="ov-opacity-${i}" type="number" step="0.05" value="${ov.opacity}" /></label><label><span>${tt('margin')}</span><input id="ov-margin-${i}" type="number" value="${ov.margin}" /></label></div><label><span>${tt('position')}</span><select id="ov-pos-${i}"><option value="top-left" ${ov.position==='top-left'?'selected':''}>${tt('topLeft')}</option><option value="top-center" ${ov.position==='top-center'?'selected':''}>${tt('topCenter')}</option><option value="top-right" ${ov.position==='top-right'?'selected':''}>${tt('topRight')}</option><option value="center-center" ${ov.position==='center-center'?'selected':''}>${tt('center')}</option><option value="bottom-left" ${ov.position==='bottom-left'?'selected':''}>${tt('bottomLeft')}</option><option value="bottom-center" ${ov.position==='bottom-center'?'selected':''}>${tt('bottomCenter')}</option><option value="bottom-right" ${ov.position==='bottom-right'?'selected':''}>${tt('bottomRight')}</option></select></label></div></div>`;
        e.overlayList.appendChild(item);
        ['ov-enabled-','ov-x-','ov-y-','ov-scale-','ov-opacity-','ov-margin-','ov-pos-'].forEach(p=>{
            document.getElementById(p+i).addEventListener('input',(ev)=>{ if(!p.includes('opacity')) { ov.x=null; ov.y=null; if(document.getElementById(`ov-x-${i}`)) document.getElementById(`ov-x-${i}`).value=''; if(document.getElementById(`ov-y-${i}`)) document.getElementById(`ov-y-${i}`).value=''; } schedule(0); });
        });
    });
};
const clearImages=()=>{s.files=[];s.selectedId=null;s.previewCropRect=null;s.watermarks=[];s.overlays=[];renderFiles();renderWatermarkList();renderOverlayList();};

let isLoadingFonts=false;
const loadFontsIfNeeded=async()=>{
    if(s.fonts.length>0||isLoadingFonts||!invoke) return;
    isLoadingFonts=true;
    try {
        const f = await cmd('get_system_fonts');
        s.fonts = f || [];
        renderWatermarkList();
    } catch(err) {
        console.error('Failed to load fonts:', err);
    } finally {
        isLoadingFonts=false;
    }
};

const addWatermark=()=>{ 
    s.watermarks.push({id:Date.now(),text:'Watermark',fontSize:40,opacity:0.5,color:'#2574ff',x:null,y:null,margin:20,position:'center-center',enabled:true,fontFamily:'sans-serif'}); 
    renderWatermarkList(); 
    schedule(0); 
    loadFontsIfNeeded();
};
const addOverlay=async()=>{ try{const file=await cmd('pick_overlay');if(!file)return;s.overlays.push({id:Date.now(),path:file.path,name:file.name,scale_percent:25,opacity:0.8,x:null,y:null,margin:20,position:'center-center',enabled:true,width:file.width,height:file.height});renderOverlayList();schedule(0);}catch(err){console.error(err);}};
const renderFiles=()=>{
    renderLeft();e.imageCount.textContent=String(s.files.length);e.imageList.innerHTML='';
    if(s.files.length===0){s.selectedId=null;e.imageList.classList.add('empty-state');e.imageList.innerHTML=`<p>${tt('noImagesYet')}</p>`;schedule(10);return;}
    if(!sel())s.selectedId=s.files[0].id;e.imageList.classList.remove('empty-state');
    const frag=document.createDocumentFragment();
    s.files.forEach((file)=>{
        const item=document.createElement('article');item.className=`image-item${file.id===s.selectedId?' selected':''}`;item.dataset.id=file.id;
        item.innerHTML=`<div class="image-item-head"><span class="image-name" title="${file.name}">${file.name}</span><button class="remove-button" type="button" data-id="${file.id}">${tt('remove')}</button></div><div class="image-item-meta"><span>${file.width} x ${file.height}</span><span>${bytes(file.size_bytes)}</span></div><div class="image-path" title="${file.path}">${file.path}</div>`;
        frag.appendChild(item);
    });e.imageList.appendChild(frag);schedule(10);
};

async function buildWatermarkData(){
    const st=settings(); const wms=st.watermarks.filter(w=>w.enabled&&w.text); if(wms.length===0)return null;
    const canvas=document.createElement('canvas');
    canvas.width=s.previewImage?s.previewImage.naturalWidth:1600;
    canvas.height=s.previewImage?s.previewImage.naturalHeight:1000;
    const ctx=canvas.getContext('2d');
    wms.forEach(wm=>{
        const c=rgb(wm.color); const model=watermarkModel(ctx,canvas.width,canvas.height,wm); if(!model)return;
        ctx.save(); ctx.font=`600 ${model.fontSize}px "${model.font}", sans-serif`; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillStyle=`rgba(${c.r}, ${c.g}, ${c.b}, ${wm.opacity})`; ctx.fillText(model.text,model.x,model.y); ctx.restore();
    });
    return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/,'');
}

async function pickFiles(){try{if(invoke){mergeFiles(await cmd('pick_files'));}else e.fileInput.click();}catch(error){setStatus(tt('processingFailed',{error:String(error)}),'error');}}
async function pickOverlay(){try{const file=await cmd('pick_overlay');if(!file)return;s.overlayFile=file;renderOverlayFile();setStatus(tt('overlaySelected'),'success');}catch(error){setStatus(tt('processingFailed',{error:String(error)}),'error');}}
async function pickOutputDirectory(){try{const directory=await cmd('pick_output_directory',{current_dir:s.outputDirectory||null});if(!directory)return;s.outputDirectory=directory;e.outputDirectory.textContent=tt('customSaveFolder',{path:directory});setStatus(tt('customSaveFolderUpdated'),'success');}catch(error){setStatus(tt('processingFailed',{error:String(error)}),'error');}}

const getPayload=(watermark_png_base64)=>({
    files:s.files,output_directory:s.outputDirectory||null,
    resize:settings().resize,crop:settings().crop,
    naming:{template:val('output-template')||'{name}_edit',output_format:val('output-format'),regex_enabled:chk('regex-enabled'),regex_pattern:val('regex-pattern'),regex_replacement:val('regex-replacement'),regex_flags:val('regex-flags')},
    watermark_png_base64,
    overlays:settings().overlays.map(o=>({...o, path:o.path}))
});

async function processImages(){
    if(s.files.length===0){setStatus(tt('addAtLeastOne'),'error');return;}
    e.processButton.disabled=true;e.resultList.innerHTML='';setStatus(tt('processing'));
    try{
        const result=await cmd('process_images',{payload:getPayload(await buildWatermarkData())});
        e.resultList.innerHTML='';const frag=document.createDocumentFragment();
        result.results.forEach((item)=>{const l=document.createElement('div');l.className='info-box result-item success';l.textContent=tt('saved',{path:item.output_path});frag.appendChild(l);});
        result.errors.forEach((item)=>{const l=document.createElement('div');l.className='info-box result-item error';l.textContent=tt('failed',{path:item.file_path,message:item.message});frag.appendChild(l);});
        e.resultList.appendChild(frag);
        setStatus(tt('doneSummary',{ok:result.results.length,fail:result.errors.length}),result.errors.length?'error':'success');
        if(e.clearAfterExport.checked&&result.results.length>0)clearImages();
    }catch(error){setStatus(tt('processingFailed',{error:String(error)}),'error');}finally{e.processButton.disabled=false;}
}

async function loadDroppedPaths(paths){if(!Array.isArray(paths)||paths.length===0)return;try{mergeFiles(await cmd('load_files_from_paths',{paths}));s.isDragOverlayVisible=false;renderOverlay();}catch(error){setStatus(tt('processingFailed',{error:String(error)}),'error');}}
async function loadPathsFromFileList(fileList){const paths=Array.from(fileList||[]).map((f)=>f.path).filter(Boolean);if(paths.length>0)await loadDroppedPaths(paths);}

const storeLocale=()=>{try{localStorage.setItem('ezcut-locale',s.locale);}catch(_){}};
const getStoredLocale=()=>{try{return localStorage.getItem('ezcut-locale');}catch(_){return null;}};
const applyLocale=(l)=>{s.locale=loc(l);e.languagePicker.value=s.locale;applyTranslations();renderFiles();renderOverlayFile();setStatus(tt('ready'));};

async function init(){
    s.locale=loc(navigator.language);
    try{
        const info=invoke?await cmd('get_runtime_info'):null;
        if(info?.platform)s.platform=info.platform;
        if(info?.locale)s.locale=loc(info.locale);
    }catch(_){}
    const stored=getStoredLocale();if(stored)s.locale=loc(stored);
    applyPlatform();applyLocale(s.locale);
}

const getVisualSize=()=>{
    const r=e.previewCanvas.getBoundingClientRect();
    return r.width ? 7*(e.previewCanvas.width/r.width) : 7;
};
const hitHandle=(pt,r)=>{
    if(!r)return null; const size=getVisualSize();
    const h={nw:{x:r.x,y:r.y},ne:{x:r.x+r.width,y:r.y},sw:{x:r.x,y:r.y+r.height},se:{x:r.x+r.width,y:r.y+r.height}};
    return Object.entries(h).find(([,v])=>Math.abs(pt.x-v.x)<=size&&Math.abs(pt.y-v.y)<=size)?.[0]||null;
};
const hitRect=(pt,r)=>r&&(pt.x>=r.x&&pt.x<=r.x+r.width&&pt.y>=r.y&&pt.y<=r.y+r.height);

function onPreviewDown(event){
    if(!s.previewImage)return; const pt=canvasPoint(event);
    
    // 优先级 1: 检查所有活动的手柄 (最高优先级，按渲染逆序从顶向底)
    for(let i=s.watermarks.length-1; i>=0; i--){
        const h=hitHandle(pt,s.previewWatermarks[i]); if(h){s.interaction={type:'wm-resize',index:i,handle:h,start:pt,rect:{...s.previewWatermarks[i]}}; break;}
    }
    if(!s.interaction){
        for(let i=s.overlays.length-1; i>=0; i--){
            const h=hitHandle(pt,s.previewOverlays[i]); if(h){s.interaction={type:'ov-resize',index:i,handle:h,start:pt,rect:{...s.previewOverlays[i]}}; break;}
        }
    }
    if(!s.interaction && chk('crop-enabled')){ const h=hitHandle(pt,s.previewCropRect); if(h){s.interaction={type:'crop-resize',handle:h,start:pt,rect:{...s.previewCropRect}};}}

    // 优先级 2: 水印和图层的内部 (穿透裁剪框，逆序遍历)
    if(!s.interaction){
        for(let i=s.watermarks.length-1; i>=0; i--){
            if(hitRect(pt,s.previewWatermarks[i])){ s.interaction={type:'wm-move',index:i,start:pt,rect:{...s.previewWatermarks[i]}}; break; }
        }
    }
    if(!s.interaction){
        for(let i=s.overlays.length-1; i>=0; i--){
            if(hitRect(pt,s.previewOverlays[i])){ s.interaction={type:'ov-move',index:i,start:pt,rect:{...s.previewOverlays[i]}}; break; }
        }
    }

    // 优先级 3: 裁剪框内部
    if(!s.interaction && chk('crop-enabled') && hitRect(pt,s.previewCropRect)){
        s.interaction={type:'crop-move',start:pt,rect:{...s.previewCropRect}};
    }

    if(s.interaction){
        window.addEventListener('pointermove', onPreviewMove);
        window.addEventListener('pointerup', onPreviewUp);
        try{e.previewCanvas.setPointerCapture(event.pointerId);}catch(_){}
        event.preventDefault(); renderPreview();
    }
}

function onPreviewMove(event){
    const pt=canvasPoint(event);
    if(!s.interaction){
        let cur='crosshair'; e.previewCanvas.style.cursor=cur; return;
    }
    const dx=pt.x-s.interaction.start.x,dy=pt.y-s.interaction.start.y,cw=e.previewCanvas.width,ch=e.previewCanvas.height;
    if(s.interaction.type.includes('move')){
        const r=s.interaction.rect,nx=n(r.x+dx,0,cw-r.width),ny=n(r.y+dy,0,ch-r.height);
        if(s.interaction.type==='crop-move') syncCrop({x:nx,y:ny,width:r.width,height:r.height});
        else {
            const list=s.interaction.type.startsWith('wm')?s.watermarks:s.overlays;
            const item=list[s.interaction.index],pre=s.interaction.type.startsWith('wm')?'wm':'ov';
            item.x=nx; item.y=ny;
            if(document.getElementById(`${pre}-x-${s.interaction.index}`)) document.getElementById(`${pre}-x-${s.interaction.index}`).value=Math.round(nx);
            if(document.getElementById(`${pre}-y-${s.interaction.index}`)) document.getElementById(`${pre}-y-${s.interaction.index}`).value=Math.round(ny);
        }
    } else {
        const h=s.interaction.handle,r=s.interaction.rect,ms=10;
        let nx=r.x,ny=r.y,nw=r.width,nh=r.height;
        if(h==='se'){nw=n(r.width+dx,ms,cw-r.x); nh=n(r.height+dy,ms,ch-r.y);}
        else if(h==='nw'){nx=n(r.x+dx,0,r.x+r.width-ms); ny=n(r.y+dy,0,r.y+r.height-ms); nw=r.width+(r.x-nx); nh=r.height+(r.y-ny);}
        else if(h==='ne'){ny=n(r.y+dy,0,r.y+r.height-ms); nw=n(r.width+dx,ms,cw-r.x); nh=r.height+(r.y-ny);}
        else if(h==='sw'){nx=n(r.x+dx,0,r.x+r.width-ms); nw=r.width+(r.x-nx); nh=n(r.height+dy,ms,ch-r.y);}
        if(s.interaction.type==='crop-resize') syncCrop({x:nx,y:ny,width:nw,height:nh});
        else {
            const list=s.interaction.type.startsWith('wm')?s.watermarks:s.overlays;
            const item=list[s.interaction.index],pre=s.interaction.type.startsWith('wm')?'wm':'ov';
            item.x=nx; item.y=ny;
            if(item.fontSize!==undefined){
                item.fontSize=n(r.fontSize+(dx+dy)/2,8,cw*0.5); 
                if(document.getElementById(`wm-size-${s.interaction.index}`)) document.getElementById(`wm-size-${s.interaction.index}`).value=Math.round(item.fontSize);
            } else {
                item.scale_percent=Math.round((nw/cw)*100);
                if(document.getElementById(`ov-scale-${s.interaction.index}`)) document.getElementById(`ov-scale-${s.interaction.index}`).value=item.scale_percent;
            }
            if(document.getElementById(`${pre}-x-${s.interaction.index}`)) document.getElementById(`${pre}-x-${s.interaction.index}`).value=Math.round(nx);
            if(document.getElementById(`${pre}-y-${s.interaction.index}`)) document.getElementById(`${pre}-y-${s.interaction.index}`).value=Math.round(ny);
        }
    }
    schedule(0);
}

const mergeFiles=(files)=>{const known=new Set(s.files.map((i)=>i.path));files.forEach((file)=>{if(!known.has(file.path)){s.files.push(file);known.add(file.path);}});if(!s.selectedId&&s.files.length>0)s.selectedId=s.files[0].id;renderFiles();};
e.pickFilesButton.addEventListener('click',pickFiles);e.pickOutputButton.addEventListener('click',pickOutputDirectory);e.processButton.addEventListener('click',processImages);
e.addWatermarkBtn.addEventListener('click',addWatermark);e.addOverlayBtn.addEventListener('click',addOverlay);
e.watermarkList.addEventListener('click',(ev)=>{const r=ev.target.closest('.remove-layer-btn');if(r){s.watermarks=s.watermarks.filter(wm=>String(wm.id)!==r.dataset.id);renderWatermarkList();schedule(0);}});
e.overlayList.addEventListener('click',(ev)=>{const r=ev.target.closest('.remove-layer-btn');if(r){s.overlays=s.overlays.filter(ov=>String(ov.id)!==r.dataset.id);renderOverlayList();schedule(0);}});

e.previewCanvas.addEventListener('pointerdown',onPreviewDown);
e.regexHelpButton.addEventListener('click',()=>e.regexModal.classList.add('is-visible'));e.closeModalButtons.forEach((b)=>b.addEventListener('click',()=>e.regexModal.classList.remove('is-visible')));e.regexModal.querySelector('.modal-backdrop').addEventListener('click',()=>e.regexModal.classList.remove('is-visible'));
e.languagePicker.addEventListener('change',(ev)=>{applyLocale(ev.target.value);storeLocale();});
e.fileInput.addEventListener('change',async(ev)=>{await loadPathsFromFileList(ev.target.files);ev.target.value='';});
e.imageList.addEventListener('click',(ev)=>{const r=ev.target.closest('.remove-button'),i=ev.target.closest('.image-item');if(r){const id=r.dataset.id;s.files=s.files.filter((f)=>f.id!==id);if(s.selectedId===id)s.selectedId=s.files[0]?.id||null;renderFiles();return;}if(i){s.selectedId=i.dataset.id;renderFiles();}});
['resize-enabled','resize-width','resize-height','resize-mode','crop-enabled','crop-x','crop-y','crop-width','crop-height'].forEach((id)=>{const n=document.getElementById(id);if(!n)return;n.addEventListener('input',()=>schedule(0));});

function onPreviewUp(){
    window.removeEventListener('pointermove', onPreviewMove);
    window.removeEventListener('pointerup', onPreviewUp);
    s.interaction=null; e.previewCanvas.style.cursor='crosshair';
}

document.addEventListener('dragenter',(ev)=>{if(ev.dataTransfer?.types?.includes('Files')){ev.preventDefault();s.isDragOverlayVisible=true;renderOverlay();}});document.addEventListener('dragover',(ev)=>{ev.preventDefault();});document.addEventListener('dragleave',(ev)=>{if(ev.relatedTarget===null){s.isDragOverlayVisible=false;renderOverlay();}});document.addEventListener('drop',async(ev)=>{ev.preventDefault();s.isDragOverlayVisible=false;renderOverlay();await loadPathsFromFileList(ev.dataTransfer?.files);});
if(listen){listen('tauri://file-drop-hover',()=>{s.isDragOverlayVisible=true;renderOverlay();});listen('tauri://file-drop-cancelled',()=>{s.isDragOverlayVisible=false;renderOverlay();});listen('tauri://file-drop',async(ev)=>{await loadDroppedPaths(ev.payload);});}
init();
})();
