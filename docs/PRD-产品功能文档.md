---
title: SuperImage2 产品功能文档
version: "1.0"
date: 2026-05-21
---

# SuperImage2 — 文字生图对话平台 · 产品功能文档

## 1. 产品定位

SuperImage2 是一个**极简风格的文字生图对话平台**。用户通过自然语言描述画面，平台调用 AI 图像生成 API 返回结果，整个过程以**对话形式**承载，支持多会话管理与历史回溯。

设计语言参考 Manus — 干净、留白、聚焦内容，让用户专注于创作本身。

## 2. 目标用户

- 设计师 / 创作者：快速获取概念图、灵感参考
- 开发者：自带 API Key，按需调用各家图像模型
- 普通用户：零门槛的文字生图体验

## 3. 核心功能模块

### 3.1 API 配置（Settings）

| 功能 | 说明 |
|------|------|
| Provider 选择 | 下拉选择服务商，MVP 仅支持 OpenAI（首要支持 gpt-image-1），架构预留扩展口 |
| API Key 输入 | 密码框，本地加密存储（localStorage + AES），不上传服务端 |
| Base URL 输入 | 可选，默认 `https://api.openai.com/v1`，支持自定义代理地址 |
| 模型选择 | 根据 Provider 展示可用模型列表（如 `gpt-image-1`、`dall-e-3`） |
| 连通性测试 | 一键测试 API 是否可用，显示成功/失败状态 |
| 默认参数 | 图片尺寸（1024×1024 / 1792×1024 / 1024×1792）、质量（standard / hd）、数量（1-4） |

**Provider 扩展架构**（预留）：

```
providers/
├── openai.ts        # MVP 实现
├── stability.ts     # 预留：Stability AI
├── midjourney.ts    # 预留：Midjourney API
├── flux.ts          # 预留：Black Forest Labs FLUX
└── provider.ts      # 统一接口定义
```

每个 Provider 实现统一接口：
```typescript
interface ImageProvider {
  id: string;
  name: string;
  models: Model[];
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
  testConnection(config: ProviderConfig): Promise<boolean>;
}
```

### 3.2 对话主界面（Chat）

这是产品的核心交互区域，采用**单栏对话流**布局：

| 功能 | 说明 |
|------|------|
| 输入框 | 底部固定，支持多行文本，Enter 发送，Shift+Enter 换行 |
| 快捷参数 | 输入框上方可快速切换：尺寸、质量、数量，无需进 Settings |
| 消息流 | 用户消息（文字）+ AI 回复（图片 + 修改后的 prompt） |
| 图片展示 | 单张大图或多张网格排列，点击可全尺寸预览，**不压缩画质** |
| 图片操作 | 下载原图（原始 PNG，不压缩）、复制到剪贴板、基于此图编辑（通过 `/v1/images/edits` 端点） |
| 生成状态 | 发送后显示 loading 骨架屏动画，支持取消生成 |
| 错误处理 | API 错误友好提示（余额不足、内容审核拦截、网络超时等） |

### 3.3 多会话管理（Sessions）

| 功能 | 说明 |
|------|------|
| 会话列表 | 左侧边栏，展示所有会话，按最后活跃时间排序 |
| 新建会话 | 侧边栏顶部 "+" 按钮，或快捷键 `⌘N` |
| 会话标题 | 自动取首条消息前 20 字作为标题，支持手动重命名 |
| 会话切换 | 点击侧边栏条目切换，当前会话高亮 |
| 会话删除 | 右键菜单或滑动删除，二次确认 |
| 会话搜索 | 侧边栏顶部搜索框，按标题和消息内容模糊搜索 |

### 3.4 历史记录与回溯

| 功能 | 说明 |
|------|------|
| 持久化存储 | 所有会话和消息存储在 IndexedDB，刷新不丢失 |
| 历史会话恢复 | 点击历史会话即可查看完整对话，并继续生成 |
| 图片画廊 | 独立页面，瀑布流展示所有生成过的图片，支持按时间/会话筛选 |
| 导出 | 单张图片下载、整个会话导出为 ZIP（含图片 + prompt 记录） |

### 3.5 空状态与引导

| 场景 | 展示内容 |
|------|----------|
| 首次打开，未配置 API | 居中引导卡片："配置你的 API Key 开始创作" + 跳转 Settings 按钮 |
| 已配置，无会话 | 居中 prompt 建议卡片（3-4 个示例 prompt），点击即填入输入框 |
| 会话中无消息 | 输入框 placeholder 展示随机 prompt 灵感 |

## 4. 数据模型

```typescript
// 会话
interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  providerId: string;
  modelId: string;
}

// 消息
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'error';
  type: 'generate' | 'edit';  // generate=文字生图, edit=图片编辑
  content: string;             // 用户输入的 prompt 或 AI 返回的描述
  images?: ImageResult[];      // AI 生成/编辑的图片
  sourceImage?: string;        // edit 类型时，基于哪张图片编辑（blob URL 或原始 URL）
  params?: GenerateParams;     // 本次生成使用的参数
  createdAt: number;
  status: 'pending' | 'generating' | 'done' | 'error';
}

// 图片结果
interface ImageResult {
  url: string;                // 原始图片 URL（临时，约 1 小时过期）
  b64Data?: string;           // base64 原始数据（用于持久化，不压缩）
  revisedPrompt?: string;     // API 返回的修改后 prompt
  localBlobUrl?: string;      // 从 b64/blob 生成的本地 Object URL（运行时用）
}

// 生成参数
interface GenerateParams {
  model: string;
  size: string;
  quality: string;
  n: number;
}

// Provider 配置
interface ProviderConfig {
  id: string;
  apiKey: string;             // 加密存储
  baseUrl: string;
  defaultModel: string;
  defaultParams: GenerateParams;
}
```

## 5. 非功能需求

| 维度 | 要求 |
|------|------|
| 性能 | 首屏加载 < 1.5s，图片懒加载，虚拟滚动（消息超过 100 条时），列表中使用缩略图、预览/下载使用原图 |
| 图片质量 | **全链路不压缩**：API 请求 `response_format: "b64_json"` 获取原始 PNG，IndexedDB 存储原始 Blob，预览展示原图，下载输出原始 PNG |
| 安全 | API Key 仅存本地，HTTPS 传输，不经过任何后端中转 |
| 存储 | IndexedDB 持久化，单会话上限 1000 条消息 |
| 响应式 | 桌面优先，适配平板（≥768px），移动端基本可用 |
| 无障碍 | 语义化 HTML，键盘可达，图片 alt 文本 |
| 国际化 | MVP 中文，预留 i18n 结构 |

## 6. 技术选型

| 层级 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 项目已有配置，SSG 适合纯前端应用 |
| UI | Tailwind CSS + Radix UI | 极简风格控制 + 无障碍组件基础 |
| 状态 | Zustand | 轻量，适合会话/消息状态管理 |
| 存储 | IndexedDB (via Dexie.js) | 结构化本地存储，支持大量图片缓存 |
| 图片 API | OpenAI Images API (REST) | 浏览器直调，无需后端 |
| 加密 | Web Crypto API | API Key 本地加密 |

## 7. MVP 范围（v0.1）

**包含：**
- [x] OpenAI Provider 配置与连通性测试（首要支持 gpt-image-1）
- [x] 文字生图对话（`/v1/images/generations`）
- [x] 图片编辑（`/v1/images/edits`，基于已生成图片 + 新 prompt 编辑）
- [x] 多会话管理（新建/切换/删除）
- [x] 历史会话持久化与恢复
- [x] 图片预览与下载
- [x] 空状态引导

**不包含（后续迭代）：**
- [ ] 其他 Provider 接入（Stability、FLUX 等）
- [ ] 图片画廊独立页面
- [ ] 高级编辑（inpainting mask 绘制 / outpainting）
- [ ] 会话导出
- [ ] 多语言
- [ ] 桌面端（Tauri）
