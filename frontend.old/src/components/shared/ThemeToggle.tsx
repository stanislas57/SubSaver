import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfile";

/** Bascule le thème et persiste la préférence via PATCH /users/me (pas de mock local). */
export function ThemeToggle() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const isDark = user?.theme === "dark";

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggle() {
    updateProfile.mutate({ theme: isDark ? "light" : "dark" });
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} disabled={updateProfile.isPending} aria-label="Changer de thème">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
