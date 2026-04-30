import { createFileRoute } from "@tanstack/react-router";

import MasterSupportTicketCategoryPage from "@/components/dashboard/master-support-ticket-category-page";

export const Route = createFileRoute("/master/support-ticket-category")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MasterSupportTicketCategoryPage />;
}
