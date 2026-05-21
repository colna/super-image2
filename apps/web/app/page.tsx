"use client";

import { useUIStore } from "@/stores/ui-store";

import { SettingsPanel } from "../components/settings-panel";

export default function Home() {
  const { toggleSettingsPanel } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main area */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <h1 className="text-sm font-semibold text-foreground">SuperImage</h1>
          <button
            onClick={toggleSettingsPanel}
            className="rounded-card p-2 text-foreground-secondary hover:bg-background-hover hover:text-foreground transition-colors"
            title="Settings (⌘,)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M7.5 2.25h3l.375 1.875.75.375L13.5 3.75l2.25 2.25-.75 1.875.375.75L17.25 9v3l-1.875.375-.375.75.75 1.875-2.25 2.25-1.875-.75-.75.375L10.5 18.75h-3l-.375-1.875-.75-.375L4.5 17.25 2.25 15l.75-1.875-.375-.75L.75 12V9l1.875-.375.375-.75L2.25 6 4.5 3.75l1.875.75.75-.375L7.5 2.25z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="10.5" r="2.25" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </header>

        {/* Chat area placeholder — will be filled in Phase 4 */}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-foreground-secondary">
            Start a conversation to generate images
          </p>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel />
    </div>
  );
}
