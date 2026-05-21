import { Button } from "@super-image/ui";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function getErrorType(message: string): "auth" | "content" | "quota" | "generic" {
  const lower = message.toLowerCase();
  if (lower.includes("401") || lower.includes("invalid api key") || lower.includes("unauthorized")) {
    return "auth";
  }
  if (lower.includes("content_policy") || lower.includes("safety") || lower.includes("moderation")) {
    return "content";
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("billing")) {
    return "quota";
  }
  return "generic";
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const errorType = getErrorType(message);

  return (
    <div className="flex items-start gap-3 rounded-card border-l-2 border-red-500 bg-red-50 px-3 py-2.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-red-500">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-red-800">{message}</p>
        <div className="mt-2 flex gap-2">
          {errorType === "auth" && (
            <Button variant="ghost" size="sm" className="text-xs text-red-700">
              Go to Settings
            </Button>
          )}
          {errorType === "content" && (
            <Button variant="ghost" size="sm" className="text-xs text-red-700">
              Modify prompt
            </Button>
          )}
          {errorType === "quota" && (
            <Button variant="ghost" size="sm" className="text-xs text-red-700">
              Check billing
            </Button>
          )}
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="text-xs text-red-700">
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
