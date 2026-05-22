import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SuperImage",
  description: "AI-powered text-to-image generation platform",
};

const theme = {
  token: {
    colorPrimary: "#1A1A1A",
    borderRadius: 8,
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    colorBgContainer: "#ffffff",
    colorText: "#1A1A1A",
    colorTextSecondary: "#888888",
    colorBorder: "#e8e8e8",
    colorBgLayout: "#f5f5f5",
  },
  components: {
    Select: {
      optionSelectedBg: "#f0f0f0",
      optionActiveBg: "#f5f5f5",
      optionSelectedColor: "#1A1A1A",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif", margin: 0 }}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <Providers>{children}</Providers>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
