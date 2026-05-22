"use client";

import { SettingOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Typography } from "antd";

import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

const { Title, Paragraph } = Typography;

const EXAMPLE_PROMPTS = [
  "A serene Japanese garden with cherry blossoms at sunset",
  "An astronaut riding a horse on Mars, digital art",
  "A cozy coffee shop interior with warm lighting, watercolor style",
  "A futuristic city skyline with flying cars at night",
];

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  const { providers, activeProviderId } = useSettingsStore();
  const { setSettingsPanelOpen } = useUIStore();
  const config = providers[activeProviderId];
  const hasApiKey = !!config?.apiKey;

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
          <Title level={4}>Configure API Key</Title>
          <Paragraph type="secondary">
            Add your OpenAI API key to start generating images
          </Paragraph>
          <Button type="primary" onClick={() => setSettingsPanelOpen(true)}>
            Open Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 520 }}>
        <Title level={4} style={{ textAlign: "center" }}>SuperImage</Title>
        <Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
          Describe the image you want to create
        </Paragraph>
        <Row gutter={[12, 12]}>
          {EXAMPLE_PROMPTS.map((prompt) => (
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
