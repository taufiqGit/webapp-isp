import type { AppRouter } from "@isp-app/api/routers/index";
import { Card, CardContent, CardHeader, CardTitle } from "@isp-app/ui/components/card";
import { Skeleton } from "@isp-app/ui/components/skeleton";
import { cn } from "@isp-app/ui/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Gauge,
  Router,
  Ticket,
  Users,
  Wifi,
} from "lucide-react";

import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";
import { getTrendToneClass, mapDashboardSummary } from "./dashboard-view-model";

type DashboardSummary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

interface DashboardPageProps {
  userName?: string;
  summary?: DashboardSummary;
  isLoading?: boolean;
  errorMessage?: string;
}

const kpiIconMap = {
  customers: Users,
  revenue: CreditCard,
  uptime: Wifi,
  tickets: Ticket,
} as const;

export default function DashboardPage({ userName, summary, isLoading, errorMessage }: DashboardPageProps) {
  const viewModel = mapDashboardSummary(summary);
  const { kpis, infrastructure, recentCustomers, recentTickets, trafficOverview } = viewModel;

  return (
    <DashboardShell sidebar={<DashboardSidebar />} topbar={<DashboardTopbar userName={userName} />}>
      <div className="grid h-full min-h-0 gap-3 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        {errorMessage ? (
          <Card className="bg-destructive/10 py-3">
            <CardContent className="text-xs text-destructive">
              Gagal mengambil data dashboard: {errorMessage}
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(isLoading ? new Array(4).fill(null) : kpis).map((kpi, index) => {
            const Icon = kpi ? kpiIconMap[kpi.key as keyof typeof kpiIconMap] : null;
            return (
              <Card key={kpi?.label ?? `kpi-skeleton-${index}`} className="bg-background">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    {isLoading ? <Skeleton className="h-3 w-24" /> : <span>{kpi?.label}</span>}
                    {isLoading || !Icon ? <Skeleton className="size-4" /> : <Icon className="size-4 text-primary" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-semibold">{kpi?.value}</p>
                      <span className={cn("text-xs font-medium", getTrendToneClass(kpi?.trend ?? ""))}>{kpi?.trend}</span>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid min-h-0 gap-3 xl:grid-cols-[1.5fr_1fr]">
          <Card className="h-full bg-background">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm">Bandwidth &amp; Traffic Overview</CardTitle>
              <p className="text-xs text-muted-foreground">Total aggregate traffic across core nodes</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ArrowDownLeft className="size-4 text-cyan-400" />
                  Ingress
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ArrowUpRight className="size-4 text-indigo-400" />
                  Egress
                </span>
              </div>
              <div className="grid h-48 place-content-center border border-dashed text-xs text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-xs">Traffic chart placeholder</p>
                    <p className="text-center text-[10px] text-muted-foreground">
                      {trafficOverview?.timeLabels.join(" • ")}
                    </p>
                  </div>
                )}
              </div>
              {isLoading ? (
                <Skeleton className="h-3 w-56" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  In: {trafficOverview?.currentIngress} / Out: {trafficOverview?.currentEgress} at{" "}
                  {trafficOverview?.updatedAt}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="h-full bg-background">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm">Core Infrastructure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {(isLoading ? new Array(3).fill(null) : infrastructure).map((item, index) => (
                <div key={item?.id ?? `infra-skeleton-${index}`} className="border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    {isLoading ? <Skeleton className="h-3 w-32" /> : <p className="text-xs font-medium">{item?.name}</p>}
                    <Router className="size-4 text-primary" />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-3 w-40" />
                  ) : (
                    <p className="text-xs text-muted-foreground">{item?.detail}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </>
                    ) : (
                      <>
                        <span className={cn(item?.toneClass)}>{item?.status}</span>
                        <span className="text-muted-foreground">{item?.health}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid min-h-0 gap-3 xl:grid-cols-[1.5fr_1fr]">
          <Card className="h-full bg-background">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm">Recent Customer Activity</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto pt-2">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 font-medium">Customer</th>
                    <th className="py-2 font-medium">Package</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? new Array(3).fill(null) : recentCustomers).map((row, index) => (
                    <tr key={row?.id ?? `customer-skeleton-${index}`} className="border-b last:border-0">
                      <td className="py-3">
                        {isLoading ? (
                          <>
                            <Skeleton className="mb-1 h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{row?.customer}</p>
                            <p className="text-muted-foreground">{row?.id}</p>
                          </>
                        )}
                      </td>
                      <td className="py-3">{isLoading ? <Skeleton className="h-3 w-24" /> : row?.packageName}</td>
                      <td className="py-3">
                        {isLoading ? <Skeleton className="h-3 w-16" /> : <span className={cn(row?.toneClass)}>{row?.status}</span>}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {isLoading ? <Skeleton className="ml-auto h-3 w-12" /> : row?.fee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="h-full bg-background">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm">Recent Support Tickets</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 space-y-3 overflow-auto pt-2">
              {(isLoading ? new Array(3).fill(null) : recentTickets).map((ticket, index) => {
                const Icon =
                  ticket?.severity === "Critical" ? AlertTriangle : ticket?.severity === "High" ? Gauge : CreditCard;
                return (
                  <div key={ticket?.id ?? `ticket-skeleton-${index}`} className="border p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 size-4 text-primary" />
                        <div>
                          {isLoading ? (
                            <>
                              <Skeleton className="mb-1 h-3 w-32" />
                              <Skeleton className="h-3 w-14" />
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-medium">{ticket?.title}</p>
                              <p className="text-xs text-muted-foreground">{ticket?.id}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {isLoading ? (
                        <Skeleton className="h-4 w-12" />
                      ) : (
                        <span
                          className={cn("px-2 py-0.5 text-[10px] font-semibold", ticket?.toneClass)}
                        >
                          {ticket?.severity}
                        </span>
                      )}
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      <p className="text-xs text-muted-foreground">{ticket?.status}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
