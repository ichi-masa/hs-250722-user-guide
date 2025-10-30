"use strict";
const { src, dest, series, watch, lastRun, parallel } = require("gulp");
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const changed = require('gulp-changed');
const fs = require('fs');
const del = require("del");
require('date-utils');

/* sass */
const sass = require('gulp-sass')(require('sass'));
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sassGlob = require("gulp-sass-glob-use-forward");
const mqpacker = require("css-mqpacker");  // メディアクエリをまとめる(https://tips-web.net/gulp4-recommended-tasks/)
const purgecss = require('gulp-purgecss');
const sortCSSmq = require('sort-css-media-queries');
const gulpStylelint = require("gulp-stylelint");
const postcss = require("gulp-postcss");
const cssdeclsort = require("css-declaration-sorter");
const header = require("gulp-header");
const cssmin = require("gulp-cssmin");
const cssnext = require("postcss-cssnext");
const autoprefixer = require("autoprefixer");
const pixrem = require("gulp-pixrem2");

/* html */
const htmlbeautify = require("gulp-html-beautify");

/* ejs */
const ejs = require("gulp-ejs");

/* js */
const concat = require("gulp-concat");
const order = require("gulp-order");
const uglify = require("gulp-uglify");
const saveLicense = require('uglify-save-license');
const babel = require('gulp-babel');


/* imagemin */
const imagemin = require("gulp-imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminSvgo = require("imagemin-svgo");

/* svgスプライト */
const svgmin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');

/* webp */
const webp = require('gulp-webp');//webpに変換

/* browser-sync */
const browserSync = require("browser-sync").create();



// 開発と本番で処理を分ける
// 今回はhtmlのところで使用
const mode = require("gulp-mode")({
  modes: ["production", "development"],
  default: "development",
  verbose: false
});

// html or wp
const sitemode = require("gulp-mode")({
  modes: ["html", "wp"],
  default: "html",
  verbose: false
});


const isStatic = sitemode.html();
const isDevelopment = mode.development();


/********************* 設定 **********************/
// 静的サイトの場合、マークアップにHTMLを使用するかEJSを使用するか
// const isMarkupEjs = false; // HTMLを使用する場合
const isMarkupEjs = true; // EJSを使用する場合

// CSSの圧縮
// const cssStyle = (isDevelopment ? 'expanded' : 'compressed');
// const cssStyle = 'compressed';  // css圧縮する
const cssStyle = 'expanded';  // css圧縮しない
//指定できるキー nested expanded compact compressed

// CSSのmapファイル
const isCssMap = (isDevelopment ? true : false);
// const isCssMap = true;  // css mapを作成する
// const isCssMap = false;  // css mapを作成しない

// jsの圧縮
// const isJsCompressed = (isDevelopment ? false : true);
const isJsCompressed = false; // 圧縮しない
// const isJsCompressed = true; // 圧縮する

// jsのmapファイル
const isJsMap = (isDevelopment ? true : false);
// const isJsMap = true; // js mapを作成する
// const isJsMap = false; // js mapを作成しない

// WPのときのテーマ設定
const themesDir = "theme_dir";  // テーマディレクトリ名
const localURI = `${themesDir}.local`;  // local by flywheel で表示されるドメイン（基本はテーマ名と同じ）
const addDir = "/";  // WPのインストール先がデフォルトから変わっている場合設定
const staticBase = "./dist";
const wpBase = "../app/public/";
const wpThemesBase = `${wpBase}${addDir}/wp-content/themes/${themesDir}`;
/********************* 設定ここまで **********************/


const PATHS = {
  copy: {
    src: "./src/copy/**/!(.gitkeep)*",
    dest: `${staticBase}/en-GB`,
    destwp: wpThemesBase,
  },
  html: {
    src: "./src/html/**/!(_)*.html",
    watch: "./src/html/**/*.html",
    dest: staticBase,
  },
  ejs: {
    src: "./src/ejs/en-GB/**/!(_)*.ejs",
    watch: "./src/ejs/en-GB/**/*.ejs",
    dest: `${staticBase}/en-GB`
  },
  php: {
    src: "./src/php/**/!(_){*.{php,png,jpg,jpeg,ico},style.css}",
    watch: "./src/php/**/*.{php,png,ico}",
    destwp: wpThemesBase,
  },
  styles: {
    src: "./src/sass/**/*.{scss,css}",
    cssSrc: "./src/sass/**/*.css",
    dest: `${staticBase}/en-GB/assets/css/`,
    map: `${staticBase}/en-GB/assets/css/map/`,
    destwp: `${wpThemesBase}/assets/css/`,
    mapwp: `${wpThemesBase}/assets/css/map/`,
  },
  js: {
    src: "./src/js/*.js",
    core_app: "./src/js/!(*.js)**/*.js",
    dest: `${staticBase}/en-GB/assets/js/`,
    map: `${staticBase}/en-GB/assets/js/map/`,
    destwp: `${wpThemesBase}/assets/js/`,
    mapwp: `${wpThemesBase}/assets/js/map/`,
  },
  image: {
    src: ["./src/img/**/!(_)*.{jpg,jpeg,png,gif,svg,ico,webp}"],
    webpSrc: ["./src/img/**/!(_)*.{jpg,jpeg,png,gif,ico}"],
    dest: `${staticBase}/en-GB/assets/img/`,
    destwp: `${wpThemesBase}/assets/img/`,
  },
  sprite: {
    src: "./src/img/sprite/*.svg",
    dest: `${staticBase}/en-GB/assets/img/`,
    destwp: `${wpThemesBase}/assets/img/`,
  },
};

// methods -----------------------------------------------
// エラー出力
function errorHandler(err, stats) {
  if (err || (stats && stats.compilation.errors.length > 0)) {
    const error = err || stats.compilation.errors[0].error;
    notify.onError({ message: "<%= error.message %>" })(error);
    this.emit("end");
  }
}

/**
 * npmでインストールしたプラグインの導入
 */
const plugins = (done) => {
  src([
    './node_modules/swiper/swiper.min.css',
    './node_modules/scroll-hint/css/scroll-hint.css',
  ])
    .pipe(rename((path) => {
      path.dirname += '/app'
    }))
    .pipe(dest(isStatic ? PATHS.styles.dest : PATHS.styles.destwp));

  if (isStatic) {
    src([
      './node_modules/jquery/dist/jquery.min.js',
    ])
      .pipe(rename((path) => {
        path.dirname += '/core'
      }))
      .pipe(dest(isStatic ? PATHS.js.dest : PATHS.js.destwp));
  }

  return src([
    './node_modules/gsap/dist/ScrollTrigger.min.js',
    './node_modules/gsap/dist/gsap.min.js',
    './node_modules/swiper/swiper-bundle.min.js',
    './node_modules/svgxuse/svgxuse.min.js',
    './node_modules/scroll-hint/js/scroll-hint.min.js',
  ])
    .pipe(rename((path) => {
      path.dirname += '/app'
    }))
    .pipe(dest(isStatic ? PATHS.js.dest : PATHS.js.destwp));
}


/**
 * 処理はしないけどファイルとしては必要なデータのコピー
 * 例）既存サイトデータ、PDF、動画など
 */
const copyFunc = () => {
  return src(PATHS.copy.src)
    .pipe(dest(isStatic ? PATHS.copy.dest : PATHS.copy.destwp));
}

// MarkUp===========================================
const markUpFunc = (done) => {
  if (isStatic) {
    if (isMarkupEjs) {
      let jsonFile = "./src/ejs/en-GB/pageData/pageData.json",
        json = JSON.parse(fs.readFileSync(jsonFile, "utf8"));

      return src(PATHS.ejs.src)
        .pipe(
          plumber({
            errorHandler: notify.onError(function (error) {
              return {
                message: "Error: <%= error.message %>",
                sound: false,
              };
            }),
          })
        )
        .pipe(ejs({ json: json }))
        .pipe(ejs({}))
        .pipe(rename({ extname: ".html" }))
        .pipe(replace(/^[ \t]*\n/gim, ""))
        .pipe(
          htmlbeautify({
            indent_size: 2,
            indent_char: " ",
            max_preserve_newlines: 0,
            preserve_newlines: false,
            extra_liners: [],
          })
        )
        .pipe(dest(PATHS.ejs.dest));
    } else {
      return src(PATHS.html.src)
        .pipe(dest(PATHS.html.dest));
    }
  } else {
    done();
  }
}

// php
const phpFunc = (done) => {
  if (isStatic) {
    done();
  } else {
    return src(PATHS.php.src)
      .pipe(dest(PATHS.php.destwp));
  }
}

// style===========================================
// scss
const TARGET_BROWSERS = [
  '> 0.5%',
  'last 2 versions',
  'ie >= 11',
  'ios >= 8',
  'and_chr >= 5',
  'Android >= 5',
];
const sassFunc = (done) => {
  src(PATHS.styles.cssSrc)
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(dest((isStatic ? PATHS.styles.dest : PATHS.styles.destwp)/* , { sourcemaps: "./map" } */))

  return src(PATHS.styles.src, { sourcemaps: isCssMap, base: null })
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(sassGlob())
    .pipe(sass.sync({
      includePaths: ['node_modules', 'src/sass'],
      outputStyle: cssStyle,
    }))
    .pipe(postcss([
      mqpacker({
        sort: sortCSSmq
      }),
      cssdeclsort({ order: "concentric-css" }),
      autoprefixer(TARGET_BROWSERS)
    ]))
    .pipe(gulpStylelint({ fix: true }))
    .pipe(pixrem({
      rootValue: 16, // ルートフォントサイズが16pxではない場合に設定
      atrules: true
    }))
    .pipe(replace(/@charset "UTF-8";/g, ''))
    .pipe(header('@charset "UTF-8";\n\n'))
    .pipe(dest((isStatic ? PATHS.styles.dest : PATHS.styles.destwp), { sourcemaps: (isCssMap ? "./map" : false) }))
    .pipe(browserSync.stream());
}


// scripts===========================================
// javascript
const jsFunc = () => {
  src([PATHS.js.core_app], { sourcemaps: isJsMap })
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(dest((isStatic ? PATHS.js.dest : PATHS.js.destwp), { sourcemaps: "./map" }));

  return src([PATHS.js.src], { sourcemaps: isJsMap })
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(order(["common.js", "*!(script).js", "script.js"], { base: "./src/js/" }))
    .pipe(concat("script.js"))
    // .pipe(babel({  // babel にて ie11 対応のトランスパイル
    //   presets: ['@babel/env']
    // }))
    .pipe(uglify({
      keep_fnames: !isJsCompressed,
      mangle: isJsCompressed,
      compress: isJsCompressed,
      ie: false,  // IE対応
      webkit: false, // safari/webkit対応
      output: {
        comments: saveLicense,
        beautify: !isJsCompressed,
        indent_level: 2
      }
    }))
    .pipe(dest((isStatic ? PATHS.js.dest : PATHS.js.destwp), { sourcemaps: "./map" }))
    .pipe(browserSync.reload({ stream: true }));
}


// image===========================================
/**
 * @see https://github.com/svg/svgo#built-in-plugins
 */
const imageminOption = [
  imageminPngquant({ quality: [0.7, 0.9] }),
  imageminMozjpeg({ quality: 80 }),
  imageminSvgo({
    plugins: [
      { removeViewBox: false },
      { removeAttrs: { attrs: ['id', 'data-name'] } },
      /**
       * @see https://qiita.com/manabuyasuda/items/01a76204f97cd73ffc4e
       */
      // <metadata>を削除する。
      // 追加したmetadataを削除する必要はない。
      { removeMetadata: false },
      // SVGの仕様に含まれていないタグや属性、id属性やvertion属性を削除する。
      // 追加した要素を削除する必要はない。
      { removeUnknownsAndDefaults: false },
      // コードが短くなる場合だけ<path>に変換する。
      // アニメーションが動作しない可能性があるので変換しない。
      { convertShapeToPath: false },
      // 重複や不要な`<g>`タグを削除する。
      // アニメーションが動作しない可能性があるので変換しない。
      { collapseGroups: false },
      // SVG内に<style>や<script>がなければidを削除する。
      // idにアンカーが貼られていたら削除せずにid名を縮小する。
      // id属性は動作の起点となることがあるため削除しない。
      { cleanupIDs: false },
    ]
  }),
  imagemin.gifsicle({
    interlaced: false,
    optimizationLevel: 1,
    colors: 256
  }),
];
const imageminFunc = () => {
  /* webp */
  src(PATHS.image.webpSrc)
    .pipe(webp())
    .pipe(dest(isStatic ? PATHS.image.dest : PATHS.image.destwp));

  return src(PATHS.image.src)
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(changed(isStatic ? PATHS.image.dest : PATHS.image.destwp))
    .pipe(imagemin(imageminOption, { verbose: true }))
    .pipe(rename(function (path) {
      /**
       * sprite対象の画像はcommonフォルダに
       */
      path.dirname = path.dirname.replace(/^sprite/, 'common');
    }))
    .pipe(dest(isStatic ? PATHS.image.dest : PATHS.image.destwp));
}

/**
 * svgスプライト
 * @returns SVGスプライトファイル
 */
const sprite = () => {
  return src(PATHS.sprite.src)
    .pipe(plumber({ errorHandler: errorHandler }))
    .pipe(svgSprite({
      /**
       * @see https://qiita.com/manabuyasuda/items/01a76204f97cd73ffc4e
       */
      mode: {
        symbol: {
          dest: '.',
          sprite: 'sprite.min.svg'
        }
      },
      shape: {
        transform: [{
          svgo: {
            plugins: [
              // `style`属性を削除する。
              { removeStyleElement: true },
              // `fill`属性を削除して、CSSで`fill`の変更ができるようにする。
              { removeAttrs: { attrs: ['class', 'fill', 'stroke', 'data-name'] } },
              // viewBox属性を削除する（widthとheight属性がある場合）。
              // 表示が崩れる原因になるので削除しない。
              { removeViewBox: false },
              // <metadata>を削除する。
              // 追加したmetadataを削除する必要はない。
              { removeMetadata: false },
              // SVGの仕様に含まれていないタグや属性、id属性やvertion属性を削除する。
              // 追加した要素を削除する必要はない。
              { removeUnknownsAndDefaults: false },
              // コードが短くなる場合だけ<path>に変換する。
              // アニメーションが動作しない可能性があるので変換しない。
              { convertShapeToPath: false },
              // 重複や不要な`<g>`タグを削除する。
              // アニメーションが動作しない可能性があるので変換しない。
              { collapseGroups: false },
              // SVG内に<style>や<script>がなければidを削除する。
              // idにアンカーが貼られていたら削除せずにid名を縮小する。
              // id属性は動作の起点となることがあるため削除しない。
              { cleanupIDs: false },
            ],
          },
        }],
      },
      svg: {
        // xml宣言を出力する。
        xmlDeclaration: true,
        // DOCTYPE宣言を出力する。
        doctypeDeclaration: false,
      },
    }))
    .pipe(dest(isStatic ? PATHS.sprite.dest : PATHS.sprite.destwp))
    .pipe(notify({
      message: 'SVGスプライトを生成しました！',
      onLast: true
    }));
}

/// マップファイル除去 ////////////////////////////////////////////
const cleanMap = () => {
  return del([PATHS.styles.map, PATHS.js.map, PATHS.styles.mapwp, PATHS.js.mapwp], { force: true });
}

/**
 * dist をクリーンアップ
 * search-*.jsonファイルのみを保持し、他のファイルは削除
 */
const distClean = () => {
  return del([
    `${staticBase}/**/*`, // 全ファイルを削除対象に
    `!${staticBase}/**/data/search*.json`, // search*.jsonファイルは保持
    `!${staticBase}/**/data/searchdata-*.json`, // searchdata-*.jsonファイルも保持
    `!${staticBase}/**/data`, // dataディレクトリ自体も保持
    `!${staticBase}`, // distディレクトリ自体は保持
    `!${staticBase}/*/`, // 言語ディレクトリも保持
    PATHS.php.destwp
  ], { force: true });
}

// server =========================================
const browserSyncOptionStatic = {
  // open: false,
  // 静的サイト
  port: 3000,
  ui: {
    port: 3001
  },
  server: {
    baseDir: staticBase, // output directory,
    // routes: { "/recruit": "./dist" }
  },
  startPath: '/en-GB/index.html', // 最初に開くページ
  // proxy: "localhost:3000",  // phpファイルのとき
}
const browserSyncOptionDynamic = {
  // WordPressサイト
  proxy: `http://${localURI}`
};
const browsersync = (done) => {
  // phpファイルのとき
  // connect.server({
  // base: PATHS.html.dest,
  //   livereload: true,
  //   port: 3000,
  // }, () => {
  browserSync.init(isStatic ? browserSyncOptionStatic : browserSyncOptionDynamic);
  // });
  done();
}

// browser reload
const browserReload = (done) => {
  browserSync.reload();
  done();
  console.info("Browser reload completed");
}

// watch =========================================
const watchFiles = (done) => {
  watch(PATHS.copy.src, series(copyFunc, browserReload));
  watch(PATHS.html.watch, series(markUpFunc, browserReload));
  watch(PATHS.ejs.watch, series(markUpFunc, browserReload));
  watch(PATHS.php.watch, series(phpFunc, browserReload));
  watch(PATHS.styles.src, sassFunc);
  watch(PATHS.js.src, jsFunc);
  watch(PATHS.image.src, series(imageminFunc, browserReload));
  watch(PATHS.sprite.src, series(sprite, browserReload));
  done();
}

/**
 * 検索データを自動生成
 */
const generateSearchData = (done) => {
  if (isStatic) {
    const { execSync } = require('child_process');
    try {
      console.log('[generateSearchData] 検索データを生成中...');
      execSync('node generate-search-data.js', { stdio: 'inherit' });
      console.log('[generateSearchData] ✓ 検索データの生成が完了しました');
    } catch (error) {
      console.error('[generateSearchData] ✗ 検索データの生成に失敗しました:', error.message);
    }
  }
  done();
};

const buildFunc = series(
  distClean,
  copyFunc,
  parallel(sassFunc, markUpFunc, phpFunc, jsFunc, imageminFunc, sprite, plugins),
  generateSearchData
);

// commands =========================================
exports.default = series(
  buildFunc,
  series(browsersync, watchFiles)
);

exports.build = buildFunc;
exports.html = markUpFunc;
exports.php = phpFunc;
exports.sass = sassFunc;
exports.js = jsFunc;
exports.imagemin = imageminFunc;
exports.sprite = sprite;
exports.cleanmap = cleanMap;
exports.distclean = distClean;
exports.copy = copyFunc;
exports.plugins = plugins;
