# BJJ 训练日志

面向巴西柔术（BJJ）及格斗爱好者的训练记录应用，用于记录每节课学到的招式、身体状态和课后伤痛。支持 **Web PWA** 和 **微信小程序** 两种形态。

## 功能特性

### 课程记录
- **上课时间**：日期、开始/结束时间
- **身体状态**：精力充沛、状态良好、一般、疲惫、状态不佳
- **课后伤痛**：记录身体各部位（颈部、肩膀、肘部、手腕、膝盖等）的伤痛及描述

### 招式记录
- **招式名称**：自由输入
- **标签体系**：
  - 一类（位置）：站立、过腿、骑乘、侧控、拿背、龟防
  - 二类（动作）：降服、逃脱
  - 三类（降服细分）：关节技、绞技、压制降服
- **多媒体内容**（Web 版）：
  - 文字备注
  - 录音
  - 照片上传
  - 外部链接（可点击跳转）

### 复盘页面
- 按时间筛选：过去一周、一个月、三个月、全部
- 按标签筛选：位置、动作类型、降服细分
- 查看招式详情

### 标签树页面（Web 版）
- 树状展示所有标签
- 支持拖动调整标签顺序
- 点击标签查看该分类下的所有招式

## 项目结构

```
bjj app/
├── src/                    # Web 版源码
│   ├── components/         # 公共组件
│   ├── pages/              # 页面
│   ├── data/               # 标签等静态数据
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数、数据库
├── miniprogram/            # 微信小程序源码
│   ├── pages/              # 小程序页面
│   │   ├── index/          # 首页
│   │   ├── add/            # 添加课程
│   │   ├── addTech/        # 添加招式
│   │   ├── classDetail/    # 课程详情
│   │   ├── flowEditor/     # 流程编辑器
│   │   ├── review/         # 复盘
│   │   └── techDetail/     # 招式详情
│   └── utils/              # 工具函数、存储
├── public/                 # 静态资源
└── dist/                   # 构建输出（Web）
```

## Web 版（PWA）

### 技术栈
- React 18 + TypeScript
- Vite
- Tailwind CSS
- IndexedDB（idb）本地存储
- PWA（Service Worker、离线支持）

### 快速开始

```bash
# 安装依赖
npm install

# 开发模式（默认 http://localhost:3000）
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

### 数据存储
所有数据存储在浏览器本地 IndexedDB 中，无需后端服务器。支持：
- 课程记录
- 招式详情（含照片 base64、录音 blob URL）
- 标签树自定义顺序

---

## 微信小程序版

轻量级版本，可在微信中直接使用。详见 [miniprogram/README.md](miniprogram/README.md)。

### 功能对比

| 功能       | Web 版 | 小程序版 |
|------------|--------|----------|
| 课程记录   | ✓      | ✓        |
| 招式标签   | ✓      | ✓        |
| 复盘筛选   | ✓      | ✓        |
| 流程编辑器 | -      | ✓        |
| 标签树     | ✓      | ✗（精简）|
| 录音/照片  | ✓      | ✗（精简）|
| 外部链接   | ✓      | ✗（精简）|

### 快速开始

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `miniprogram` 目录
3. 首次使用需生成 TabBar 图标：
   ```bash
   node miniprogram/create-icons.js
   ```
4. 在 `miniprogram/project.config.json` 中填写你的 AppID（或先用测试号）

---

## 许可证

MIT
