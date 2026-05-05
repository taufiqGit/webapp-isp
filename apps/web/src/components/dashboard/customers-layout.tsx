import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";
import CustomersSubscriptionPage from "./customers-subscription-page";

export default function CustomersLayout({
  userName,
  preselectCustomerId,
}: {
  userName?: string;
  preselectCustomerId?: string;
}) {
  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      topbar={<DashboardTopbar userName={userName} title="Customers" subtitle="Customer registry & subscriptions" />}
    >
      <CustomersSubscriptionPage preselectCustomerId={preselectCustomerId} />
    </DashboardShell>
  );
}
