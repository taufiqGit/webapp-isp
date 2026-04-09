# Modern ISP Dashboard Dark Mode - Implementation Plan

## Source Design
- Superdesign Project ID: `d011b318-8907-4c04-94c8-26b9b0f882b2`
- Draft ID: `d78b9a59-48ce-4679-9d12-30a3c2182fa3`
- Draft title: `Modern ISP Dashboard Dark Mode`

## Goal
Implement a production-ready dark-mode ISP operations dashboard in this codebase, aligned with the fetched draft while preserving the existing design system constraints:
- React + TanStack Router app structure in `apps/web`.
- Shared shadcn-based primitives in `packages/ui`.
- Existing auth/session flow and TRPC data access.
- Existing token-driven theming from `packages/ui/src/styles/globals.css`.

## Key Draft Sections To Implement
- Left navigation shell with product identity (`NetPulse`) and menu groups.
- Top header with system status badge, user identity, and time-range controls.
- KPI cards:
  - Total Customers
  - Monthly Revenue
  - Network Uptime
  - Active Tickets
- Bandwidth and traffic overview panel (ingress/egress chart + labels).
- Core infrastructure health panel (router/switch/auth server statuses).
- Recent customer activity table.
- Recent support tickets list with severity + state chips.

## Current-State Gap (Codebase)
- Current `/dashboard` route is minimal text output in `apps/web/src/routes/dashboard.tsx`.
- Existing root layout has a top header in `apps/web/src/components/header.tsx`, but no persistent left sidebar.
- Data sources exist for auth + TRPC, but dashboard-specific API contracts do not exist yet.
- Shared UI primitives are available (`button`, `card`, `input`, `dropdown-menu`, `skeleton`, `label`) and should be reused before creating new primitives.

## Proposed Route + Component Architecture

### Route
- Keep `/dashboard` route in `apps/web/src/routes/dashboard.tsx` as entry.
- Move heavy UI into a route-local page component:
  - `apps/web/src/components/dashboard/dashboard-page.tsx`

### Layout Components
- `apps/web/src/components/dashboard/dashboard-shell.tsx`
  - Two-column shell (sidebar + content area), dark-first.
- `apps/web/src/components/dashboard/dashboard-sidebar.tsx`
  - Brand block + nav links + active state.
- `apps/web/src/components/dashboard/dashboard-topbar.tsx`
  - Status pill, role/user block, view mode tabs, range select.

### Dashboard Content Components
- `apps/web/src/components/dashboard/kpi-grid.tsx`
- `apps/web/src/components/dashboard/kpi-card.tsx`
- `apps/web/src/components/dashboard/traffic-overview-card.tsx`
- `apps/web/src/components/dashboard/infrastructure-health-card.tsx`
- `apps/web/src/components/dashboard/customer-activity-table.tsx`
- `apps/web/src/components/dashboard/support-ticket-list.tsx`

### Shared UI Extension (only if needed)
- Add to `packages/ui/src/components/` only when primitives are reused across pages:
  - `badge.tsx` (severity/status chips)
  - `tabs.tsx` or segmented control equivalent (for view toggles)
  - `table.tsx` helpers if table styles repeat elsewhere

## Data Contract Plan (TRPC)

### Query Shape
Create one aggregated query first for implementation speed, then split if needed:
- `dashboard.summary`:
  - `kpis`: customers, revenue, uptime, activeTickets
  - `trafficSeries`: time labels + ingress + egress values
  - `infrastructure`: list of nodes with health/status/latency notes
  - `recentCustomers`: latest customer activity rows
  - `recentTickets`: latest ticket rows with severity + state

### Server Placement
- Add procedures under `packages/api/src/routers/`:
  - `dashboard.ts`
  - export via `packages/api/src/routers/index.ts`

### Client Hooking
- Query in `apps/web/src/routes/dashboard.tsx` via existing TRPC pattern:
  - `useQuery(trpc.dashboard.summary.queryOptions())`
- Keep auth guard as-is.
- Add loading state with `Skeleton` and failure state with compact error panel.

## Styling + Theming Rules
- Keep token fidelity to current system:
  - Use semantic classes (`bg-card`, `text-muted-foreground`, `border-border`, etc.).
  - Avoid introducing draft-specific hardcoded hex values unless added as approved tokens.
- Preserve compact density and mostly square corners (`rounded-none`) to match existing primitives.
- Use subtle gradients only if represented as reusable utility classes in local component styles.

## Implementation Phases

### Phase 1 - Scaffolding
- Create dashboard component folder and base shell components.
- Render static mocked content matching draft structure.
- Verify responsive behavior for desktop-first with graceful tablet stacking.

### Phase 2 - Data Integration
- Implement `dashboard.summary` TRPC endpoint with mock/fake data first.
- Wire query to UI and replace static values.
- Add loading/error states for each major block.

### Phase 3 - Visual Fidelity Pass
- Align spacing, typography scale, panel hierarchy, icon usage, and chips with draft intent.
- Ensure dark mode consistency and contrast accessibility.
- Tune chart area with lightweight rendering strategy (SVG/CSS or chosen chart lib if approved).

### Phase 4 - Hardening
- Add type-safe mappers between API result and UI view models.
- Add basic route-level tests or component smoke tests where currently practiced.
- Validate `bun run -F web check-types` and run dashboard manual QA checklist.

## Acceptance Criteria
- `/dashboard` visually matches the draft’s information architecture and dark tone.
- Sidebar, topbar, KPI cards, traffic panel, infra panel, activity table, and ticket list are present.
- Data is sourced from TRPC query contract (not hardcoded UI constants in final pass).
- Loading/error states are user-friendly and consistent with design tokens.
- Existing auth/session redirect behavior remains intact.

## Risks / Decisions Needed
- Charting approach:
  - Option A: lightweight custom SVG (lower dependency footprint)
  - Option B: chart library (faster polish, extra dependency)
- Sidebar coexistence with current global header:
  - Keep global header above dashboard shell, or hide it on `/dashboard` and use dashboard-local header.
- Data freshness:
  - Decide polling interval or manual refresh behavior for ops metrics.
