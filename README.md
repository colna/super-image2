# SuperImage

[English](#english) | [中文](#中文)

---

## English

AI-powered text-to-image conversation platform built on GPT Image 2 with a lossless image pipeline.

### Features

- **Lossless Pipeline** — Raw PNG via `response_format: "b64_json"`, decoded to Blob, stored in IndexedDB with zero compression
- **Conversational Workflow** — Chat-based image generation with full prompt, parameter, and result history per session
- **Image Edit Mode** — Click "Edit" on any generated image to start a chained edit session (each edit builds on the previous result)
- **Reference Image Attachments** — Attach images via clip button, drag & drop, or paste to send to `/images/edits` as reference
- **File Attachments** — Attach text files (.txt, .md, .json, .csv, etc.) to enrich the prompt with file contents
- **Click-to-Preview** — Click any image (generated, attachment thumbnail, or edit source) for fullscreen preview
- **Privacy First** — API Key and all image data stored locally in browser (IndexedDB + localStorage), never sent to third-party servers
- **Multi-Session Management** — Create, rename, search, and delete sessions; edit sessions marked with purple "Edit mode" tag
- **Bilingual UI** — Full Chinese/English interface with zero-dependency i18n via React Context
- **Global Hotkeys** — `⌘N` new session, `⌘,` settings, `⌘K` search, `⌘\` sidebar, `Esc` close panels
- **Responsive Layout** — Desktop 3-column, tablet collapsible sidebar, mobile drawer sidebar
- **Lightbox** — Fullscreen image viewer with keyboard navigation, download, and copy to clipboard

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript 5 |
| UI | Ant Design v6 + @ant-design/icons |
| State | Zustand (localStorage persist) |
| Storage | Dexie.js (IndexedDB) — sessions / messages / images / attachments |
| Testing | Vitest + jsdom + fake-indexeddb |
| AI API | OpenAI Images API (gpt-image-2), extensible via Provider Registry |
| i18n | Zero-dependency React Context (en/zh) |
| Deploy | Vercel |

### Project Structure

```
super-image2/
├── apps/
│   ├── web/                    # Main app — chat + image generation
│   │   ├── app/                # Next.js pages + API routes
│   │   │   ├── chat/layout.tsx # Shared layout (sidebar + header)
│   │   │   ├── chat/page.tsx   # Empty state + new chat
│   │   │   ├── chat/[id]/      # Session page
│   │   │   └── api/            # Route handlers (generate, edit, test-connection)
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom hooks (useHotkeys)
│   │   ├── lib/                # Core logic (db, providers, i18n)
│   │   ├── locales/            # i18n translation files (en.json, zh.json)
│   │   └── stores/             # Zustand stores (settings, session, chat, ui)
│   └── home/                   # Landing page
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── utils/                  # Shared types + utilities
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
└── docs/                       # Project documentation (Chinese)
```

### Quick Start

**Requirements:** Node.js >= 20, pnpm >= 9.15.0

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Start all apps
pnpm dev:web      # Web app only (http://localhost:3000)
pnpm dev:home     # Landing page only (http://localhost:3001)

# Build / Test / Lint
pnpm build
pnpm test
pnpm lint
pnpm type-check
```

### Usage

#### 1. Configure API Key

1. Open `http://localhost:3000`
2. Click the gear icon (or press `⌘,`) to open settings
3. Enter your **API Key** (`sk-...`)
4. Optionally change **Base URL** for third-party proxies
5. Click **Test Connection** to verify

> API Key is stored only in your browser's localStorage.

#### 2. Generate Images

1. Type a prompt in the input box (supports Chinese & English)
2. Adjust parameters via the quick bar: **Size**, **Quality**, **N** (1-4)
3. Press `Enter` to send (`Shift+Enter` for newline)

#### 3. Attach Reference Images

1. Click the 📎 button, drag & drop, or paste images
2. Up to 5 attachments per message
3. Image attachments are sent to `/images/edits` for image-to-image generation
4. Text file attachments are read and appended to the prompt

#### 4. Edit Mode

1. Hover over a generated image and click the **Edit** button
2. A new edit session is created with the image as source
3. Each subsequent edit builds on the **last generated result** (chained editing)
4. Edit sessions are marked with a purple **Edit mode** tag in the sidebar

#### 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | New session |
| `⌘,` | Toggle settings |
| `⌘K` | Focus session search |
| `⌘\` | Toggle sidebar |
| `Esc` | Close settings / Lightbox |
| `Enter` | Send message |
| `Shift+Enter` | Newline in input |
| `←` `→` | Navigate images in Lightbox |

> macOS uses `⌘`, Windows/Linux uses `Ctrl`.

### Image Pipeline

```
User Prompt + (optional reference images)
    ↓
OpenAI API (response_format: "b64_json")
    ↓
base64 string → Uint8Array → Blob (image/png)
    ↓
Blob → IndexedDB imageStore (persistent, lossless)
    ↓
URL.createObjectURL(blob) → <img> display
    ↓
Download: Blob from IndexedDB → save as PNG (lossless)
Copy: Blob → ClipboardItem → system clipboard (lossless)
```

### API Routing

| Scenario | API Endpoint |
|----------|-------------|
| Text prompt only | `/images/generations` (JSON) |
| With image attachments | `/images/edits` (FormData, `image[]`) |
| Edit mode | `/images/edits` (FormData, single `image`) |

### Deploy to Vercel

Each app has a pre-configured `vercel.json`.

```bash
# Via CLI
cd apps/web && vercel --yes    # Main app
cd apps/home && vercel --yes   # Landing page
```

Or import via [Vercel Dashboard](https://vercel.com/new) with **Root Directory** set to `apps/web` or `apps/home`.

### License

MIT

---

## 中文

基于 GPT Image 2 的 AI 文生图对话平台，采用无损图片管线。

### 功能特性

- **无损管线** — 通过 `response_format: "b64_json"` 获取原始 PNG，base64 解码后直接存入 IndexedDB，零压缩零损耗
- **对话式工作流** — 以聊天方式生成图片，每个会话保留完整的 prompt、参数和结果历史
- **图片编辑模式** — 点击生成图片上的"Edit"按钮开启链式编辑会话（每次编辑基于上一次的产物）
- **参考图附件** — 通过📎按钮、拖拽或粘贴附加参考图，发送到 `/images/edits` 进行图生图
- **文件附件** — 支持附加文本文件（.txt, .md, .json, .csv 等），文件内容会追加到 prompt 中
- **点击放大** — 对话中所有图片（生成图、附件缩略图、编辑源图）均支持点击全屏预览
- **隐私优先** — API Key 和图片数据全部存储在浏览器本地（IndexedDB + localStorage），不经过任何中间服务器
- **多会话管理** — 新建、重命名、搜索、删除会话；编辑会话显示紫色"Edit mode"标签
- **中英双语** — 基于 React Context 的零依赖 i18n，完整支持中英文界面
- **全局快捷键** — `⌘N` 新建会话、`⌘,` 设置、`⌘K` 搜索、`⌘\` 侧边栏、`Esc` 关闭面板
- **响应式布局** — 桌面端三栏、平板端可折叠侧边栏、移动端抽屉式侧边栏
- **Lightbox 预览** — 全屏查看原图，键盘左右切换，支持下载和复制原始 PNG

### 技术栈

| 领域 | 技术选型 |
|------|---------|
| 工程架构 | Turborepo + pnpm workspaces (monorepo) |
| 前端框架 | Next.js 15 (App Router) + React 19 + TypeScript 5 |
| UI 组件 | Ant Design v6 + @ant-design/icons |
| 状态管理 | Zustand (localStorage persist) |
| 本地存储 | Dexie.js (IndexedDB) — sessions / messages / images / attachments |
| 测试 | Vitest + jsdom + fake-indexeddb |
| AI 接口 | OpenAI Images API (gpt-image-2)，可通过 Provider Registry 扩展 |
| 国际化 | 零依赖 React Context (en/zh) |
| 部署 | Vercel |

### 项目结构

```
super-image2/
├── apps/
│   ├── web/                    # 主应用 — 对话 + 图片生成
│   │   ├── app/                # Next.js 页面 + API Routes
│   │   │   ├── chat/layout.tsx # 共享布局（侧边栏 + 顶栏）
│   │   │   ├── chat/page.tsx   # 空状态 + 新建会话
│   │   │   ├── chat/[id]/      # 会话页面
│   │   │   └── api/            # 路由处理（generate, edit, test-connection）
│   │   ├── components/         # UI 组件
│   │   ├── hooks/              # 自定义 Hooks（useHotkeys）
│   │   ├── lib/                # 核心逻辑（db, providers, i18n）
│   │   ├── locales/            # i18n 翻译文件（en.json, zh.json）
│   │   └── stores/             # Zustand stores（settings, session, chat, ui）
│   └── home/                   # 落地页（官网）
├── packages/
│   ├── ui/                     # 共享 UI 组件
│   ├── utils/                  # 共享类型定义 + 工具函数
│   ├── eslint-config/          # ESLint 共享配置
│   └── typescript-config/      # TypeScript 共享配置
└── docs/                       # 项目文档
```

### 快速开始

**环境要求：** Node.js >= 20, pnpm >= 9.15.0

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev          # 同时启动所有应用
pnpm dev:web      # 仅主应用 (http://localhost:3000)
pnpm dev:home     # 仅落地页 (http://localhost:3001)

# 构建 / 测试 / 检查
pnpm build
pnpm test
pnpm lint
pnpm type-check
```

### 使用说明

#### 1. 配置 API Key

1. 打开 `http://localhost:3000`
2. 点击右上角齿轮图标（或按 `⌘,`）打开设置面板
3. 填写 **API Key**（`sk-...` 格式）
4. 如使用第三方代理，修改 **Base URL**
5. 点击 **Test Connection** 验证连通性

> API Key 仅存储在浏览器 localStorage 中，不会发送到任何第三方服务器。

#### 2. 生成图片

1. 在输入框输入图片描述（支持中英文）
2. 通过快捷参数条调整：**Size**（尺寸）、**Quality**（质量）、**N**（数量 1-4）
3. 按 `Enter` 发送（`Shift+Enter` 换行）

#### 3. 附加参考图

1. 点击📎按钮、拖拽或粘贴图片
2. 每条消息最多 5 个附件
3. 图片附件会发送到 `/images/edits` 进行图生图
4. 文本文件附件的内容会追加到 prompt 中作为上下文

#### 4. 编辑模式

1. 悬停生成的图片，点击 **Edit** 按钮
2. 创建新的编辑会话，以该图片为源图
3. 后续每次编辑都基于**上一次生成的结果**（链式编辑）
4. 编辑会话在侧边栏显示紫色 **Edit mode** 标签

#### 5. 快捷键一览

| 快捷键 | 功能 |
|-------|------|
| `⌘N` | 新建会话 |
| `⌘,` | 打开/关闭设置面板 |
| `⌘K` | 聚焦会话搜索 |
| `⌘\` | 展开/折叠侧边栏 |
| `Esc` | 关闭设置面板 / Lightbox |
| `Enter` | 发送消息 |
| `Shift+Enter` | 输入框内换行 |
| `←` `→` | Lightbox 切换图片 |

> macOS 使用 `⌘`，Windows/Linux 使用 `Ctrl`。

### 图片管线

```
用户 Prompt +（可选参考图）
    ↓
OpenAI API (response_format: "b64_json")
    ↓
base64 字符串 → Uint8Array → Blob (image/png)
    ↓
Blob → IndexedDB imageStore（持久化存储，无损）
    ↓
URL.createObjectURL(blob) → <img> 展示
    ↓
下载：从 IndexedDB 取 Blob → 保存为 PNG（无损）
复制：Blob → ClipboardItem → 系统剪贴板（无损）
```

### API 路由

| 场景 | API 端点 |
|------|---------|
| 纯文本 prompt | `/images/generations`（JSON） |
| 带图片附件 | `/images/edits`（FormData, `image[]`） |
| 编辑模式 | `/images/edits`（FormData, 单个 `image`） |

### 部署到 Vercel

每个应用已包含 `vercel.json` 配置。

```bash
# 通过 CLI
cd apps/web && vercel --yes    # 主应用
cd apps/home && vercel --yes   # 落地页
```

或在 [Vercel Dashboard](https://vercel.com/new) 导入仓库，**Root Directory** 设为 `apps/web` 或 `apps/home`。

### License

MIT
