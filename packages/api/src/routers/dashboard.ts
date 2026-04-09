import { protectedProcedure, router } from "../index";
import { z } from "zod";

const kpiKeySchema = z.enum(["customers", "revenue", "uptime", "tickets"]);
const infrastructureStatusSchema = z.enum(["Healthy", "High Latency", "Degraded", "Down"]);
const customerStatusSchema = z.enum(["Active", "Pending Setup", "Suspended"]);
const ticketSeveritySchema = z.enum(["Critical", "High", "Normal"]);
const ticketStatusSchema = z.enum(["Open", "In Progress", "Pending", "Resolved"]);

export const dashboardSummarySchema = z.object({
  kpis: z.array(
    z.object({
      key: kpiKeySchema,
      label: z.string(),
      value: z.string(),
      trend: z.string(),
    }),
  ),
  trafficOverview: z.object({
    updatedAt: z.string(),
    currentIngress: z.string(),
    currentEgress: z.string(),
    timeLabels: z.array(z.string()),
    ingressSeries: z.array(z.number()),
    egressSeries: z.array(z.number()),
  }),
  infrastructure: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      detail: z.string(),
      health: z.string(),
      status: infrastructureStatusSchema,
    }),
  ),
  recentCustomers: z.array(
    z.object({
      id: z.string(),
      customer: z.string(),
      packageName: z.string(),
      status: customerStatusSchema,
      fee: z.string(),
    }),
  ),
  recentTickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: ticketSeveritySchema,
      status: ticketStatusSchema,
    }),
  ),
});

type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

const dashboardSummary: DashboardSummary = {
  kpis: [
    { key: "customers", label: "Total Customers", value: "14,285", trend: "+12.5%" },
    { key: "revenue", label: "Monthly Revenue", value: "$842.5k", trend: "+8.2%" },
    { key: "uptime", label: "Network Uptime", value: "99.99%", trend: "Stable" },
    { key: "tickets", label: "Active Tickets", value: "142", trend: "-5.4%" },
  ],
  trafficOverview: {
    updatedAt: "May 15, 14:00",
    currentIngress: "4.2G",
    currentEgress: "2.1G",
    timeLabels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
    ingressSeries: [2.1, 2.8, 3.2, 3.6, 4.2, 3.9, 3.3],
    egressSeries: [1.0, 1.4, 1.8, 2.0, 2.1, 1.9, 1.6],
  },
  infrastructure: [
    { id: "node-1", name: "Core Router Alpha", detail: "10.0.0.1 - NYC-DC1", health: "99.99%", status: "Healthy" },
    { id: "node-2", name: "Dist. Switch Beta", detail: "10.0.1.5 - LAX-DC2", health: "99.98%", status: "Healthy" },
    {
      id: "node-3",
      name: "Auth Radius Server",
      detail: "10.0.2.7 - DAL-DC3",
      health: "98.45%",
      status: "High Latency",
    },
  ],
  recentCustomers: [
    {
      id: "#CUS-8921",
      customer: "John Doe",
      packageName: "Fiber Gigabit",
      status: "Active",
      fee: "$89.99",
    },
    {
      id: "#CUS-8922",
      customer: "TechCorp Inc.",
      packageName: "Business Dedicated (10G)",
      status: "Pending Setup",
      fee: "$999.00",
    },
    {
      id: "#CUS-8919",
      customer: "Sarah Adams",
      packageName: "Standard 500M",
      status: "Suspended",
      fee: "$49.99",
    },
  ],
  recentTickets: [
    {
      id: "#TKT-1042",
      title: "Complete Connection Loss",
      severity: "Critical",
      status: "Open",
    },
    {
      id: "#TKT-1041",
      title: "Slow speeds during peak hours",
      severity: "High",
      status: "In Progress",
    },
    {
      id: "#TKT-1039",
      title: "Billing discrepancy on invoice",
      severity: "Normal",
      status: "Pending",
    },
  ],
};

export const dashboardRouter = router({
  summary: protectedProcedure.output(dashboardSummarySchema).query(() => {
    return dashboardSummary;
  }),
});
