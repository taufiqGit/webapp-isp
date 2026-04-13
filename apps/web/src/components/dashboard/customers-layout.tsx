import { Button } from "@isp-app/ui/components/button";
import { cn } from "@isp-app/ui/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";

export default function CustomersLayout({ userName }: { userName?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeTab = pathname.startsWith("/customers/subscription") ? "subscription" : "customer";

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      topbar={<DashboardTopbar userName={userName} title="Customers" subtitle="Customer registry & subscriptions" />}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/customers/customer">
            <Button
              variant={activeTab === "customer" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "customer" && "border-border bg-background")}
            >
              Customer
            </Button>
          </Link>
          <Link to="/customers/subscription">
            <Button
              variant={activeTab === "subscription" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "subscription" && "border-border bg-background")}
            >
              Subscription
            </Button>
          </Link>
        </div>
        <Outlet />
      </div>
    </DashboardShell>
  );
}
