import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfile";
import { LANGUAGE_LABELS, type Language } from "@/types";

export function LanguageSwitcher() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  if (!user) return null;

  return (
    <Select
      value={user.language}
      disabled={updateProfile.isPending}
      onChange={(e) => updateProfile.mutate({ language: e.target.value as Language })}
      className="h-9 w-auto pr-8 text-xs"
      aria-label="Langue"
    >
      {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_LABELS[lang]}
        </option>
      ))}
    </Select>
  );
}
