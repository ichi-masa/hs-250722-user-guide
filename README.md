# 伴走サポート HTML WP template

node version：18._._
npm version：10.8.2
gulp version：4.0.2

## How to use

`npm install`
`npx gulp` or `gulp`

### 静的サイトと WordPress サイトに対応

`--wp`のオプションを指定することで WordPress サイトとしてのビルド実施。  
静的サイトを開発する場合：`npx gulp`  
WordPress サイトを開発する場合：`npx gulp --wp`  
※ただし WordPress の場合は gulpfile からテーマ名、出力するパスを確認のこと

## 解説

src フォルダで開発を進める。  
静的サイトの場合、生成物は dist フォルダに生成される。（dist フォルダがなければ作成される）  
dist フォルダは直接編集しても上書きされる。  
また、gulp を走らせた時に最初に削除される

### WP サイトの場合

local での開発を前提とする。  
local で作成されたフォルダ直下、app, conf, logs などのフォルダと同階層にこのフォルダを設置する。  
以下の図の「開発用フォルダ」をこのフォルダとする

```
localにより生成したフォルダ
  ┗ app ━━━━━━━━━━ public ━ wp-content ━ themes ━ 出力先テーマフォルダ
  ┃              ┗ sql
  ┗ conf ━━━━━━━━━ ...
  ┗ logs ━━━━━━━━━ ...
  ┗ 開発用フォルダ ━ src ━ ..
                 ┗ gulpfile
                 ┗ ...
```

### HTML テンプレートエンジン

HTML のテンプレートエンジンは ejs を使用する。  
ただし素の HTML も使用可能。（gulpfile にて isMarkupEjs の値を変更する）

### css

css は scss の記法で src>sass フォルダ内で記述。

### Javascript

src/js フォルダ直下にある js ファイルはビルド後は結合されて一つの js ファイルになる

### image

画像ファイルは圧縮する。  
同時に webp への変換、svg sprite の変換も行う。  
svg sprite に変換する場合は src/img/sprite フォルダに入れる

### copy フォルダ

copy フォルダはそのまま dist や WordPress の場合はテーマフォルダに出力する  
何も処理しないが、サイト用のデータとしては必要なものを入れておく  
例）PDF, 動画、ライブラリの JS や CSS、既存サイトデータなど

### PHP

WordPress サイトの場合、php フォルダを編集する。  
基本的には PHP ファイルはそのまま出力先（テーマフォルダ）にコピーする。  
ただし、先頭に \_（アンダースコア）がついたファイルは出力しない。  
Contact form 7 の管理画面に貼り付けるコードなどをストックするのに使用するといい

### Change log

v1.7.0
Contact Form 7のカスタマイズファイル（cf7_custom.php）を更新
- 動的フィールド機能の説明コメントを追加
- 動的フィールド機能を一時的に無効化（wpcf7_form_tagフィルターをコメントアウト）
- オートコンプリート無効化機能にコメントを追加し、機能の説明を明確化
html要素に `scrollbar-gutter: stable;` を追加。ドロワー開いてメインコンテンツ固定時のガタつき対策
カスタムメニュー、ウィジェットを有効化するコードを追加

v1.6.0
EJSのヘッダーを追加

v1.5.0
スムーススクロール処理の共通化

v1.4.0
\_u-overflowHidden.scss を追加
\_u-hidden.scss を追加
index.html から keyword メタタグを削除

v1.3.0
sort-css-media-queries のバージョンが 2.4.1 以上でエラーになるため 2.4.0 で固定化
スムーススクロール処理を修正（common.js）
投稿詳細ページ、ページネーションのデフォルトスタイルを追加（\_p-article.scss, \_p-pagination.scss）

v1.2.0
swiper の js は読み込まずに css のみ読み込んでいたため css の読み込みを削除（index.html）
gsap, ScrollTrigger の読み込みを追加（index.html）
問い合わせフォーム入力欄がないページでエラーが出ていた件の修正（cf7_addConfirm.js）
ブラウザバックで白飛びする問題の修正（common.js）
画面遷移時の JS のイベントを簡易化（common.js）
functions.php からの読み込みファイル諸々調整
ページ全体のフェードインは body タグに fadeIn クラスが付与されている場合に限定(\_base.scss)
その他微調整

v1.0.0
# hs-250722-user-guide
