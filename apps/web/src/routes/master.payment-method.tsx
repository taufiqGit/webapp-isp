import { createFileRoute } from "@tanstack/react-router";

import MasterPaymentMethodPage from "@/components/dashboard/master-payment-method-page";

export const Route = createFileRoute("/master/payment-method")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MasterPaymentMethodPage />;
}
