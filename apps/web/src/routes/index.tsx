import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import DashboardPage from "@/components/dashboard/dashboard-page";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
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
  const summaryQuery = useQuery(trpc.dashboard.summary.queryOptions());

  return (
    <DashboardPage
      userName={session.data?.user.name}
      summary={summaryQuery.data}
      isLoading={summaryQuery.isLoading}
      errorMessage={summaryQuery.isError ? summaryQuery.error.message : undefined}
    />
  );
}
