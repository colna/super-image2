# SuperImage

AI 驱动的文生图对话平台，基于 gpt-image-2，采用无损图片管线。

## 功能特性

- **无损管线** — 通过 `response_format: "b64_json"` 获取原始 PNG，base64 解码后直接存入 IndexedDB，零压缩零损耗
- **对话式工作流** — 以聊天方式生成图片，每个会话保留完整的 prompt、参数和结果历史
- **隐私优先** — API Key 和图片数据全部存储在浏览器本地（IndexedDB + localStorage），不经过任何中间服务器
- **多会话管理** — 新建、重命名、搜索、删除会话，支持实时搜索过滤
- **全局快捷键** — `⌘N` 新建会话、`⌘,` 设置、`⌘K` 搜索、`⌘\` 侧边栏、`Esc` 关闭面板
- **响应式布局** — 桌面端三栏、平板端可折叠侧边栏、移动端抽屉式侧边栏 + 全屏设置
- **Lightbox 预览** — 点击图片全屏查看原图，键盘左右切换，支持下载和复制原始 PNG

## 技术栈

| 领域     | 技术选型                                                       |
| -------- | -------------------------------------------------------------- |
| 工程架构 | Turborepo + pnpm workspaces (monorepo)                         |
| 前端框架 | Next.js 15 (App Router)                                        |
| 样式方案 | Tailwind CSS 4                                                 |
| 状态管理 | Zustand (localStorage persist)                                 |
| 本地存储 | Dexie.js (IndexedDB) — sessions / messages / images            |
| UI 组件  | Radix UI 原语                                                  |
| 测试     | Vitest + jsdom + fake-indexeddb                                |
| AI 接口  | OpenAI Images API (gpt-image-2)，可通过 Provider Registry 扩展 |

## 项目结构

```
super-image2/
├── apps/
│   ├── web/                  # 主应用 — 对话 + 图片生成
│   │   ├── app/              # Next.js App Router 页面 + API Routes
│   │   ├── components/       # UI 组件（ChatLayout, Sidebar, Settings, Lightbox 等）
│   │   ├── hooks/            # 自定义 Hooks（useHotkeys）
│   │   ├── lib/              # 核心逻辑（db.ts, providers/）
│   │   └── stores/           # Zustand stores（settings, session, chat, ui）
│   └── home/                 # 落地页（官网）
├── packages/
│   ├── ui/                   # 共享 UI 组件（Button, Input, Select）
│   ├── utils/                # 共享类型定义 + 工具函数
│   ├── eslint-config/        # ESLint 共享配置
│   └── typescript-config/    # TypeScript 共享配置
├── turbo.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9.15.0

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
# 同时启动两个应用
pnpm dev

# 仅启动主应用 (http://localhost:3000)
pnpm dev:web

# 仅启动落地页 (http://localhost:3001)
pnpm dev:home
```

### 构建 / 测试 / 检查

```bash
pnpm build        # 构建所有应用
pnpm test         # 运行全部测试（42 tests）
pnpm lint         # ESLint 检查
pnpm type-check   # TypeScript 类型检查
```

## 使用说明

### 1. 配置 API Key

首次使用需要配置 OpenAI API Key：

1. 打开应用 `http://localhost:3000`
2. 点击右上角齿轮图标（或按 `⌘,`）打开设置面板
3. 填写 **API Key**（`sk-...` 格式）
4. 如使用第三方代理，修改 **Base URL**（默认 `https://api.openai.com/v1`）
5. 点击 **Test Connection** 验证连通性
6. 看到绿色 "Connected successfully" 即可开始使用

> API Key 仅存储在浏览器 localStorage 中，不会发送到任何第三方服务器。

### 2. 生成图片

1. 在输入框输入你想生成的图片描述（支持中英文）
2. 通过输入框上方的快捷参数条调整：
   - **Size** — 图片尺寸（1024x1024 / 1024x1536 / 1536x1024 / auto）
   - **Quality** — 图片质量（auto / low / medium / high）
   - **N** — 单次生成数量（1-4 张）
3. 按 `Enter` 发送（`Shift+Enter` 换行）
4. 等待生成完成，图片会以卡片形式展示

### 3. 图片操作

- **悬停图片** → 出现下载和复制按钮
- **点击图片** → 打开 Lightbox 全屏预览（原图分辨率）
- **Lightbox 内操作**：
  - `←` `→` 键切换同组图片
  - 底部工具栏：下载原始 PNG / 复制到剪贴板 / 查看原始尺寸
  - `Esc` 或点击背景关闭

### 4. 会话管理

- **新建会话** — 点击侧边栏 "New Chat" 按钮（或 `⌘N`）
- **切换会话** — 点击侧边栏中的会话项
- **搜索会话** — 侧边栏搜索框实时过滤（`⌘K` 快速聚焦）
- **重命名** — 悬停会话项，点击编辑图标，输入新名称后回车
- **删除** — 悬停会话项，点击删除图标，再点 "Confirm" 确认

### 5. 错误处理

生成失败时会显示对应的错误提示和操作建议：

| 错误类型 | 提示                     | 建议操作         |
| -------- | ------------------------ | ---------------- |
| 认证失败 | API Key invalid          | 打开设置检查 Key |
| 内容违规 | Content policy violation | 修改 prompt 重试 |
| 额度不足 | Quota exceeded           | 检查账户余额     |
| 其他错误 | 显示原始错误信息         | 点击重试按钮     |

## 图片管线

```
用户输入 Prompt
    ↓
OpenAI API (response_format: "b64_json")
    ↓
base64 字符串 → Uint8Array.from(atob(...)) → Blob (image/png)
    ↓
Blob → IndexedDB imageStore (持久化存储)
    ↓
URL.createObjectURL(blob) → <img> 展示
    ↓
下载：直接从 IndexedDB 取 Blob → 保存为 PNG（无损）
复制：Blob → ClipboardItem → 系统剪贴板（无损）
```

## 快捷键一览

| 快捷键        | 功能                    |
| ------------- | ----------------------- |
| `⌘N`          | 新建会话                |
| `⌘,`          | 打开/关闭设置面板       |
| `⌘K`          | 聚焦会话搜索            |
| `⌘\`          | 展开/折叠侧边栏         |
| `Esc`         | 关闭设置面板 / Lightbox |
| `Enter`       | 发送消息                |
| `Shift+Enter` | 输入框内换行            |
| `←` `→`       | Lightbox 切换图片       |

> macOS 使用 `⌘`，Windows/Linux 使用 `Ctrl`。

## Vercel 部署

本项目为 Turborepo monorepo，包含两个可独立部署的 Next.js 应用。每个应用已包含 `vercel.json` 配置文件。

### 方式一：通过 Vercel Dashboard

#### 部署主应用（web）

1. 在 [Vercel Dashboard](https://vercel.com/new) 点击 **Import Git Repository**
2. 选择本仓库
3. 配置项目：
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js（自动检测）
   - **Build & Development Settings**（vercel.json 已预设，无需手动填写）:
     - Install Command: `pnpm install`
     - Build Command: `cd ../.. && pnpm turbo build --filter=web`
4. 点击 **Deploy**

#### 部署落地页（home）

1. 在 Vercel Dashboard 再次 **Import** 同一仓库
2. 配置项目：
   - **Root Directory**: `apps/home`
   - **Framework Preset**: Next.js
   - **Build & Development Settings**:
     - Install Command: `pnpm install`
     - Build Command: `cd ../.. && pnpm turbo build --filter=home`
3. 点击 **Deploy**

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 部署主应用
cd apps/web
vercel --yes

# 部署落地页
cd ../home
vercel --yes
```

### vercel.json 配置说明

每个应用的 `vercel.json` 已包含：

```jsonc
{
  "framework": "nextjs",
  "installCommand": "pnpm install", // 在 app 目录安装，pnpm 会解析 workspace
  "buildCommand": "cd ../.. && pnpm turbo build --filter=<app>", // 回到 monorepo 根目录构建
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin",
        },
      ],
    },
  ],
}
```

### 自定义域名

部署完成后，可在 Vercel Dashboard 的 **Settings → Domains** 中绑定自定义域名：

- 主应用：如 `app.superimage.dev`
- 落地页：如 `superimage.dev`

### 注意事项

- 本应用为纯前端项目（API Routes 仅做请求转发），**无需配置服务端环境变量**
- API Key 存储在用户浏览器的 localStorage 中，Vercel 端不涉及密钥管理
- 两个应用共享同一 Git 仓库，Vercel 会根据 Root Directory 区分构建范围
- Turborepo 的构建缓存在 Vercel 上自动启用（Remote Caching），可在 Dashboard 中开启以加速后续部署

## License

MIT
