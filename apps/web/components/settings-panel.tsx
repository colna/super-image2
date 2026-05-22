"use client";

import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Typography } from "antd";
import { useMemo, useState } from "react";

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
      title="Settings"
      placement="right"
      width={384}
      open={settingsPanelOpen}
      onClose={() => setSettingsPanelOpen(false)}
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 24, display: "flex", flexDirection: "column", gap: 16 } }}
    >
      {/* Provider list */}
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
        Providers
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
          Add Provider
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
    </Drawer>
  );
}
