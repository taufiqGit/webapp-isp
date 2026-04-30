import { createFileRoute } from "@tanstack/react-router";

import MasterBillingCyclePage from "@/components/dashboard/master-billing-cycle-page";

export const Route = createFileRoute("/master/billing-cycle")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MasterBillingCyclePage />;
}
