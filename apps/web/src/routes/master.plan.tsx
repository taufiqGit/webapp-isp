import { createFileRoute } from "@tanstack/react-router";

import MasterPlanPage from "@/components/dashboard/master-plan-page";

export const Route = createFileRoute("/master/plan")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MasterPlanPage />;
}
