# 多言語化移行ガイド

## 📋 移行手順

### 1. gulpfile.js の設定変更
```javascript
const isMultiLingual = true; // falseからtrueに変更
```

### 2. JSONファイルの移行
```bash
# 現在のファイルをリネーム
mv src/ejs/pageData/pageData.json src/ejs/pageData/pageData-en.json

# 他言語ファイルを作成
cp src/ejs/pageData/pageData-en.json src/ejs/pageData/pageData-ja.json
cp src/ejs/pageData/pageData-en.json src/ejs/pageData/pageData-de.json

# 各ファイルを編集して言語別コンテンツを追加
```

### 3. EJSファイルの修正

**index.ejs:**
```ejs
<!-- 変更前 -->
<%- include('./common/_head-simple', { pageKey: 'top' }) %>
<%- include('./common/_header-simple', { pageKey: 'top' }) %>

<!-- 変更後 -->
<%- include('./common/_head', { pageKey: 'top' }) %>
<%- include('./common/_header', { pageKey: 'top' }) %>
```

**about.ejs:**
```ejs
<!-- 変更前 -->
<%- include('./common/_head-simple', { pageKey: 'about' }) %>
<%- include('./common/_header-simple', { pageKey: 'about' }) %>

<!-- 変更後 -->
<%- include('./common/_head', { pageKey: 'about' }) %>
<%- include('./common/_header', { pageKey: 'about' }) %>
```

### 4. 言語別コンテンツの追加

**pageData-ja.json例:**
```json
{
  "lang": "ja",
  "langName": "日本語",
  "languages": [
    {"code": "en", "name": "English", "path": "../en/"},
    {"code": "ja", "name": "日本語", "path": "../ja/"},
    {"code": "de", "name": "Deutsch", "path": "../de/"}
  ],
  "top": {
    "title": "ウェルカムページ",
    "description": "日本語サイトのメインページです"
  },
  "nav": {
    "home": "ホーム",
    "about": "会社について",
    "tutorial": "チュートリアル"
  }
}
```

### 5. ビルドと確認
```bash
npx gulp build
# 出力: dist/en/, dist/ja/, dist/de/ が生成される
```

## 🎯 移行時間の目安
- **設定変更**: 5分
- **JSONファイル作成**: 30分〜1時間（言語数による）
- **EJSファイル修正**: 10分
- **動作確認**: 15分

**合計: 約1〜1.5時間で多言語化完了**

## 💡 重要な設計思想

### サイドナビゲーションの多言語対応
現在のサイドナビコンポーネント（`_side-nav.ejs`）は、**完全に多言語化準備済み**です。

**設計のポイント：**
```ejs
// ❌ 悪い例（ハードコード）
{ href: './trademarks.html', text: 'Trademarks', key: 'trademarks' }

// ✅ 良い例（JSON参照）
{ href: './trademarks.html', text: json.nav.trademarks, key: 'trademarks' }
```

**この設計により：**
- **30ページ作成してもメンテナンス性抜群**
- **多言語化時はJSONファイルの翻訳のみ**
- **コンポーネントファイル自体は一切変更不要**

### 必要なnavプロパティ
`pageData.json`には以下のnavプロパティが必要：
```json
{
  "nav": {
    "home": "Home",
    "trademarks": "Trademarks",
    "safety": "Important Safety Information",
    "howToUse": "How to use",
    "troubleshooting": "Error Messages and Troubleshooting",
    "maintenance": "Maintenance",
    "otherSettings": "Other Settings",
    "specifications": "Specifications",
    "bodyComposition": "Information on Body Composition"
  }
}
```

**⚠️ 新しいページを追加する際は、必ずnavプロパティも追加してください！**