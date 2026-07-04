import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface FeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureBox({ icon, title, description }: FeatureBoxProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-accent">
          {icon}
        </div>
        <h4 className="font-display text-sm font-bold text-text-main">{title}</h4>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </CardContent>
    </Card>
  );
}
