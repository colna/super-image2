import { Button } from "@super-image/ui";

interface ImageSkeletonProps {
  size: string;
  onCancel?: () => void;
}

function getAspectRatio(size: string): string {
  if (size === "1024x1536" || size === "auto") return "aspect-[2/3]";
  if (size === "1536x1024") return "aspect-[3/2]";
  return "aspect-square";
}

export function ImageSkeleton({ size, onCancel }: ImageSkeletonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-full max-w-[300px] rounded-card bg-border/50 ${getAspectRatio(size)} animate-pulse`}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground-secondary">Generating...</span>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
