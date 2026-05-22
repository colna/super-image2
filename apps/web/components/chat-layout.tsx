"use client";

import type { Session } from "@super-image/utils";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo } from "react";

import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useSessionStore } from "@/stores/session-store";
import { useUIStore } from "@/stores/ui-store";

export function ChatLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, toggleSidebar, toggleSettingsPanel, setSettingsPanelOpen } = useUIStore();
  const { createSession } = useSessionStore();
  const router = useRouter();

  const handleNewSession = useCallback(async () => {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-2",
    };
    await createSession(session);
    router.push(`/chat/${id}`);
  }, [createSession, router]);

  const handleFocusSearch = useCallback(() => {
    const { sidebarOpen: open, setSidebarOpen } = useUIStore.getState();
    if (!open) setSidebarOpen(true);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>("[data-sidebar-search]");
      el?.focus();
    }, open ? 0 : 350);
  }, []);

  const hotkeys = useMemo(
    () => ({
      "meta+n": handleNewSession,
      "meta+,": toggleSettingsPanel,
      "meta+k": handleFocusSearch,
      "meta+\\": toggleSidebar,
      Escape: () => setSettingsPanelOpen(false),
    }),
    [handleNewSession, toggleSettingsPanel, handleFocusSearch, toggleSidebar, setSettingsPanelOpen],
  );

  useHotkeys(hotkeys);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — inline on md+, overlay on mobile */}
      <aside
        className={`
          shrink-0 border-r border-border bg-background overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-[280px]
          md:relative
          ${sidebarOpen ? "md:w-[280px] max-md:translate-x-0" : "md:w-0 max-md:-translate-x-full"}
        `}
      >
        <div className="h-full w-[280px]">
          <Sidebar />
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
              title="Toggle sidebar (⌘\)"
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
