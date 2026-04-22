import { createFileRoute } from "@tanstack/react-router";

import MasterTaxPage from "@/components/dashboard/master-tax-page";

export const Route = createFileRoute("/master/tax")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MasterTaxPage />;
}
