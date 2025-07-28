#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 英語単一言語に戻します...\n');

// 1. gulpfile.js の設定変更
console.log('1. gulpfile.js の設定を変更中...');
const gulpfilePath = './gulpfile.js';
let gulpfileContent = fs.readFileSync(gulpfilePath, 'utf8');
gulpfileContent = gulpfileContent.replace(
  'const isMultiLingual = true;',
  'const isMultiLingual = false;'
);
fs.writeFileSync(gulpfilePath, gulpfileContent);
console.log('   ✅ gulpfile.js を更新しました\n');

// 2. JSONファイルの復元
console.log('2. JSONファイルを復元中...');
const enJsonPath = './src/ejs/pageData/pageData-en.json';
const originalJsonPath = './src/ejs/pageData/pageData.json';

if (fs.existsSync(enJsonPath)) {
  // 英語版を元のファイル名に戻す
  const enData = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
  
  // languages プロパティを削除
  delete enData.languages;
  delete enData.langName;
  
  fs.writeFileSync(originalJsonPath, JSON.stringify(enData, null, 2));
  console.log('   ✅ pageData-en.json → pageData.json に復元');

  // 多言語版ファイルを削除
  fs.unlinkSync(enJsonPath);
  if (fs.existsSync('./src/ejs/pageData/pageData-ja.json')) {
    fs.unlinkSync('./src/ejs/pageData/pageData-ja.json');
  }
  if (fs.existsSync('./src/ejs/pageData/pageData-de.json')) {
    fs.unlinkSync('./src/ejs/pageData/pageData-de.json');
  }
  console.log('   ✅ 多言語版JSONファイルを削除\n');
}

// 3. EJSファイルの修正
console.log('3. EJSファイルを更新中...');
const ejsFiles = ['./src/ejs/index.ejs', './src/ejs/about.ejs'];

ejsFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/_head'/g, "_head-simple'");
    content = content.replace(/_header'/g, "_header-simple'");
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ ${path.basename(filePath)} を更新`);
  }
});

console.log('\n🎉 英語単一言語への復元が完了しました！');
console.log('\n📝 次の手順:');
console.log('1. npx gulp build を実行してください');
console.log('2. dist/index.html, dist/about.html が生成されることを確認してください');