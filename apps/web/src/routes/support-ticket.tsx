import { createFileRoute, redirect } from "@tanstack/react-router";

import SupportTicketPage from "@/components/dashboard/support-ticket-page";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/support-ticket")({
  component: RouteComponent,
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
  return <SupportTicketPage userName={session.data?.user.name} />;
}
