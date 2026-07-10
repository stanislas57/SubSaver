import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoWithFallbackProps {
  domain: string;
  name: string;
  className?: string;
}

/** Logo via Clearbit, avec repli sur l'initiale du nom si l'image échoue. */
export function LogoWithFallback({ domain, name, className }: LogoWithFallbackProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !domain) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-light font-display text-sm font-bold text-primary",
          className
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}?size=80`}
      alt={name}
      width={40}
      height={40}
      className={cn("h-10 w-10 shrink-0 rounded-md border border-border object-contain bg-white p-1", className)}
      onError={() => setFailed(true)}
    />
  );
}
