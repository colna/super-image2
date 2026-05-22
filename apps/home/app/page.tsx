"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Layout, Row, Typography } from "antd";

const { Title, Paragraph } = Typography;
const { Footer } = Layout;

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Lossless Pipeline",
    desc: "Images are stored as raw PNGs in your browser — no compression, no quality loss. What the AI generates is exactly what you get.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Chat-based Workflow",
    desc: "Generate images through natural conversation. Each session keeps full history with prompts, parameters, and results.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" />
        <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Privacy First",
    desc: "Your API key and images stay in your browser. Nothing is sent to our servers — the app talks directly to the AI provider.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Fast & Flexible",
    desc: "Switch sizes, quality presets, and batch count on the fly. Supports custom API endpoints and multiple models.",
  },
];

export default function Home() {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "128px 24px 96px" }}>
        <Title level={1} style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          SuperImage
        </Title>
        <Paragraph style={{ fontSize: 18, color: "#666", maxWidth: 480, margin: "0 auto 32px" }}>
          Generate stunning images from text. Powered by GPT&#8209;Image&#8209;1.
          Lossless quality. Privacy first. Open source.
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
          Start Creating
        </Button>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
        <Row gutter={[24, 24]}>
          {FEATURES.map((f) => (
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
        SuperImage &copy; {new Date().getFullYear()} &mdash; Built with Next.js, Ant Design, and OpenAI
      </Footer>
    </Layout>
  );
}
