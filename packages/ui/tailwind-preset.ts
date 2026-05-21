import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FAFAFA",
          sidebar: "#F5F5F5",
          card: "#FFFFFF",
          hover: "#F0F0F0",
        },
        foreground: {
          DEFAULT: "#1A1A1A",
          secondary: "#666666",
          placeholder: "#BDBDBD",
        },
        accent: {
          DEFAULT: "#2563EB",
        },
        success: "#22C55E",
        error: "#EF4444",
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["13px", { lineHeight: "1.6" }],
        sm: ["14px", { lineHeight: "1.6" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["20px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        card: "8px",
        bubble: "12px",
        modal: "16px",
      },
      width: {
        sidebar: "280px",
      },
      spacing: {
        topbar: "48px",
      },
      boxShadow: {
        popup: "0 2px 8px rgba(0,0,0,0.08)",
      },
      animation: {
        "pulse-skeleton": "pulse-skeleton 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-skeleton": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
};

export default preset;
