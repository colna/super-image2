"use client";

import type { ProviderConfig } from "@super-image/utils";

import { ProviderCard } from "./provider-card";

interface ProviderListProps {
  providers: ProviderConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProviderList({
  providers,
  activeId,
  onSelect,
  onEdit,
  onDelete,
}: ProviderListProps) {
  if (providers.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-4 text-center text-sm text-foreground-secondary">
        No providers configured
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <ProviderCard
          key={p.id}
          config={p}
          isActive={p.id === activeId}
          onSelect={() => onSelect(p.id)}
          onEdit={() => onEdit(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}
