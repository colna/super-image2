"use client";

import { Button, Input } from "@super-image/ui";
import { useState } from "react";

import { PROVIDER_TYPES } from "@/lib/providers/provider-types";
import { useSettingsStore } from "@/stores/settings-store";

interface AddProviderFormProps {
  onClose: () => void;
  onAdded: (id: string) => void;
}

export function AddProviderForm({ onClose, onAdded }: AddProviderFormProps) {
  const [selectedType, setSelectedType] = useState(PROVIDER_TYPES[0].type);
  const [name, setName] = useState("");
  const { addProvider } = useSettingsStore();

  const meta = PROVIDER_TYPES.find((t) => t.type === selectedType);

  const handleAdd = () => {
    const displayName = name.trim() || meta?.label || selectedType;
    const id = addProvider(selectedType, displayName);
    onAdded(id);
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-background-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Provider</h3>
        <button
          onClick={onClose}
          className="rounded-card p-1 text-foreground-secondary hover:bg-background-hover"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Provider type */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
          Type
        </label>
        <div className="flex flex-col gap-1.5">
          {PROVIDER_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={`flex items-center gap-2 rounded-card border p-2.5 text-left text-sm transition-colors ${
                selectedType === t.type
                  ? "border-foreground bg-background-hover"
                  : "border-border hover:bg-background-hover"
              }`}
            >
              <span>{t.icon}</span>
              <span className="font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
          Display Name
        </label>
        <Input
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder={meta?.label ?? "My Provider"}
        />
      </div>

      <Button onClick={handleAdd} className="w-full">
        Add Provider
      </Button>
    </div>
  );
}
