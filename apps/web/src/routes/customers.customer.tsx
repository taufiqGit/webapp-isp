import { createFileRoute } from "@tanstack/react-router";

import CustomersCustomerPage from "@/components/dashboard/customers-customer-page";

export const Route = createFileRoute("/customers/customer")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomersCustomerPage />;
}
