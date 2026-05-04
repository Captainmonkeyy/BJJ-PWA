// 创建 tabBar 占位图标（首次使用或克隆后运行: node create-icons.cjs 或 npm run icons）
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const buf = Buffer.from(pngBase64, 'base64');

['home', 'home-active', 'add', 'add-active', 'review', 'review-active'].forEach(name => {
  fs.writeFileSync(path.join(dir, name + '.png'), buf);
});
console.log('TabBar 图标已创建，可替换 images/ 下的 PNG 获得更好效果。');
