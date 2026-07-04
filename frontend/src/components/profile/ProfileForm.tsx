import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/useProfile";
import type { User } from "@/types";

const schema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(50),
  currency: z.enum(["EUR", "USD", "GBP", "SEK"]),
  notification_pref: z.enum(["all", "trials", "none"]),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user.first_name,
      currency: user.currency,
      notification_pref: user.notification_pref,
    },
  });

  function onSubmit(values: FormValues) {
    updateProfile.mutate(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="first_name">Prénom</Label>
        <Input id="first_name" error={!!errors.first_name} {...register("first_name")} />
        {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
      </div>

      <div>
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="currency">Devise</Label>
          <Select id="currency" {...register("currency")}>
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollar US ($)</option>
            <option value="GBP">Livre (£)</option>
            <option value="SEK">Couronne suédoise (kr)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="notification_pref">Notifications</Label>
          <Select id="notification_pref" {...register("notification_pref")}>
            <option value="all">Toutes</option>
            <option value="trials">Essais uniquement</option>
            <option value="none">Aucune</option>
          </Select>
        </div>
      </div>

      <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>
        Enregistrer les modifications
      </Button>
    </form>
  );
}
