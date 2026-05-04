# BJJ Echo（BJJ 训练日志）

巴西柔术训练记录微信小程序，轻量级、本地存储，适合个人使用。

## 功能

- **首页**：最近课程列表，快速查看
- **记录**：添加新课程（日期、时间、身体状态、伤痛、招式、备注）
- **课程详情**：查看单次课程完整信息
- **复盘**：按时间、位置、动作筛选招式，便于复习
- **流程编辑器**：招式流程可视化

## 快速开始

### 1. 用微信开发者工具打开

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择本目录
3. 在 `project.config.json` 中填写你的 AppID（或先用测试号）

### 2. 生成 TabBar 图标

首次使用需生成占位图标：

```bash
npm run icons
# 或
node create-icons.cjs
```

可替换 `images/` 目录下的 PNG 文件以自定义图标：

- `home.png` / `home-active.png` - 首页
- `add.png` / `add-active.png` - 记录
- `review.png` / `review-active.png` - 复盘

建议尺寸 81×81 像素。

### 3. 发布流程

1. 在 [微信公众平台](https://mp.weixin.qq.com) 注册小程序，获取 AppID
2. 在 `project.config.json` 中填入 AppID
3. 在微信开发者工具中点击「上传」
4. 登录微信公众平台提交审核

## 项目结构

```
├── pages/           # 页面
│   ├── index/       # 首页
│   ├── add/         # 添加课程
│   ├── addTech/     # 添加招式
│   ├── classDetail/ # 课程详情
│   ├── flowEditor/  # 流程编辑器
│   ├── review/      # 复盘
│   └── techDetail/  # 招式详情
├── utils/           # 工具函数、存储
├── images/          # TabBar 图标
├── app.js
├── app.json
└── project.config.json
```

## 数据存储

数据保存在本地（`wx.setStorageSync`），不依赖服务器。

## 许可证

MIT
