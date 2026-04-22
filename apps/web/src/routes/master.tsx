import { createFileRoute, redirect } from "@tanstack/react-router";

import MasterLayout from "@/components/dashboard/master-layout";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/master")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    if (location.pathname === "/master") {
      redirect({
        to: "/master/tax",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  return <MasterLayout userName={session.data?.user.name} />;
}
