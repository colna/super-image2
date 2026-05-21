# SuperImage

AI-powered text-to-image generation platform. Chat-based workflow with lossless image pipeline.

## Features

- **Lossless Pipeline** — Images stored as raw PNGs via `response_format: "b64_json"`. No compression, no quality loss.
- **Chat-based Workflow** — Generate images through conversation. Each session keeps full history with prompts, parameters, and results.
- **Privacy First** — API key and images stay in your browser (IndexedDB). The app talks directly to the AI provider.
- **Multi-session** — Create, rename, search, and delete sessions. Full CRUD with persistent storage.
- **Keyboard Shortcuts** — `⌘N` new session, `⌘,` settings, `⌘K` search, `⌘\` toggle sidebar, `Esc` close panel.
- **Responsive** — Three breakpoints: desktop (sidebar + chat + settings), tablet (collapsible sidebar), mobile (overlay drawer).

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **State**: Zustand (with localStorage persist)
- **Storage**: Dexie.js (IndexedDB) for sessions, messages, and images
- **UI**: Radix UI primitives
- **Testing**: Vitest + jsdom + fake-indexeddb
- **AI Provider**: OpenAI Images API (gpt-image-1), extensible via provider registry

## Project Structure

```
super-image2/
├── apps/
│   ├── web/          # Main app — chat + image generation
│   └── home/         # Landing page
├── packages/
│   ├── ui/           # Shared UI components (Button, Input, Select)
│   ├── utils/        # Shared types, cn(), crypto, storage helpers
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 9.15.0+

### Install

```bash
pnpm install
```

### Development

```bash
# Run both apps
pnpm dev

# Run only the main app (port 3000)
pnpm dev:web

# Run only the landing page (port 3001)
pnpm dev:home
```

### Configure API Key

1. Open the app at `http://localhost:3000`
2. Click the gear icon (or press `⌘,`) to open Settings
3. Enter your OpenAI API key and base URL
4. Click **Test Connection** to verify
5. Start generating images!

Supported providers and base URLs:
- OpenAI: `https://api.openai.com/v1`
- Compatible endpoints (e.g. third-party proxies) can be configured via the Base URL field

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Type Check

```bash
pnpm type-check
```

## Image Pipeline

```
Prompt → OpenAI API (b64_json) → base64 decode → Uint8Array → Blob
  → IndexedDB (persistent) → URL.createObjectURL → display
  → Download: original Blob → PNG file (lossless)
  → Copy: Blob → ClipboardItem (lossless)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | New session |
| `⌘,` | Toggle Settings panel |
| `⌘K` | Focus session search |
| `⌘\` | Toggle sidebar |
| `Esc` | Close Settings / Lightbox |
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `←` `→` | Navigate images in Lightbox |

## Deploy to Vercel

Each app is configured for independent Vercel deployment:

**Web app** (`apps/web`):
- Root Directory: `apps/web`
- Framework: Next.js
- Install Command: `pnpm install`
- Build Command: `cd ../.. && pnpm turbo build --filter=web`

**Home / Landing page** (`apps/home`):
- Root Directory: `apps/home`
- Framework: Next.js
- Install Command: `pnpm install`
- Build Command: `cd ../.. && pnpm turbo build --filter=home`

## License

MIT
