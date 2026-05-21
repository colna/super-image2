import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@super-image/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-card border border-border bg-background-card px-3 text-sm text-foreground placeholder:text-foreground-placeholder transition-colors duration-150 focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
