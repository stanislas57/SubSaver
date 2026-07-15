import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { CATEGORIES, IMPORTANCE_LABELS, type Subscription, type SubscriptionInput } from "@/types";
import { guessDomain } from "@/lib/bank";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(80),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  category: z.enum(CATEGORIES),
  billing_day: z.coerce
    .number({ invalid_type_error: "Entre 1 et 31" })
    .int("Entre 1 et 31")
    .min(1, "Entre 1 et 31")
    .max(31, "Entre 1 et 31"),
  importance: z.coerce.number().int().min(1).max(3) as unknown as z.ZodType<1 | 2 | 3>,
  start_date: z.string().optional().or(z.literal("")),
  trial_end_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export interface SubscriptionFormProps {
  defaultValues?: Subscription;
  onSubmit: (input: SubscriptionInput) => void;
  onCancel: () => void;
  submitting: boolean;
  errorMessage?: string | null;
}

export function SubscriptionForm({ defaultValues, onSubmit, onCancel, submitting, errorMessage }: SubscriptionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          price: defaultValues.price,
          category: defaultValues.category as FormValues["category"],
          billing_day: defaultValues.billing_day,
          importance: defaultValues.importance,
          start_date: defaultValues.start_date ?? "",
          trial_end_date: defaultValues.trial_end_date ?? "",
        }
      : { category: CATEGORIES[0], importance: 2, billing_day: 1 },
  });

  /** Le domaine (utilisé uniquement pour aller chercher le logo, cf.
   * LogoWithFallback) n'est plus un champ du formulaire -- demander à
   * l'utilisateur de le taper pour un simple visuel n'apportait rien.
   * À la création, on le devine depuis le nom (même heuristique que pour
   * les abonnements détectés automatiquement via la banque, cf.
   * subscriptionReconciliation.ts) ; à l'édition, on garde le domaine déjà
   * stocké tel quel plutôt que de le re-deviner à chaque enregistrement,
   * ce qui écraserait silencieusement une valeur déjà correcte si le nom
   * n'a pas changé. */
  function submit(values: FormValues) {
    onSubmit({
      name: values.name,
      price: values.price,
      category: values.category,
      domain: defaultValues?.domain ?? guessDomain(values.name),
      billing_day: values.billing_day,
      importance: values.importance,
      start_date: values.start_date || null,
      trial_end_date: values.trial_end_date || null,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {errorMessage && <ErrorAlert message={errorMessage} compact />}

      <div>
        <Label htmlFor="name">Nom du service</Label>
        <Input id="name" placeholder="Netflix" error={!!errors.name} {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Prix mensuel (€)</Label>
          <Input id="price" type="number" step="0.01" min="0" error={!!errors.price} {...register("price")} />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="billing_day">Jour de prélèvement</Label>
          <Input id="billing_day" type="number" min="1" max="31" error={!!errors.billing_day} {...register("billing_day")} />
          {errors.billing_day && <p className="mt-1 text-xs text-red-600">{errors.billing_day.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select id="category" error={!!errors.category} {...register("category")}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="importance">Importance</Label>
          <Select id="importance" error={!!errors.importance} {...register("importance")}>
            {Object.entries(IMPORTANCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start_date">Date de début (optionnel)</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
        </div>
        <div>
          <Label htmlFor="trial_end_date">Fin d'essai (optionnel)</Label>
          <Input id="trial_end_date" type="date" {...register("trial_end_date")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          {defaultValues ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
