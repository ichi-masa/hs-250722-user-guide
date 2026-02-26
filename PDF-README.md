# PDF自動生成ガイド

このドキュメントでは、HTMLファイルからPDFを自動生成する方法を説明します。

## 概要

このプロジェクトでは、HTMLファイルから自動的にPDFを生成するNode.jsスクリプトが用意されています。
HTMLを翻訳するだけで、PDFも自動的に多言語対応されます。

**2つのモードがあります：**

| モード | コマンド | 出力 | リンク |
|---|---|---|---|
| 個別PDF | `node generate-pdf.js` | 1HTMLページ = 1PDFファイル（34ファイル） | △ ビューア依存 |
| 結合PDF | `node generate-pdf.js --combined` | 全ページを1つのPDFに結合 | ◎ PDF内ジャンプ |

## 必要な環境

- **Node.js** バージョン18以上
  - [Node.js公式サイト](https://nodejs.org/)からダウンロードしてインストールしてください
  - インストール確認：`node -v` でバージョンが表示されればOK

## 必要なファイル

納品ファイルに以下が含まれています：

```
プロジェクトフォルダ/
├── generate-pdf.js              ← PDF生成スクリプト
├── package.json                 ← 依存パッケージ情報
├── package-lock.json            ← バージョン固定ファイル
└── dist/
    ├── en-GB/
    │   ├── index.html
    │   └── assets/pdf/          ← PDFの出力先
    ├── ja-JP/
    │   └── ...
    └── ... (他の言語)
```

## 使い方

### ステップ1：初回のみ（環境セットアップ）

プロジェクトフォルダで以下のコマンドを実行してください：

```bash
npm install
```

このコマンドで必要なツール（puppeteer等）がインストールされます。
初回のみ実行が必要です。

### ステップ2：HTMLを翻訳

`dist`フォルダ内のHTMLファイルを翻訳します。

### ステップ3：PDFを生成（毎回実行）

プロジェクトフォルダで以下のコマンドを実行します：

#### 個別PDF（1ページ = 1ファイル）

```bash
node generate-pdf.js
```

各HTMLページがそれぞれ1つのPDFファイルとして出力されます。
WEBサイトのPC表示と同じ見た目です。

#### 結合PDF（全ページ1ファイル）

```bash
node generate-pdf.js --combined
```

全ページが1つのPDFにまとまります。
サイドナビ付きで、リンクをクリックするとPDF内でページジャンプします。

## 多言語対応

このスクリプトは自動的に全言語に対応します：
- `dist`フォルダ内の全ての言語フォルダを自動検出
- 各言語ごとにPDFを生成
- 新しい言語を追加した場合も自動で対応
- サイドナビのタイトルも翻訳済みHTMLから自動取得

## 生成されるファイル

### 個別PDFモード

各言語フォルダの `assets/pdf/` にHTMLと同名のPDFが生成されます：

```
dist/
├── en-GB/
│   └── assets/pdf/
│       ├── index.pdf
│       ├── important-safety-information.pdf
│       ├── how-to-use.pdf
│       ├── how-to-use-know-your-device.pdf
│       └── ...（34ファイル）
├── ja-JP/
│   └── assets/pdf/
│       ├── index.pdf
│       └── ...
└── ...
```

### 結合PDFモード

各言語フォルダに1つのPDFが生成されます：

```
dist/
├── en-GB/
│   └── assets/pdf/
│       └── user-guide-en-GB.pdf
├── ja-JP/
│   └── assets/pdf/
│       └── user-guide-ja-JP.pdf
└── ...
```

## 実行結果の確認

### 個別PDFモード

```
[INFO] 見つかった言語: en-GB, ja-JP, fr-FR, ...
[INFO] モード: 個別PDF（ページごと）

[INFO] en-GB: PDF生成中...
    📄 index.html ... OK (104KB)
    📄 important-safety-information.html ... OK (202KB)
    ...
[SUCCESS] en-GB: 34ファイル生成完了 → assets/pdf/

[COMPLETE] PDF生成が完了しました。
```

### 結合PDFモード

```
[INFO] 見つかった言語: en-GB, ja-JP, fr-FR, ...
[INFO] モード: 結合PDF（1ファイル）

[INFO] en-GB: PDF生成中...
    📝 結合HTMLを生成中...
    🚀 PDF生成中...
    ✅ assets/pdf/user-guide-en-GB.pdf
[SUCCESS] en-GB: 生成完了 → assets/pdf/user-guide-en-GB.pdf (34セクション, 8.0MB)

[COMPLETE] PDF生成が完了しました。
```

## PDFの特徴

- **テキスト選択可能**: PDFビューアでテキストを選択・コピーできます
- **見栄え維持**: WEBサイトのPC表示と同じ見た目で出力されます
- **画像・テーブル対応**: 画像やテーブルもそのまま表示されます
- **結合PDFのリンク**: サイドナビや本文中のリンクがPDF内でジャンプします

## トラブルシューティング

### エラー: `distディレクトリが見つかりません`

`dist`フォルダが存在することを確認してください。

### エラー: `puppeteer が見つかりません`

以下のコマンドを実行してください：

```bash
npm install
```

### エラー: `node コマンドが見つかりません`

Node.jsがインストールされていません。
[Node.js公式サイト](https://nodejs.org/)からダウンロードしてインストールしてください。

### PDFの生成に時間がかかる

全言語分を一括生成するため、言語数が多い場合は数分かかることがあります。
1言語あたり約30秒〜1分程度です。

## サポート

問題が解決しない場合は、開発元にお問い合わせください。
