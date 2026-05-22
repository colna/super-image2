"use client";

import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Segmented, Typography } from "antd";
import { useMemo, useState } from "react";

import { useI18n, type Locale } from "@/lib/i18n";
import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

import { AddProviderForm } from "./settings/add-provider-form";
import { ProviderEditForm } from "./settings/provider-edit-form";
import { ProviderList } from "./settings/provider-list";

const { Text } = Typography;

export function SettingsPanel() {
  const { settingsPanelOpen, setSettingsPanelOpen } = useUIStore();
  const {
    providers,
    activeProviderId,
    setActiveProviderId,
    removeProvider,
  } = useSettingsStore();
  const { locale, setLocale, t } = useI18n();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const providerList = useMemo(
    () => Object.values(providers),
    [providers],
  );

  const editingConfig = editingId ? providers[editingId] : null;

  const handleDelete = (id: string) => {
    if (editingId === id) setEditingId(null);
    removeProvider(id);
  };

  const handleAdded = (id: string) => {
    setShowAdd(false);
    setEditingId(id);
  };

  return (
    <Drawer
      title={t("settings.title")}
      placement="right"
      width={384}
      open={settingsPanelOpen}
      onClose={() => setSettingsPanelOpen(false)}
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 24, display: "flex", flexDirection: "column", gap: 16 } }}
    >
      {/* Provider list */}
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
        {t("settings.providers")}
      </Text>
      <ProviderList
        providers={providerList}
        activeId={activeProviderId}
        onSelect={setActiveProviderId}
        onEdit={(id) => {
          setEditingId(editingId === id ? null : id);
          setShowAdd(false);
        }}
        onDelete={handleDelete}
      />

      {/* Add button */}
      {!showAdd && (
        <Button
          block
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
        >
          {t("settings.addProvider")}
        </Button>
      )}

      {/* Add form */}
      {showAdd && (
        <AddProviderForm
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Edit form */}
      {editingConfig && !showAdd && (
        <ProviderEditForm
          config={editingConfig}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Language toggle */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}>
          {t("settings.language")}
        </Text>
        <Segmented
          block
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          options={[
            { label: "English", value: "en" },
            { label: "中文", value: "zh" },
          ]}
        />
      </div>
    </Drawer>
  );
}
