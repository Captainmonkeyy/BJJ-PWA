# BJJ 训练日志 - 微信小程序版

轻量级巴西柔术训练记录小程序，可在微信中直接使用。

## 功能

- **首页**：最近课程列表，快速查看
- **记录**：添加新课程（日期、时间、身体状态、伤痛、招式、备注）
- **课程详情**：查看单次课程完整信息
- **复盘**：按时间、位置、动作筛选招式，便于复习

## 开发与发布

### 1. 用微信开发者工具打开

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `miniprogram` 目录
3. 在 `project.config.json` 中填写你的 AppID（或先用测试号）

### 2. 生成 TabBar 图标

首次使用需生成占位图标（在项目根目录执行）：

```bash
node miniprogram/create-icons.js
```

可替换 `images/` 目录下的 PNG 文件以自定义图标：

- `home.png` / `home-active.png` - 首页
- `add.png` / `add-active.png` - 记录
- `review.png` / `review-active.png` - 复盘

建议尺寸 81×81 像素。

### 3. 发布流程

1. 在微信公众平台注册小程序，获取 AppID
2. 在 `project.config.json` 中填入 AppID
3. 在微信开发者工具中点击「上传」
4. 登录 [微信公众平台](https://mp.weixin.qq.com) 提交审核

## 数据存储

数据保存在本地（`wx.setStorageSync`），不依赖服务器，适合个人使用。

## 与 Web 版对比

| 功能       | Web 版 | 小程序版 |
|------------|--------|----------|
| 课程记录   | ✓      | ✓        |
| 招式标签   | ✓      | ✓        |
| 复盘筛选   | ✓      | ✓        |
| 标签树     | ✓      | ✗（精简）|
| 录音/照片  | ✓      | ✗（精简）|
| 外部链接   | ✓      | ✗（精简）|

为保持轻量，小程序版去掉了标签树、录音、照片和外部链接，专注核心记录与复盘。
