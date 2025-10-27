/**
 * HTMLファイルから検索用JSONを自動生成するスクリプト
 * 使い方: node generate-search-data.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * 指定ディレクトリ内のHTMLファイルを再帰的に取得
 */
function getAllHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // サブディレクトリを再帰的に探索
      getAllHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html') && !file.startsWith('_')) {
      // _で始まらないHTMLファイルを対象
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * HTMLファイルから検索データを抽出
 */
function extractSearchData(htmlPath, langDir) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // タイトルを抽出
  const title = $('title').text() || '';

  // descriptionを抽出
  const description = $('meta[name="description"]').attr('content') || '';

  // 本文を抽出（不要な要素を除外）
  // まずクローンを作成
  const $main = $('.l-main, main').first().clone();

  // 除外する要素を削除
  $main.find('script, style, noscript, .l-header, .l-footer, .p-control, header, footer, nav').remove();

  // テキストを抽出して整形
  const content = $main.text()
    .replace(/\s+/g, ' ')  // 複数の空白を1つに
    .trim()
    .toLowerCase();

  // 相対URLを生成
  const relativePath = './' + path.relative(langDir, htmlPath).replace(/\\/g, '/');

  return {
    title: title.trim(),
    url: relativePath,
    description: description.trim(),
    content: content
  };
}

/**
 * メイン処理
 */
function generateSearchData() {
  const distDir = './dist';

  // distディレクトリの存在確認
  if (!fs.existsSync(distDir)) {
    console.error('[ERROR] distディレクトリが見つかりません。先にビルドを実行してください。');
    process.exit(1);
  }

  // distディレクトリ内の言語フォルダを取得
  const langDirs = fs.readdirSync(distDir).filter(file => {
    const filePath = path.join(distDir, file);
    const stat = fs.statSync(filePath);
    return stat.isDirectory() && !file.startsWith('.');
  });

  if (langDirs.length === 0) {
    console.error('[ERROR] 言語フォルダが見つかりません。');
    process.exit(1);
  }

  console.log('[INFO] 見つかった言語:', langDirs.join(', '));
  console.log('');

  let totalPages = 0;

  langDirs.forEach(lang => {
    const langDir = path.join(distDir, lang);
    const htmlFiles = getAllHtmlFiles(langDir);

    console.log(`[INFO] ${lang}: ${htmlFiles.length}ファイルを処理中...`);

    const searchData = [];

    htmlFiles.forEach(htmlPath => {
      try {
        const data = extractSearchData(htmlPath, langDir);
        searchData.push(data);
      } catch (error) {
        console.error(`[ERROR] ${path.basename(htmlPath)} - ${error.message}`);
      }
    });

    // JSONファイルとして出力
    const outputDir = path.join(langDir, 'assets/data');
    const outputPath = path.join(outputDir, `searchdata-${lang}.json`);

    // ディレクトリがなければ作成
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(searchData, null, 2), 'utf8');

    console.log(`[SUCCESS] 生成完了: assets/data/searchdata-${lang}.json (${searchData.length}ページ)`);
    console.log('');

    totalPages += searchData.length;
  });

  console.log(`[COMPLETE] ${langDirs.length}言語、合計${totalPages}ページの検索データを生成しました。`);
}

// 実行
try {
  generateSearchData();
} catch (error) {
  console.error('[ERROR] エラーが発生しました:', error.message);
  process.exit(1);
}
