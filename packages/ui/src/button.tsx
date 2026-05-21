import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@super-image/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
          variant === "primary" &&
            "bg-foreground text-white hover:bg-foreground/90 disabled:opacity-50",
          variant === "secondary" &&
            "border border-border bg-background-card text-foreground hover:bg-background-hover disabled:opacity-50",
          variant === "ghost" &&
            "text-foreground hover:bg-background-hover disabled:opacity-50",
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-9 px-4 text-sm",
          size === "lg" && "h-10 px-6 text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
