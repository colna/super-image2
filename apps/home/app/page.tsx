"use client";

import { ArrowRightOutlined, GlobalOutlined } from "@ant-design/icons";
import { Button, Card, Col, Layout, Row, Segmented, Typography } from "antd";
import { useMemo } from "react";

import { useI18n, type Locale } from "@/lib/i18n";

const { Title, Paragraph } = Typography;
const { Footer } = Layout;

const FEATURE_ICONS = [
  (
    <svg key="lossless" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg key="chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg key="privacy" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg key="flexible" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
];

const FEATURE_KEYS = [
  { titleKey: "feature.losslessTitle", descKey: "feature.losslessDesc" },
  { titleKey: "feature.chatTitle", descKey: "feature.chatDesc" },
  { titleKey: "feature.privacyTitle", descKey: "feature.privacyDesc" },
  { titleKey: "feature.flexibleTitle", descKey: "feature.flexibleDesc" },
];

export default function Home() {
  const { locale, setLocale, t } = useI18n();

  const features = useMemo(
    () =>
      FEATURE_KEYS.map((f, i) => ({
        icon: FEATURE_ICONS[i],
        title: t(f.titleKey),
        desc: t(f.descKey),
      })),
    [t],
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Language toggle */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <GlobalOutlined style={{ color: "#999", fontSize: 14 }} />
        <Segmented
          size="small"
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          options={[
            { label: "EN", value: "en" },
            { label: "中文", value: "zh" },
          ]}
        />
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "128px 24px 96px" }}>
        <Title level={1} style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          {t("hero.title")}
        </Title>
        <Paragraph style={{ fontSize: 18, color: "#666", maxWidth: 480, margin: "0 auto 32px" }}>
          {t("hero.desc")}
        </Paragraph>
        <Button
          type="primary"
          shape="round"
          size="large"
          href="/chat"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          style={{ height: 44, paddingInline: 28, fontSize: 15 }}
        >
          {t("hero.cta")}
        </Button>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
        <Row gutter={[24, 24]}>
          {features.map((f) => (
            <Col xs={24} sm={12} key={f.title}>
              <Card
                variant="borderless"
                style={{ height: "100%", background: "#fafafa", borderRadius: 16 }}
                styles={{ body: { padding: 24 } }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  {f.icon}
                </div>
                <Title level={5} style={{ marginBottom: 4 }}>
                  {f.title}
                </Title>
                <Paragraph style={{ color: "#666", marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                  {f.desc}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Footer */}
      <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0", color: "#999", fontSize: 13 }}>
        {t("footer.text", { year: new Date().getFullYear() })}
      </Footer>
    </Layout>
  );
}
