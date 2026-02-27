/**
 * HTMLファイルからPDFを自動生成するスクリプト
 * dist/内の全言語フォルダを自動検出し、PDFを生成します
 *
 * 使い方:
 *   node generate-pdf.js             → 個別PDF（1HTML = 1PDFファイル）
 *   node generate-pdf.js --combined  → 結合PDF（全ページ1つのPDFファイル、リンク付き）
 *
 * 必要なパッケージ: puppeteer, cheerio, pdf-lib（devDependenciesに含まれています）
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const DIST_DIR = path.resolve(__dirname, 'dist');
const VIEWPORT_WIDTH = 1280;

// ページ順序（目次順）
const PAGES = [
  'index.html',
  'important-safety-information.html',
  'how-to-use.html',
  'how-to-use-know-your-device.html',
  'how-to-use-package-contents.html',
  'how-to-use-installing-batteries.html',
  'how-to-use-initial-setting.html',
  'how-to-use-for-accurate-measurement.html',
  'how-to-use-taking-a-measurement.html',
  'how-to-use-automatic-transfer-of-readings.html',
  'how-to-use-measuring-without-recording.html',
  'how-to-use-measuring-weight-only.html',
  'how-to-use-checking-your-readings-using-the-omron-connect-app.html',
  'how-to-use-selecting-the-personal-number-manually-before-measurement.html',
  'settings.html',
  'settings-user-settings.html',
  'settings-registering-personal-data-on-the-unit.html',
  'settings-performing-initial-settings-on-the-unit.html',
  'settings-display-settings.html',
  'settings-deleting-data.html',
  'settings-replacing-the-batteries.html',
  'settings-restoring-the-unit-to-factory-settings.html',
  'error-messages-and-troubleshooting.html',
  'error-messages.html',
  'troubleshooting.html',
  'maintenance.html',
  'maintenance-maintenance.html',
  'maintenance-correct-disposal-of-this-product.html',
  'specifications.html',
  'specifications-specifications.html',
  'specifications-product-security-vulnerability-reporting.html',
  'information-on-body-composition.html',
  'information-on-body-composition-information-on-body-composition.html',
  'information-on-body-composition-measurement-results-interpretation-diagrams.html',
];

// サイドナビの項目定義（結合PDF用）
const NAV_ITEMS = [
  { title: 'Home', file: 'index.html', children: [] },
  { title: 'Important Safety Information', file: 'important-safety-information.html', children: [] },
  {
    title: 'How to Use', file: 'how-to-use.html', children: [
      'how-to-use-know-your-device.html', 'how-to-use-package-contents.html',
      'how-to-use-installing-batteries.html', 'how-to-use-initial-setting.html',
      'how-to-use-for-accurate-measurement.html', 'how-to-use-taking-a-measurement.html',
      'how-to-use-automatic-transfer-of-readings.html', 'how-to-use-measuring-without-recording.html',
      'how-to-use-measuring-weight-only.html', 'how-to-use-checking-your-readings-using-the-omron-connect-app.html',
      'how-to-use-selecting-the-personal-number-manually-before-measurement.html',
    ]
  },
  {
    title: 'Settings', file: 'settings.html', children: [
      'settings-user-settings.html', 'settings-registering-personal-data-on-the-unit.html',
      'settings-performing-initial-settings-on-the-unit.html', 'settings-display-settings.html',
      'settings-deleting-data.html', 'settings-replacing-the-batteries.html',
      'settings-restoring-the-unit-to-factory-settings.html',
    ]
  },
  {
    title: 'Error Messages and Troubleshooting', file: 'error-messages-and-troubleshooting.html', children: [
      'error-messages.html', 'troubleshooting.html',
    ]
  },
  {
    title: 'Maintenance', file: 'maintenance.html', children: [
      'maintenance-maintenance.html', 'maintenance-correct-disposal-of-this-product.html',
    ]
  },
  {
    title: 'Specifications', file: 'specifications.html', children: [
      'specifications-specifications.html', 'specifications-product-security-vulnerability-reporting.html',
    ]
  },
  {
    title: 'Information on Body Composition', file: 'information-on-body-composition.html', children: [
      'information-on-body-composition-information-on-body-composition.html',
      'information-on-body-composition-measurement-results-interpretation-diagrams.html',
    ]
  },
];

// ========================================
// 共通ユーティリティ
// ========================================

function fileToAnchor(filename) {
  return filename.replace('.html', '');
}

const COMMON_CSS = `
  .scroll-hint-icon, .scroll-hint-icon-wrap { display: none !important; }
  .p-manual__table-wrap { overflow: visible !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
`;

// ========================================
// モードA: 個別PDF生成
// ========================================

async function generateIndividualPDFs(browser, langDir, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: 800 });
  await page.emulateMediaType('screen');

  const outputDir = path.join(langDir, 'assets', 'pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let count = 0;

  for (const htmlFile of PAGES) {
    const filePath = path.join(langDir, htmlFile);
    if (!fs.existsSync(filePath)) {
      console.log(`    ⚠ スキップ: ${htmlFile} (ファイルなし)`);
      continue;
    }

    process.stdout.write(`    📄 ${htmlFile} ... `);

    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.addStyleTag({ content: COMMON_CSS });

    // リンクを .html → .pdf に書き換え
    await page.evaluate((pages) => {
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        const match = href.match(/^(?:\.\/)?([a-zA-Z0-9_-]+)\.html(#.*)?$/);
        if (match && pages.includes(match[1] + '.html')) {
          a.setAttribute('href', `./${match[1]}.pdf${match[2] || ''}`);
        }
      });
    }, PAGES);

    await new Promise(r => setTimeout(r, 300));

    const bodyHeight = await page.evaluate(() => {
      return Math.max(document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    });

    const pdfFilename = htmlFile.replace('.html', '.pdf');
    const outputPath = path.join(outputDir, pdfFilename);

    await page.pdf({
      path: outputPath,
      width: `${VIEWPORT_WIDTH / 96}in`,
      height: `${(bodyHeight + 20) / 96}in`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`OK (${fileSize}KB)`);
    count++;
  }

  await page.close();
  return count;
}

// ========================================
// モードB: 結合PDF生成
// ========================================

/**
 * サイドナビのタイトルをHTMLから自動取得（翻訳対応）
 */
function extractNavTitles(langDir) {
  const titles = {};
  for (const item of NAV_ITEMS) {
    const filePath = path.join(langDir, item.file);
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf-8');
      const $ = cheerio.load(html);
      const currentLink = $('.p-side-nav__link--current');
      titles[item.file] = currentLink.length ? currentLink.text().trim() : $('title').text().trim();
    }
  }
  return titles;
}

/**
 * HTMLからコンテンツを抽出
 */
function extractContent(langDir, htmlFile) {
  const filePath = path.join(langDir, htmlFile);
  if (!fs.existsSync(filePath)) return null;

  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html, { decodeEntities: false });
  $('.p-main__control').remove();
  $('.p-pagination').remove();

  const mainContent = $('.p-main__content');
  const mainList = $('.p-main__list');

  if (mainContent.length) return $.html(mainContent);
  if (mainList.length) return $.html(mainList);
  return '';
}

/**
 * サイドナビHTML生成（現在ページをハイライト）
 */
function buildSideNav(currentFile, navTitles) {
  let html = '<aside class="p-side-nav"><nav class="p-side-nav__menu"><ul class="p-side-nav__items">';
  for (const item of NAV_ITEMS) {
    const anchor = fileToAnchor(item.file);
    const isCurrent = item.file === currentFile;
    const isParent = item.children.includes(currentFile);
    const isHome = item.file === 'index.html';
    const title = navTitles[item.file] || item.title;

    let itemClass = 'p-side-nav__item';
    if (isCurrent) itemClass += ' p-side-nav__item--current';
    if (isParent) itemClass += ' p-side-nav__item--parent';

    html += `<li class="${itemClass}">`;
    if (isCurrent) {
      let linkClass = 'p-side-nav__link p-side-nav__link--current';
      if (isHome) linkClass += ' p-side-nav__link--home';
      html += `<div class="${linkClass}">${title}</div>`;
    } else {
      let linkClass = 'p-side-nav__link';
      if (isHome) linkClass += ' p-side-nav__link--home';
      html += `<a href="#${anchor}" class="${linkClass}">${title}</a>`;
    }
    html += '</li>';
  }
  html += '</ul></nav></aside>';
  return html;
}

/**
 * 内部リンクをアンカーに変換
 */
function rewriteLinksToAnchors(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  $('a[href]').each(function () {
    const href = $(this).attr('href');
    if (!href) return;
    const match = href.match(/^(?:\.\/)?([a-zA-Z0-9_-]+)\.html(#.*)?$/);
    if (match && PAGES.includes(match[1] + '.html')) {
      $(this).attr('href', `#${match[1]}${match[2] || ''}`);
    }
  });
  return $.html();
}

/**
 * 結合HTML生成 → PDF化
 */
async function generateCombinedPDF(browser, langDir, lang) {
  console.log(`    📝 結合HTMLを生成中...`);

  const navTitles = extractNavTitles(langDir);
  let sections = '';
  let pageCount = 0;

  for (const htmlFile of PAGES) {
    const content = extractContent(langDir, htmlFile);
    if (content === null) {
      console.log(`    ⚠ スキップ: ${htmlFile}`);
      continue;
    }

    const anchor = fileToAnchor(htmlFile);
    const sideNav = buildSideNav(htmlFile, navTitles);

    sections += `
      <section class="pdf-section" id="${anchor}">
        <div class="pdf-layout">
          <div class="pdf-layout__nav">${sideNav}</div>
          <div class="pdf-layout__content">${content}</div>
        </div>
      </section>
    `;
    pageCount++;
  }

  sections = rewriteLinksToAnchors(sections);

  const combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>User Guide</title>
  <link rel="stylesheet" href="./assets/css/style.css" />
  <link rel="stylesheet" href="./assets/css/app/scroll-hint.css" />
  <style>
    body { margin: 0; padding: 10px 40px 13px 40px; }
    .pdf-section { page-break-before: always; }
    .pdf-section:first-of-type { page-break-before: auto; }
    .pdf-layout { display: flex; gap: 30px; align-items: flex-start; max-width: 1100px; margin: 0 auto; }
    .pdf-layout__nav { width: 185px; min-width: 185px; flex-shrink: 0; padding-top: 5px; }
    .pdf-layout__content { flex: 1; min-width: 0; max-width: 850px; }
    .p-side-nav { display: block !important; }
    .p-side-nav__link { font-size: 15px !important; padding-top: 8px !important; padding-bottom: 8px !important; line-height: 1.4 !important; color: #333; }
    .p-side-nav__link--current { font-weight: 700; color: #005EB8 !important; }
    .p-side-nav__items { padding-left: 16px !important; }
    .p-side-nav__item--current::before, .p-side-nav__item--parent::before { left: -16px !important; }
    .p-content-area__side-nav { display: none !important; }
    .p-control, .p-main__control { display: none !important; }
    .p-pagination { display: none !important; }
    .l-header, .p-header, .l-footer, .p-footer { display: none !important; }
    .p-user-guide-header { display: none !important; }
    .scroll-hint-icon, .scroll-hint-icon-wrap { display: none !important; }
    .p-manual__table-wrap { overflow: visible !important; }
    .p-main__content { border: none !important; box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; padding: 15px 0 !important; }
    a[href^="#"] { color: #005c97; }
    /* 画像グリッドの崩れ防止: subgrid+aspect-ratioの組み合わせが壊れるのを修正 */
    .p-manual__figure-item { grid-row: auto !important; display: block !important; }
    .p-manual__figure-items { grid-template-rows: auto !important; }
    .p-manual__figure-image, .p-manual__item-image { aspect-ratio: auto !important; }
    .p-manual__figure-image img, .p-manual__item-image img { height: auto !important; width: 100%; }
    .p-manual__figure-image--unit-placed { width: 250px !important; max-width: 250px !important; overflow: hidden !important; }
    .p-manual__figure-image--unit-placed img { width: 250px !important; max-width: 250px !important; height: auto !important; }
    .p-manual__figure-item { margin-top: 10px; }
    .p-manual__figure-text { margin-bottom: 8px !important; }
    .p-birth-date-card::after { position: static !important; display: block !important; margin: 10px auto !important; }
    .p-birth-date-card__text-block { height: auto !important; }
    .p-manual__step { page-break-inside: avoid; }
    h2, h3, h4 { page-break-after: avoid; }
    img { max-width: 100% !important; page-break-inside: avoid; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  </style>
</head>
<body>
  <div style="margin: 0 auto; padding: 0;">${sections}</div>
</body>
</html>`;

  // 一時HTMLを保存してPDF化
  const tempPath = path.join(langDir, '_combined-for-pdf.html');
  fs.writeFileSync(tempPath, combinedHTML, 'utf-8');

  console.log(`    🚀 PDF生成中...`);
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: 800 });
  await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  const outputDir = path.join(langDir, 'assets', 'pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `user-guide-${lang}.pdf`);

  await page.pdf({
    path: outputPath,
    width: '1280px',
    height: '900px',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '12mm', left: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:8pt;color:#999;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });

  await page.close();
  // fs.unlinkSync(tempPath); // デバッグ用に保持

  const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`    ✅ ${outputPath}`);

  return { pageCount, fileSize };
}

// ========================================
// メイン処理
// ========================================

async function main() {
  const isCombined = process.argv.includes('--combined');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('[ERROR] distディレクトリが見つかりません。先にビルドを実行してください。');
    process.exit(1);
  }

  const langDirs = fs.readdirSync(DIST_DIR).filter(file => {
    const filePath = path.join(DIST_DIR, file);
    return fs.statSync(filePath).isDirectory() && !file.startsWith('.');
  });

  if (langDirs.length === 0) {
    console.error('[ERROR] 言語フォルダが見つかりません。');
    process.exit(1);
  }

  console.log('[INFO] 見つかった言語:', langDirs.join(', '));
  console.log(`[INFO] モード: ${isCombined ? '結合PDF（1ファイル）' : '個別PDF（ページごと）'}`);
  console.log('');

  console.log('[INFO] ブラウザを起動中...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const lang of langDirs) {
    const langDir = path.join(DIST_DIR, lang);
    console.log(`[INFO] ${lang}: PDF生成中...`);

    if (isCombined) {
      const { pageCount, fileSize } = await generateCombinedPDF(browser, langDir, lang);
      console.log(`[SUCCESS] ${lang}: 生成完了 → assets/pdf/user-guide-${lang}.pdf (${pageCount}セクション, ${fileSize}MB)`);
    } else {
      const count = await generateIndividualPDFs(browser, langDir, lang);
      console.log(`[SUCCESS] ${lang}: ${count}ファイル生成完了 → assets/pdf/`);
    }
    console.log('');
  }

  await browser.close();
  console.log('[COMPLETE] PDF生成が完了しました。');
}

// 実行
try {
  main();
} catch (error) {
  console.error('[ERROR] エラーが発生しました:', error.message);
  process.exit(1);
}
