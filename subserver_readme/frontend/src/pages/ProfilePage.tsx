import { Landmark, Crown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuth } from "@/contexts/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-main">Banque</span>
          </div>
          <Badge variant={user.bank_connected ? "success" : "neutral"}>
            {user.bank_connected ? "Connectée" : "Non connectée"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-main">Statut</span>
          </div>
          <Badge variant={user.is_premium ? "success" : "neutral"}>{user.is_premium ? "Premium" : "Gratuit"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Ces informations sont utilisées pour personnaliser ton expérience.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
