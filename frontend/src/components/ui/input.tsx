import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text-main placeholder:text-text-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-red-400" : "border-border",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
