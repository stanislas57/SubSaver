import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { useCreateSubscription } from "@/hooks/useSubscriptions";
import { getErrorMessage } from "@/api/axiosClient";

export function SubscriptionAddPage() {
  const navigate = useNavigate();
  const createSubscription = useCreateSubscription();

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un abonnement</CardTitle>
            <CardDescription>Renseigne les informations de ton nouvel abonnement.</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionForm
              onSubmit={(input) =>
                createSubscription.mutate(input, { onSuccess: () => navigate("/subscriptions") })
              }
              onCancel={() => navigate("/subscriptions")}
              submitting={createSubscription.isPending}
              errorMessage={createSubscription.isError ? getErrorMessage(createSubscription.error) : null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
