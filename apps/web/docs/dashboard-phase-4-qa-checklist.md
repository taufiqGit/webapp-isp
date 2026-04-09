# Dashboard Phase 4 QA Checklist

## Scope
- Route: `/dashboard`
- Focus: data contract hardening, loading/error resilience, visual status rendering

## Functional Checks
- Login guard redirects unauthenticated users to `/login`.
- Authenticated users can open `/dashboard` without console/runtime errors.
- KPI, traffic, infrastructure, customers, and tickets sections all render from `trpc.dashboard.summary`.
- Refreshing the page keeps rendering stable without hydration/UI flicker issues.

## State Checks
- Loading state shows skeleton placeholders for every major dashboard block.
- Error state shows an error banner when query fails.
- Empty-safe behavior:
  - No crashes if `kpis`, `infrastructure`, `recentCustomers`, or `recentTickets` are empty arrays.
  - Traffic section remains stable if traffic arrays are present but short.

## Visual Status Checks
- KPI trend coloring:
  - Positive (`+`) trend is green.
  - Negative (`-`) trend is red.
  - Neutral trend is muted.
- Infrastructure status coloring:
  - `Healthy` uses success tone.
  - `High Latency` / `Degraded` use warning tone.
  - `Down` uses destructive tone.
- Customer status coloring:
  - `Active` success tone.
  - `Pending Setup` warning tone.
  - `Suspended` destructive tone.
- Ticket severity pill coloring:
  - `Critical` red.
  - `High` amber.
  - `Normal` blue.

## Regression Checks
- Sidebar and topbar still render correctly on desktop and mobile widths.
- Theme toggle in sidebar (Light/Dark) still works.
- No TypeScript errors after changes (`bun run check-types`).
