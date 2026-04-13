import { Card, CardContent } from "@isp-app/ui/components/card";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardTopbarProps {
  userName?: string;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export default function DashboardTopbar({ userName, title = "Overview", subtitle, actions }: DashboardTopbarProps) {
  return (
    <Card className="rounded-xl border-border bg-background py-0">
      <CardContent className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold tracking-wide">{title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500" />
            <span>System Operational</span>
            <span className="hidden md:inline">|</span>
            <span>{subtitle ?? (userName ? `Logged in as ${userName}` : "Admin User")}</span>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
