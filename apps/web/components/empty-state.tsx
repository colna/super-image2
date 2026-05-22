"use client";

import { SettingOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Typography } from "antd";
import { useMemo } from "react";

import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

const { Title, Paragraph } = Typography;

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  const { providers, activeProviderId } = useSettingsStore();
  const { setSettingsPanelOpen } = useUIStore();
  const { t } = useI18n();
  const config = providers[activeProviderId];
  const hasApiKey = !!config?.apiKey;

  const prompts = useMemo(
    () => [t("empty.prompt1"), t("empty.prompt2"), t("empty.prompt3"), t("empty.prompt4")],
    [t],
  );

  if (!hasApiKey) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 16px",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SettingOutlined style={{ fontSize: 24, color: "#888" }} />
          </div>
          <Title level={4}>{t("empty.configureTitle")}</Title>
          <Paragraph type="secondary">
            {t("empty.configureDesc")}
          </Paragraph>
          <Button type="primary" onClick={() => setSettingsPanelOpen(true)}>
            {t("empty.openSettings")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 520 }}>
        <Title level={4} style={{ textAlign: "center" }}>{t("empty.title")}</Title>
        <Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
          {t("empty.subtitle")}
        </Paragraph>
        <Row gutter={[12, 12]}>
          {prompts.map((prompt) => (
            <Col key={prompt} xs={24} sm={12}>
              <Card
                hoverable
                size="small"
                onClick={() => onPromptClick(prompt)}
                style={{ cursor: "pointer" }}
                styles={{ body: { padding: "12px", fontSize: 12, color: "#666" } }}
              >
                {prompt}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
