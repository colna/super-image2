"use client";

import { AppstoreOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { type ReactNode, useMemo, useState } from "react";

import { ToolModal } from "@/components/tool-modal";
import { useI18n } from "@/lib/i18n";
import { getTool, TOOLS } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/tool-types";

/** 工具 icon 名 → 图标节点映射（数据层只存名字，避免耦合 React 节点）。 */
const TOOL_ICONS: Record<string, ReactNode> = {
  UserOutlined: <UserOutlined />,
};

export function Toolbar() {
  const { t } = useI18n();
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);

  const items: MenuProps["items"] = useMemo(
    () => [
      { key: "_title", type: "group", label: t("tools.menuTitle") },
      ...TOOLS.map((tool) => ({
        key: tool.id,
        icon: TOOL_ICONS[tool.icon],
        label: t(tool.nameKey),
      })),
    ],
    [t],
  );

  const onClick: MenuProps["onClick"] = ({ key }) => {
    const tool = getTool(key);
    if (tool) setActiveTool(tool);
  };

  return (
    <>
      <Dropdown menu={{ items, onClick }} trigger={["click"]} placement="bottomLeft">
        <Button type="text" size="small" icon={<AppstoreOutlined />}>
          {t("header.tools")}
        </Button>
      </Dropdown>

      {activeTool && <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />}
    </>
  );
}
