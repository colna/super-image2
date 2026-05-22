"use client";

import { MenuOutlined, QuestionCircleOutlined, SettingOutlined } from "@ant-design/icons";
import type { Session } from "@super-image/utils";
import { Button, Layout, Typography } from "antd";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo } from "react";

import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { UserGuide } from "@/components/user-guide";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useI18n } from "@/lib/i18n";
import { useSessionStore } from "@/stores/session-store";
import { useUIStore } from "@/stores/ui-store";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export function ChatLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, toggleSidebar, toggleSettingsPanel, setSettingsPanelOpen, setGuideOpen } = useUIStore();
  const { createSession } = useSessionStore();
  const router = useRouter();
  const { t } = useI18n();

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
    <>
      <style>{`
        @media (max-width: 767px) {
          .chat-layout-sider {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 40;
            height: 100vh !important;
          }
          .chat-layout-sider.ant-layout-sider-collapsed {
            transform: translateX(-100%);
          }
        }
      `}</style>

      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => useUIStore.getState().setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 30,
              background: "rgba(0,0,0,0.2)",
              display: "none",
            }}
            className="chat-layout-backdrop"
          />
        )}

        <Sider
          width={280}
          collapsed={!sidebarOpen}
          collapsedWidth={0}
          trigger={null}
          className="chat-layout-sider"
          style={{
            background: "#fff",
            borderRight: "1px solid #e8e8e8",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <Sidebar />
        </Sider>

        <Layout>
          <Header
            style={{
              height: 48,
              lineHeight: "48px",
              padding: "0 16px",
              background: "#fff",
              borderBottom: "1px solid #e8e8e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={toggleSidebar}
                title={`${t("header.toggleSidebar")} (⌘\\)`}
                size="small"
              />
              <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                {t("app.title")}
              </Title>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setGuideOpen(true)}
                title={t("header.guide")}
                size="small"
              />
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={toggleSettingsPanel}
                title={`${t("header.settings")} (⌘,)`}
                size="small"
              />
            </div>
          </Header>

          <Content style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {children}
          </Content>
        </Layout>

        <SettingsPanel />
        <UserGuide />
      </Layout>

      <style>{`
        @media (max-width: 767px) {
          .chat-layout-backdrop { display: block !important; }
        }
      `}</style>
    </>
  );
}
