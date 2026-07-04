import { Outlet } from "react-router-dom";
import { Wallet } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold text-text-main">SubServer</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6 shadow-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
