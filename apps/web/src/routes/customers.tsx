import { createFileRoute, redirect } from "@tanstack/react-router";

import CustomersLayout from "@/components/dashboard/customers-layout";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/customers")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    if (location.pathname === "/customers") {
      redirect({
        to: "/customers/customer",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  return <CustomersLayout userName={session.data?.user.name} />;
}
