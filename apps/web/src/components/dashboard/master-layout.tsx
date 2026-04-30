import { Button } from "@isp-app/ui/components/button";
import { cn } from "@isp-app/ui/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";

export default function MasterLayout({ userName }: { userName?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeTab = pathname.startsWith("/master/plan")
    ? "plan"
    : pathname.startsWith("/master/billing-cycle")
      ? "billing-cycle"
      : pathname.startsWith("/master/payment-method")
        ? "payment-method"
    : pathname.startsWith("/master/support-ticket-category")
      ? "support-ticket-category"
      : "tax";

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
          <Link to="/master/billing-cycle">
            <Button
              variant={activeTab === "billing-cycle" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "billing-cycle" && "border-border bg-background")}
            >
              Billing Cycle
            </Button>
          </Link>
          <Link to="/master/payment-method">
            <Button
              variant={activeTab === "payment-method" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "payment-method" && "border-border bg-background")}
            >
              Payment Method
            </Button>
          </Link>
          <Link to="/master/support-ticket-category">
            <Button
              variant={activeTab === "support-ticket-category" ? "secondary" : "outline"}
              size="sm"
              className={cn("rounded-lg", activeTab !== "support-ticket-category" && "border-border bg-background")}
            >
              Ticket Category
            </Button>
          </Link>
        </div>
        <Outlet />
      </div>
    </DashboardShell>
  );
}
