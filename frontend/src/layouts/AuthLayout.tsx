import { Outlet } from "react-router-dom";
import { Wallet } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_24px_-4px_rgba(59,130,246,0.6)]">
            <Wallet className="h-5 w-5 text-slate-50" />
          </div>
          <span className="font-display text-xl font-bold text-slate-50">SubServer</span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-canvas-soft/70 p-6 shadow-2xl backdrop-blur-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
