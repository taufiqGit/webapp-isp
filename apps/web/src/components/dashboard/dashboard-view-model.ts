import type { AppRouter } from "@isp-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type DashboardSummary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];
type InfrastructureItem = DashboardSummary["infrastructure"][number];
type CustomerItem = DashboardSummary["recentCustomers"][number];
type TicketItem = DashboardSummary["recentTickets"][number];

export interface DashboardViewModel {
  kpis: DashboardSummary["kpis"];
  trafficOverview?: DashboardSummary["trafficOverview"];
  infrastructure: Array<InfrastructureItem & { toneClass: string }>;
  recentCustomers: Array<CustomerItem & { toneClass: string }>;
  recentTickets: Array<TicketItem & { toneClass: string }>;
}

const infrastructureToneMap: Record<InfrastructureItem["status"], string> = {
  Healthy: "text-emerald-400",
  "High Latency": "text-amber-400",
  Degraded: "text-amber-400",
  Down: "text-rose-400",
};

const customerStatusToneMap: Record<CustomerItem["status"], string> = {
  Active: "text-emerald-400",
  "Pending Setup": "text-amber-400",
  Suspended: "text-rose-400",
};

const ticketSeverityToneMap: Record<TicketItem["severity"], string> = {
  Critical: "bg-rose-500/20 text-rose-400",
  High: "bg-amber-500/20 text-amber-400",
  Normal: "bg-blue-500/20 text-blue-400",
};

export function getTrendToneClass(trend: string): string {
  if (trend.startsWith("-")) return "text-rose-400";
  if (trend.startsWith("+")) return "text-emerald-400";
  return "text-muted-foreground";
}

export function mapDashboardSummary(summary?: DashboardSummary): DashboardViewModel {
  return {
    kpis: summary?.kpis ?? [],
    trafficOverview: summary?.trafficOverview,
    infrastructure: (summary?.infrastructure ?? []).map((item) => ({
      ...item,
      toneClass: infrastructureToneMap[item.status],
    })),
    recentCustomers: (summary?.recentCustomers ?? []).map((item) => ({
      ...item,
      toneClass: customerStatusToneMap[item.status],
    })),
    recentTickets: (summary?.recentTickets ?? []).map((item) => ({
      ...item,
      toneClass: ticketSeverityToneMap[item.severity],
    })),
  };
}
