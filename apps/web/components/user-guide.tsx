"use client";

import { CloseOutlined } from "@ant-design/icons";
import { Button, Drawer, Typography } from "antd";

import { useI18n } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

const { Title, Paragraph, Text } = Typography;

export function UserGuide() {
  const { guideOpen, setGuideOpen } = useUIStore();
  const { t } = useI18n();

  return (
    <Drawer
      title={t("guide.title")}
      placement="right"
      width={420}
      open={guideOpen}
      onClose={() => setGuideOpen(false)}
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 24 } }}
    >
      <Title level={5}>{t("guide.gettingStarted")}</Title>
      <Paragraph type="secondary">{t("guide.gettingStartedDesc")}</Paragraph>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        <div>
          <Text strong>{t("guide.step1Title")}</Text>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {t("guide.step1Desc")}
          </Paragraph>
        </div>
        <div>
          <Text strong>{t("guide.step2Title")}</Text>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {t("guide.step2Desc")}
          </Paragraph>
        </div>
        <div>
          <Text strong>{t("guide.step3Title")}</Text>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {t("guide.step3Desc")}
          </Paragraph>
        </div>
        <div>
          <Text strong>{t("guide.step4Title")}</Text>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {t("guide.step4Desc")}
          </Paragraph>
        </div>
      </div>

      <Title level={5} style={{ marginTop: 24 }}>{t("guide.tipsTitle")}</Title>
      <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <li><Text type="secondary">{t("guide.tip1")}</Text></li>
        <li><Text type="secondary">{t("guide.tip2")}</Text></li>
        <li><Text type="secondary">{t("guide.tip3")}</Text></li>
        <li><Text type="secondary">{t("guide.noMemory")}</Text></li>
      </ul>

      <Button
        type="primary"
        block
        onClick={() => setGuideOpen(false)}
        style={{ marginTop: 24 }}
      >
        {t("guide.close")}
      </Button>
    </Drawer>
  );
}
