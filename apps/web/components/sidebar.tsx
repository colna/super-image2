"use client";

import { Input } from "@super-image/ui";
import type { Session } from "@super-image/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Sidebar() {
  const router = useRouter();
  const {
    sessions,
    activeSessionId,
    loadSessions,
    createSession,
    setActiveSessionId,
    removeSession,
    updateSession,
  } = useSessionStore();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const lower = search.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(lower));
  }, [sessions, search]);

  const handleNewSession = useCallback(async () => {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-1",
    };
    await createSession(session);
    router.push(`/chat/${id}`);
  }, [createSession, router]);

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      router.replace(`/chat/${id}`);
    },
    [setActiveSessionId, router],
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await removeSession(id);
      setConfirmDeleteId(null);
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          router.replace(`/chat/${remaining[0].id}`);
        } else {
          router.replace("/chat");
        }
      }
    },
    [removeSession, activeSessionId, sessions, router],
  );

  const handleRenameSubmit = useCallback(
    async (id: string) => {
      if (editTitle.trim()) {
        await updateSession(id, { title: editTitle.trim() });
      }
      setEditingId(null);
    },
    [editTitle, updateSession],
  );

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <button
        onClick={handleNewSession}
        className="mx-4 mb-3 mt-4 flex items-center gap-2 rounded-card border border-border px-3 py-2 text-sm text-foreground hover:bg-background-hover transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        New Chat
      </button>

      {/* Search */}
      <div className="px-4 mb-2">
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search sessions... (⌘K)"
          className="h-8 text-xs"
          data-sidebar-search=""
        />
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredSessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-foreground-secondary">
            {search ? "No matching sessions" : "No sessions yet"}
          </p>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group relative mb-0.5 flex items-center rounded-card px-3 py-2 cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? "bg-background-hover border-l-2 border-foreground"
                  : "hover:bg-background-hover"
              }`}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(session.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleRenameSubmit(session.id)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="truncate text-sm text-foreground">{session.title}</p>
                )}
                <p className="text-[10px] text-foreground-secondary">
                  {timeAgo(session.updatedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="ml-2 flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(session.id);
                    setEditTitle(session.title);
                  }}
                  className="rounded p-1 text-foreground-secondary hover:text-foreground hover:bg-background"
                  title="Rename"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 1.5l2.5 2.5L4 10.5H1.5V8L8 1.5z" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </button>
                {confirmDeleteId === session.id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(session.id);
                    }}
                    className="rounded p-1 text-foreground-secondary hover:text-red-600 hover:bg-background"
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 3h8M4.5 3V2h3v1M3 3v7.5h6V3" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
