import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FamilyMember } from "@/types";

export interface FamilyMemberRowProps {
  member: FamilyMember;
  onRemove: (member: FamilyMember) => void;
  removing?: boolean;
}

export function FamilyMemberRow({ member, onRemove, removing }: FamilyMemberRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light font-display text-xs font-bold text-primary">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-text-main">
            {member.name}
            {member.is_owner && <Crown className="h-3.5 w-3.5 text-amber-500" />}
          </p>
          {member.email && <p className="text-xs text-text-muted">{member.email}</p>}
        </div>
      </div>
      {!member.is_owner && (
        <Button variant="ghost" size="icon" onClick={() => onRemove(member)} loading={removing} aria-label="Retirer">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
