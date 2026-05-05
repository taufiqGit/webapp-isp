import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import CustomersLayout from "@/components/dashboard/customers-layout";
import { authClient } from "@/lib/auth-client";

const searchSchema = z.object({
  customerId: z.string().optional(),
});

export const Route = createFileRoute("/customers")({
  component: RouteComponent,
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  return <CustomersLayout userName={session.data?.user.name} preselectCustomerId={search.customerId} />;
}
