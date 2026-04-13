import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import CustomersSubscriptionPage from "@/components/dashboard/customers-subscription-page";

const searchSchema = z.object({
  customerId: z.string().optional(),
});

export const Route = createFileRoute("/customers/subscription")({
  component: RouteComponent,
  validateSearch: (search) => searchSchema.parse(search),
});

function RouteComponent() {
  const search = Route.useSearch();
  return <CustomersSubscriptionPage preselectCustomerId={search.customerId} />;
}
