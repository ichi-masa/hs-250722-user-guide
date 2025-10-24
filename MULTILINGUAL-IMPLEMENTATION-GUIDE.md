# 多言語化実装ガイド

## 📋 プロジェクト概要

**対応言語数**: 26言語
**総ページ数**: 32ページ/言語
**総ファイル数**: 832 HTMLファイル
**実装方式**: 言語切り替え機能 + ダミーHTML（後で翻訳版と差し替え）

---

## 🎯 実装の方針

### フェーズ1: 仕組み構築（5営業日）
お客様の要望:
> 「翻訳後のHTMLデータが無くても作業を進めて、翻訳データが来たら入れるだけにしたい」

**実装内容:**
1. 言語切り替えUIの実装
2. 英語版HTMLを26言語分コピー（ダミー配置）
3. 検索機能の多言語対応
4. 全HTMLに言語切り替え機能を追加

**完成状態:**
- 26言語フォルダが存在
- 言語切り替えが動作（全て英語のまま）
- 検索機能も動作（英語のまま）

### フェーズ2: 翻訳HTML差し替え（お客様 or 弊社）
**作業内容:**
1. 翻訳HTMLファイルを各言語フォルダに上書き
2. searchdata.json生成（技術作業）
3. 動作確認

**工数:**
- お客様対応: 3〜4営業日（HTML差し替えのみ、複数名体制必須）
- 弊社対応: 7営業日（全作業込み）

---

## 📁 ディレクトリ構造

### 現在（英語のみ）
```
dist/
└── en-GB/
    ├── index.html
    ├── how-to-use.html
    ├── ... (32ページ)
    └── assets/
        ├── css/
        ├── js/
        ├── img/
        └── data/
            └── searchdata-en-GB.json
```

### フェーズ1完了後（26言語ダミー）
```
dist/
├── en-GB/           # 完成版（英語）
├── ja/              # ダミー（英語のコピー）
├── zh-CN/           # ダミー（英語のコピー）
├── de/              # ダミー（英語のコピー）
├── fr/              # ダミー（英語のコピー）
└── ... (26言語分)
    ├── index.html (言語切り替えUI追加済み)
    ├── how-to-use.html
    └── assets/
        ├── css/style.css
        ├── js/
        │   ├── language-config.js    (新規)
        │   ├── language-switcher.js  (新規)
        │   └── search.js             (修正済み)
        └── data/
            └── searchdata-[lang].json (英語ベース)
```

### フェーズ2完了後（翻訳版）
```
dist/
├── ja/
│   ├── index.html (翻訳済み)
│   └── assets/data/searchdata-ja.json (日本語版)
└── ...
```

---

## 🛠️ 実装手順

### Step 1: 対応言語コードの確定

**26言語リスト:**
```javascript
const LANGUAGES = [
  { code: 'en-GB', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: '中文（简体）', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' }
];
```

---

### Step 2: 言語設定ファイル作成

**ファイル:** `src/js/language-config.js`

```javascript
// 対応言語の設定
const LANGUAGES = [
  { code: 'en-GB', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  // ... 26言語分
];

const DEFAULT_LANG = 'en-GB';

// 現在の言語を取得
function getCurrentLanguage() {
  const path = window.location.pathname;
  const match = path.match(/\/([a-z]{2}(-[A-Z]{2})?)\//);
  return match ? match[1] : DEFAULT_LANG;
}

// LocalStorageから言語設定を取得
function getSavedLanguage() {
  return localStorage.getItem('selectedLanguage') || DEFAULT_LANG;
}

// 言語を保存
function saveLanguage(lang) {
  localStorage.setItem('selectedLanguage', lang);
}
```

---

### Step 3: 言語切り替えUI実装

**ファイル:** `src/js/language-switcher.js`

```javascript
// 言語切り替えUIの生成
class LanguageSwitcher {
  constructor() {
    this.currentLang = getCurrentLanguage();
    this.init();
  }

  init() {
    this.createSwitcher();
    this.attachEvents();
  }

  // ドロップダウンを生成
  createSwitcher() {
    const container = document.querySelector('.p-header');
    if (!container) return;

    const switcherHTML = `
      <div class="p-language-switcher">
        <button class="p-language-switcher__button js-dropdown"
                aria-controls="languageDropdown"
                aria-expanded="false">
          <span class="p-language-switcher__current">${this.getCurrentLanguageName()}</span>
          <svg class="p-language-switcher__icon" width="12" height="8">
            <path d="M1 1l5 5 5-5" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        <ul class="p-language-switcher__dropdown"
            id="languageDropdown"
            aria-hidden="true">
          ${this.generateLanguageList()}
        </ul>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', switcherHTML);
  }

  // 言語リストを生成
  generateLanguageList() {
    return LANGUAGES.map(lang => `
      <li class="p-language-switcher__item ${lang.code === this.currentLang ? 'is-active' : ''}">
        <a href="${this.getLanguageUrl(lang.code)}"
           class="p-language-switcher__link"
           data-lang="${lang.code}">
          <span class="p-language-switcher__flag">${lang.flag}</span>
          <span class="p-language-switcher__name">${lang.name}</span>
        </a>
      </li>
    `).join('');
  }

  // 現在の言語名を取得
  getCurrentLanguageName() {
    const lang = LANGUAGES.find(l => l.code === this.currentLang);
    return lang ? `${lang.flag} ${lang.name}` : 'English';
  }

  // 言語別URLを生成
  getLanguageUrl(langCode) {
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop() || 'index.html';
    return `/${langCode}/${fileName}`;
  }

  // イベントリスナーを設定
  attachEvents() {
    const links = document.querySelectorAll('.p-language-switcher__link');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const selectedLang = e.currentTarget.dataset.lang;
        saveLanguage(selectedLang);
      });
    });
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new LanguageSwitcher();
});
```

---

### Step 4: 検索機能の多言語対応

**ファイル修正:** `src/js/search.js`

```javascript
// 既存のsearch.jsに追加・修正
async loadSearchData() {
  try {
    const currentLang = getCurrentLanguage(); // 追加
    const jsonFile = `./assets/data/searchdata-${currentLang}.json`; // 修正

    const response = await fetch(jsonFile);

    if (!response.ok) {
      // フォールバック: 英語版を読み込む
      const fallbackResponse = await fetch('./assets/data/searchdata-en-GB.json');
      this.searchData = await fallbackResponse.json();
    } else {
      this.searchData = await response.json();
    }
  } catch (error) {
    console.error('検索データの読み込みに失敗しました:', error);
    this.searchData = [];
  }
}
```

---

### Step 5: HTML自動処理スクリプト作成

**ファイル:** `add-language-switcher.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🌍 言語切り替えUIを追加します...\n');

// 26言語リスト
const LANGUAGES = [
  'en-GB', 'ja', 'zh-CN', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ko',
  'ar', 'nl', 'pl', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu',
  'ro', 'el', 'th', 'vi', 'id', 'ms'
];

const distDir = './dist';

// 言語切り替えUIのHTML
const languageSwitcherHTML = `
  <!-- Language Switcher -->
  <div class="p-language-switcher" data-language-switcher>
  </div>
`;

// hreflangタグを生成
function generateHreflangTags(currentLang, fileName) {
  const baseUrl = 'https://example.com'; // 本番URLに変更

  return LANGUAGES.map(lang => {
    return `  <link rel="alternate" hreflang="${lang}" href="${baseUrl}/${lang}/${fileName}" />`;
  }).join('\n');
}

// HTMLファイルを処理
function processHTMLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // 現在の言語を判定
  const langMatch = filePath.match(/dist\/([a-z]{2}(-[A-Z]{2})?)\//);
  const currentLang = langMatch ? langMatch[1] : 'en-GB';

  // ファイル名を取得
  const fileName = path.basename(filePath);

  let newContent = content;

  // 1. hreflangタグを追加
  const hreflangTags = generateHreflangTags(currentLang, fileName);
  newContent = newContent.replace(
    '</head>',
    `${hreflangTags}\n</head>`
  );

  // 2. 言語切り替えUIを追加
  if (!newContent.includes('data-language-switcher')) {
    newContent = newContent.replace(
      /<header[^>]*class="[^"]*p-header[^"]*"[^>]*>/,
      (match) => `${match}\n${languageSwitcherHTML}`
    );
  }

  // 3. html lang属性を更新
  newContent = newContent.replace(
    /<html[^>]*>/,
    `<html lang="${currentLang}">`
  );

  // ファイルを上書き保存
  fs.writeFileSync(filePath, newContent, 'utf8');

  return true;
}

// メイン処理
function main() {
  let processedCount = 0;

  LANGUAGES.forEach(lang => {
    const pattern = `${distDir}/${lang}/**/*.html`;
    const files = glob.sync(pattern);

    if (files.length === 0) {
      console.log(`⚠️  ${lang}: HTMLファイルが見つかりません`);
      return;
    }

    files.forEach(file => {
      try {
        processHTMLFile(file);
        processedCount++;
      } catch (error) {
        console.error(`❌ ${file}: 処理失敗`, error.message);
      }
    });

    console.log(`✅ ${lang}: ${files.length}ファイル処理完了`);
  });

  console.log(`\n🎉 合計 ${processedCount} ファイルを処理しました！`);
}

// 実行
main();
```

**実行方法:**
```bash
node add-language-switcher.js
```

---

### Step 6: searchdata.json生成スクリプト

**ファイル:** `generate-searchdata.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio'); // npm install cheerio 必要

console.log('🔍 searchdata.jsonを生成します...\n');

const LANGUAGES = [
  'en-GB', 'ja', 'zh-CN', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ko',
  'ar', 'nl', 'pl', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu',
  'ro', 'el', 'th', 'vi', 'id', 'ms'
];

// HTMLファイルから検索データを抽出
function extractSearchData(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // タイトルを取得
  const title = $('title').text() ||
                $('.p-user-guide-header__title').text() ||
                'Untitled';

  // URLを取得
  const fileName = path.basename(htmlPath);
  const url = `./${fileName}`;

  // ディスクリプションを取得
  const description = $('meta[name="description"]').attr('content') || '';

  // 本文テキストを取得
  $('script, style, header, footer').remove();
  const content = $('.p-main').text()
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);

  return {
    title,
    url,
    description,
    content
  };
}

// 言語ごとにsearchdata.jsonを生成
function generateSearchDataForLanguage(lang) {
  const pattern = `./dist/${lang}/**/*.html`;
  const files = glob.sync(pattern);

  if (files.length === 0) {
    console.log(`⚠️  ${lang}: HTMLファイルが見つかりません`);
    return;
  }

  const searchData = files.map(file => {
    try {
      return extractSearchData(file);
    } catch (error) {
      console.error(`❌ ${file}: データ抽出失敗`, error.message);
      return null;
    }
  }).filter(Boolean);

  // JSONファイルを保存
  const outputDir = `./dist/${lang}/assets/data`;
  const outputFile = `${outputDir}/searchdata-${lang}.json`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(searchData, null, 2), 'utf8');

  console.log(`✅ ${lang}: ${searchData.length}ページ → ${outputFile}`);
}

// メイン処理
function main() {
  LANGUAGES.forEach(lang => {
    generateSearchDataForLanguage(lang);
  });

  console.log('\n🎉 すべての言語のsearchdata.jsonを生成しました！');
}

// 実行
main();
```

**実行方法:**
```bash
npm install cheerio
node generate-searchdata.js
```

---

### Step 7: アセットコピースクリプト

**ファイル:** `copy-assets.js`

```javascript
#!/usr/bin/env node

const fs = require('fs-extra'); // npm install fs-extra 必要

console.log('📦 アセットをコピーします...\n');

const LANGUAGES = [
  'en-GB', 'ja', 'zh-CN', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ko',
  'ar', 'nl', 'pl', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu',
  'ro', 'el', 'th', 'vi', 'id', 'ms'
];

const sourceDir = './dist/en-GB/assets';

LANGUAGES.forEach(lang => {
  if (lang === 'en-GB') return;

  const targetDir = `./dist/${lang}/assets`;

  // assetsフォルダをコピー
  fs.copySync(sourceDir, targetDir, {
    overwrite: false,
    filter: (src) => {
      // 言語固有ファイルは除外
      return !src.includes('searchdata-');
    }
  });

  console.log(`✅ ${lang}: アセットをコピーしました`);
});

console.log('\n🎉 完了！');
```

**実行方法:**
```bash
npm install fs-extra
node copy-assets.js
```

---

## 🚀 実行手順（まとめ）

### フェーズ1: 仕組み構築

```bash
# 1. 必要なパッケージをインストール
npm install cheerio fs-extra glob

# 2. 英語版をビルド
npx gulp build

# 3. 26言語分のフォルダを作成
for lang in ja zh-CN de fr es it pt ru ko ar nl pl tr sv da no fi cs hu ro el th vi id ms; do
  cp -r dist/en-GB dist/$lang
done

# 4. 言語切り替えUIを追加
node add-language-switcher.js

# 5. searchdata.jsonを生成
node generate-searchdata.js

# 6. アセットをコピー
node copy-assets.js

# 7. ローカルサーバーで確認
npx http-server ./dist -p 8080
```

**確認URL:**
- http://localhost:8080/en-GB/
- http://localhost:8080/ja/
- http://localhost:8080/zh-CN/

---

## ✅ 確認項目

### フェーズ1完了時
- [ ] 26言語フォルダが存���する
- [ ] 各言語フォルダに32ページのHTMLがある
- [ ] 言語切り替えドロップダウンが表示される
- [ ] 言語を切り替えるとURLが変わる
- [ ] 検索機能が動作する（英語のまま）
- [ ] hreflangタグが全ページに追加されている

### フェーズ2完了時（翻訳版差し替え後）
- [ ] 翻訳されたテキストが表示される
- [ ] 言語切り替えが正しく動作する
- [ ] 検索機能が各言語で動作する
- [ ] リンク切れがない
- [ ] CSS/JS/画像が正しく読み込まれる

---

## 📝 納品物

### 先方に提供するファイル

1. **実装済みのdistフォルダ**
   - 26言語 × 32ページ = 832 HTML
   - 全て言語切り替え機能付き
   - 検索機能付き（英語ベース）

2. **翻訳HTML差し替え手順書**
   - ファイル配置方法
   - searchdata.json生成方法（または弊社対応）
   - 動作確認方法

3. **README.md**
   - プロジェクト概要
   - ディレクトリ構造
   - ローカルサーバー起動方法

---

## ⚠️ 注意事項

### searchdata.json について
**技術的な作業のため、弊社対応を推奨**

理由:
- HTMLからテキスト抽出が必要
- Node.jsスクリプト実行が必要
- 先方で対応困難な可能性が高い

### 翻訳HTML差し替えについて
**作業量の見積もり:**
- 832ファイル × 2分 = 28時間
- 3〜4営業日（複数名体制必須）
- 確認作業を含めると5〜6営業日

---

## 🔧 トラブルシューティング

### 言語切り替えが動かない
```javascript
// ブラウザのコンソールで確認
console.log(getCurrentLanguage()); // 現在の言語
console.log(LANGUAGES); // 言語リスト
```

### 検索が動かない
```bash
# searchdata.jsonが存在するか確認
ls dist/ja/assets/data/searchdata-ja.json

# JSONファイルの中身を確認
cat dist/ja/assets/data/searchdata-ja.json
```

### CSS/JSが読み込まれない
```bash
# パスを確認
# 相対パスが正しいか確認
# dist/ja/index.html から見て
# ./assets/css/style.css が正しいか
```

---

## 📞 サポート

質問・不明点があれば、いつでもご連絡ください。

**連絡先:** [あなたの連絡先]

---

**最終更新日:** 2025-01-08
