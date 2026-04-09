import type { ReactNode } from "react";

interface DashboardShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export default function DashboardShell({ sidebar, topbar, children }: DashboardShellProps) {
  return (
    <div className="h-svh w-full bg-background dark:bg-[#0b0f19]">
      <div className="h-full w-full px-3 py-3 md:px-5">
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="h-full min-h-0">{sidebar}</aside>
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
            {topbar}
            <main className="min-h-0">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
