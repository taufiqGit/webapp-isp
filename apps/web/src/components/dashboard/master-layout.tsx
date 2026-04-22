import { Button } from "@isp-app/ui/components/button";
import { cn } from "@isp-app/ui/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";

export default function MasterLayout({ userName }: { userName?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeTab = pathname.startsWith("/master/plan") ? "plan" : "tax";

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      topbar={<DashboardTopbar userName={userName} title="Master" subtitle="Master data management" />}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/master/tax">
            <Button
              variant={activeTab === "tax" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "tax" && "border-border bg-background")}
            >
              Tax
            </Button>
          </Link>
          <Link to="/master/plan">
            <Button
              variant={activeTab === "plan" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "plan" && "border-border bg-background")}
            >
              Plan
            </Button>
          </Link>
        </div>
        <Outlet />
      </div>
    </DashboardShell>
  );
}
