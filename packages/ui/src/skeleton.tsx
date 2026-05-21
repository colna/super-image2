import { cn } from "@super-image/utils";

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-border animate-pulse-skeleton",
        className,
      )}
      style={{ width, height }}
    />
  );
}
