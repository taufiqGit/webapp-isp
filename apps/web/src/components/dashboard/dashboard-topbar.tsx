import { Button } from "@isp-app/ui/components/button";
import { Card, CardContent } from "@isp-app/ui/components/card";
import { CheckCircle2 } from "lucide-react";

interface DashboardTopbarProps {
  userName?: string;
}

export default function DashboardTopbar({ userName }: DashboardTopbarProps) {
  return (
    <Card className="rounded-xl border-border bg-background py-0">
      <CardContent className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold tracking-wide">Overview</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500" />
            <span>System Operational</span>
            <span className="hidden md:inline">|</span>
            <span>{userName ? `Logged in as ${userName}` : "Admin User"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" className="rounded-lg">
            General View
          </Button>
          <Button variant="ghost" size="sm" className="rounded-lg">
            Financials
          </Button>
          <Button variant="ghost" size="sm" className="rounded-lg">
            Infrastructure
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg border-border bg-background">
            Last 30 Days
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
