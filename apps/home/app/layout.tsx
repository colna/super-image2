import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SuperImage — AI Image Generation",
  description: "Generate stunning images from text with AI",
};

const theme = {
  token: {
    colorPrimary: "#1A1A1A",
    borderRadius: 8,
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    colorBgContainer: "#ffffff",
    colorText: "#1A1A1A",
    colorTextSecondary: "#666666",
    colorBorder: "#e5e5e5",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
