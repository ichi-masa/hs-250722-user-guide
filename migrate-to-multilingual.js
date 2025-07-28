#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🌍 多言語化移行スクリプトを開始します...\n');

// 1. gulpfile.js の設定変更
console.log('1. gulpfile.js の設定を変更中...');
const gulpfilePath = './gulpfile.js';
let gulpfileContent = fs.readFileSync(gulpfilePath, 'utf8');
gulpfileContent = gulpfileContent.replace(
  'const isMultiLingual = false;',
  'const isMultiLingual = true;'
);
fs.writeFileSync(gulpfilePath, gulpfileContent);
console.log('   ✅ gulpfile.js を更新しました\n');

// 2. JSONファイルの移行
console.log('2. JSONファイルを移行中...');
const oldJsonPath = './src/ejs/pageData/pageData.json';
const newJsonPath = './src/ejs/pageData/pageData-en.json';

if (fs.existsSync(oldJsonPath)) {
  // 現在のJSONを英語版としてリネーム
  fs.renameSync(oldJsonPath, newJsonPath);
  console.log('   ✅ pageData.json → pageData-en.json に移行');

  // 英語版を読み込んで他言語版のテンプレートを作成
  const enData = JSON.parse(fs.readFileSync(newJsonPath, 'utf8'));
  
  // 日本語版テンプレート
  const jaData = {
    ...enData,
    lang: "ja",
    langName: "日本語",
    languages: [
      {"code": "en", "name": "English", "path": "../en/"},
      {"code": "ja", "name": "日本語", "path": "../ja/"},
      {"code": "de", "name": "Deutsch", "path": "../de/"}
    ]
  };
  fs.writeFileSync('./src/ejs/pageData/pageData-ja.json', JSON.stringify(jaData, null, 2));
  console.log('   ✅ pageData-ja.json テンプレートを作成');

  // ドイツ語版テンプレート
  const deData = {
    ...enData,
    lang: "de",
    langName: "Deutsch",
    languages: [
      {"code": "en", "name": "English", "path": "../en/"},
      {"code": "ja", "name": "日本語", "path": "../ja/"},
      {"code": "de", "name": "Deutsch", "path": "../de/"}
    ]
  };
  fs.writeFileSync('./src/ejs/pageData/pageData-de.json', JSON.stringify(deData, null, 2));
  console.log('   ✅ pageData-de.json テンプレートを作成');

  // 英語版にもlanguagesを追加
  const updatedEnData = {
    ...enData,
    languages: [
      {"code": "en", "name": "English", "path": "../en/"},
      {"code": "ja", "name": "日本語", "path": "../ja/"},
      {"code": "de", "name": "Deutsch", "path": "../de/"}
    ]
  };
  fs.writeFileSync(newJsonPath, JSON.stringify(updatedEnData, null, 2));
  console.log('   ✅ pageData-en.json を更新\n');
}

// 3. EJSファイルの修正
console.log('3. EJSファイルを更新中...');
const ejsFiles = ['./src/ejs/index.ejs', './src/ejs/about.ejs'];

ejsFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/_head-simple'/g, "_head'");
    content = content.replace(/_header-simple'/g, "_header'");
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ ${path.basename(filePath)} を更新`);
  }
});

console.log('\n🎉 多言語化移行が完了しました！');
console.log('\n📝 次の手順:');
console.log('1. pageData-ja.json と pageData-de.json の内容を編集してください');
console.log('2. npx gulp build を実行してください');
console.log('3. dist/en/, dist/ja/, dist/de/ が生成されることを確認してください');