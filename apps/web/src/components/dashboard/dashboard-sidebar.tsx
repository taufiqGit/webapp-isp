import { cn } from "@isp-app/ui/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import {
  Activity,
  CircleDollarSign,
  Moon,
  LogOut,
  LayoutDashboard,
  Network,
  Package,
  Sun,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

interface NavItem {
  label: string;
  to: "/dashboard";
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", to: "/dashboard", icon: Users },
  { label: "Network Status", to: "/dashboard", icon: Network },
  { label: "Billing & Invoices", to: "/dashboard", icon: CircleDollarSign },
  { label: "Support Tickets", to: "/dashboard", icon: Ticket, badge: "12" },
  { label: "Service Packages", to: "/dashboard", icon: Package },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const currentTheme = resolvedTheme ?? "dark";
  const isDark = currentTheme === "dark";

  return (
    <div className="flex h-full flex-col justify-between px-2 py-3">
      <div className="space-y-6">
        <div className="border-b border-border px-3 pb-6 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-content-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Activity className="size-5 text-primary" />
            </div>
            <p className="text-xl leading-none font-bold tracking-tight text-foreground dark:text-white">NetPulse</p>
          </div>
        </div>

        <div className="px-1">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground/70">MAIN MENU</p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === 0;
            return (
              <Link key={item.label} to={item.to} className="block">
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-150",
                    isActive ? "bg-muted/60 text-foreground" : "hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0" />
                    <span className="text-base leading-none font-medium">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs leading-none font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <Link to="/dashboard" className="block">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground dark:hover:bg-white/[0.03]">
            <Settings className="size-4 shrink-0" />
            <span className="text-base leading-none font-medium">Settings</span>
          </div>
        </Link>

        <div className="rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            className={cn(
              "inline-flex w-1/2 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs leading-none font-medium transition-colors",
              !isDark ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTheme("light")}
          >
            <Sun className="size-4" />
            Light
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex w-1/2 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs leading-none font-medium transition-colors",
              isDark ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTheme("dark")}
          >
            <Moon className="size-4" />
            Dark
          </button>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({
                    to: "/",
                  });
                },
              },
            });
          }}
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
