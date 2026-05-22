"use client";

import type { ProviderConfig } from "@super-image/utils";

import { PROVIDER_TYPES } from "@/lib/providers/provider-types";

interface ProviderCardProps {
  config: ProviderConfig;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_DOT: Record<string, string> = {
  connected: "bg-green-500",
  error: "bg-red-500",
  unknown: "bg-neutral-300",
};

export function ProviderCard({
  config,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ProviderCardProps) {
  const meta = PROVIDER_TYPES.find((t) => t.type === config.providerType);

  return (
    <div
      className={`group flex items-center gap-3 rounded-card border p-3 transition-colors ${
        isActive
          ? "border-foreground bg-background-hover"
          : "border-border bg-background-card hover:bg-background-hover"
      }`}
    >
      {/* Radio */}
      <button
        onClick={onSelect}
        className="shrink-0"
        aria-label={`Select ${config.displayName}`}
      >
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
            isActive ? "border-foreground" : "border-foreground-secondary"
          }`}
        >
          {isActive && <div className="h-2 w-2 rounded-full bg-foreground" />}
        </div>
      </button>

      {/* Status dot */}
      <div
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[config.connectionStatus] ?? STATUS_DOT.unknown}`}
        title={config.connectionStatus}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {config.displayName}
        </div>
        <div className="truncate text-xs text-foreground-secondary">
          {meta?.icon} {meta?.label ?? config.providerType}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-card p-1 text-foreground-secondary hover:bg-background-hover hover:text-foreground"
          aria-label="Edit"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded-card p-1 text-foreground-secondary hover:bg-red-50 hover:text-red-600"
          aria-label="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 4h9M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3.5 4l.5 8h6l.5-8"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
