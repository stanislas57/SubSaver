import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-primary to-primary-hover text-white shadow-md hover:-translate-y-px hover:shadow-lg",
        outline: "border-2 border-border text-text-main bg-surface hover:border-primary hover:text-primary",
        ghost: "text-text-muted hover:bg-surface-hover hover:text-text-main",
        danger: "bg-red-50 text-red-600 border border-transparent hover:bg-red-100 hover:border-red-300",
        premium:
          "bg-gradient-to-br from-accent to-emerald-600 text-white shadow-md hover:-translate-y-px hover:shadow-lg",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
