import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-luxury-bg px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/15 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-purple-200/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <img src="/logo.png" alt="SubServer" className="h-10 w-auto" />
          <span className="font-display text-xl font-bold text-luxury-sapphire">SubServer</span>
        </div>
        <div className="rounded-3xl border border-luxury-text/10 bg-white/80 p-6 shadow-luxury-lg backdrop-blur-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
