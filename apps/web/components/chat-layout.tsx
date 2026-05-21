"use client";

import type { ReactNode } from "react";

import { SettingsPanel } from "@/components/settings-panel";
import { useUIStore } from "@/stores/ui-store";

export function ChatLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, toggleSidebar, toggleSettingsPanel } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`shrink-0 border-r border-border bg-background transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
          sidebarOpen ? "w-[280px]" : "w-0"
        }`}
      >
        <div className="flex h-full w-[280px] flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Sessions</span>
          </div>
          {/* Session list placeholder — Phase 5 */}
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-foreground-secondary">No sessions yet</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TopBar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-card p-1.5 text-foreground-secondary hover:bg-background-hover hover:text-foreground transition-colors"
              title="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4.5h12M3 9h12M3 13.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-foreground">SuperImage</h1>
          </div>
          <button
            onClick={toggleSettingsPanel}
            className="rounded-card p-1.5 text-foreground-secondary hover:bg-background-hover hover:text-foreground transition-colors"
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

        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>

      <SettingsPanel />
    </div>
  );
}
