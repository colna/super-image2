"use client";

import { useMemo, useState } from "react";

import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

import { AddProviderForm } from "./settings/add-provider-form";
import { ProviderEditForm } from "./settings/provider-edit-form";
import { ProviderList } from "./settings/provider-list";

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
    <>
      {/* Backdrop */}
      {settingsPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setSettingsPanelOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full border-l border-border bg-background transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-96 ${
          settingsPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <button
              onClick={() => setSettingsPanelOpen(false)}
              className="rounded-card p-1 text-foreground-secondary hover:bg-background-hover"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Provider list */}
          <label className="mb-2 text-xs font-medium text-foreground-secondary">
            Providers
          </label>
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
            <button
              onClick={() => {
                setShowAdd(true);
                setEditingId(null);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-border p-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Provider
            </button>
          )}

          {/* Spacer */}
          <div className="mt-4" />

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
        </div>
      </div>
    </>
  );
}
