"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Session } from "@super-image/utils";
import { Button, Input, Popconfirm, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { useSessionStore } from "@/stores/session-store";

const { Text } = Typography;

export function Sidebar() {
  const router = useRouter();
  const { t } = useI18n();
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
      title: t("sidebar.newChat"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-2",
    };
    await createSession(session);
    router.push(`/chat/${id}`);
  }, [createSession, router, t]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (id === activeSessionId) return;
      setActiveSessionId(id);
      router.push(`/chat/${id}`, { scroll: false });
    },
    [activeSessionId, setActiveSessionId, router],
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await removeSession(id);
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

  const timeAgo = useCallback(
    (ts: number): string => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return t("sidebar.timeJustNow");
      if (mins < 60) return t("sidebar.timeMinutes", { count: mins });
      const hours = Math.floor(mins / 60);
      if (hours < 24) return t("sidebar.timeHours", { count: hours });
      const days = Math.floor(hours / 24);
      return t("sidebar.timeDays", { count: days });
    },
    [t],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 16px 8px" }}>
        <Button block icon={<PlusOutlined />} onClick={handleNewSession} style={{ marginBottom: 8 }}>
          {t("sidebar.newChat")}
        </Button>
        <Input
          prefix={<SearchOutlined style={{ color: "#bbb" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("sidebar.searchPlaceholder")}
          size="small"
          allowClear
          data-sidebar-search=""
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {filteredSessions.length === 0 ? (
          <Text type="secondary" style={{ display: "block", textAlign: "center", padding: "16px 8px", fontSize: 12 }}>
            {search ? t("sidebar.noMatching") : t("sidebar.noSessions")}
          </Text>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className="sidebar-item"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                marginBottom: 2,
                borderRadius: 8,
                cursor: "pointer",
                background: activeSessionId === session.id ? "#f0f0f0" : undefined,
                borderLeft: activeSessionId === session.id ? "2px solid #1a1a1a" : "2px solid transparent",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === session.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(session.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleRenameSubmit(session.id)}
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 13 }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                    {session.type === "edit" && (
                      <Tag color="purple" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", margin: 0, flexShrink: 0 }}>Edit mode</Tag>
                    )}
                    {session.title}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#999" }}>{timeAgo(session.updatedAt)}</div>
              </div>

              <div className="sidebar-item-actions" style={{ marginLeft: 8, display: "flex", gap: 2 }}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 12 }} />}
                  onClick={(e) => { e.stopPropagation(); setEditingId(session.id); setEditTitle(session.title); }}
                  style={{ width: 24, height: 24, minWidth: 24 }}
                />
                <Popconfirm
                  title={t("sidebar.deleteConfirm")}
                  onConfirm={(e) => { e?.stopPropagation(); handleDeleteSession(session.id); }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText={t("sidebar.deleteOk")}
                  cancelText={t("sidebar.deleteCancel")}
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 24, height: 24, minWidth: 24 }}
                  />
                </Popconfirm>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
