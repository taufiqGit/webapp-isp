# Pages

## / (Home Page)
Entry: `apps/web/src/routes/index.tsx`
Dependencies:
- `apps/web/src/routes/index.tsx`
  - `apps/web/src/utils/trpc.ts`

## /login (Auth Page)
Entry: `apps/web/src/routes/login.tsx`
Dependencies:
- `apps/web/src/routes/login.tsx`
  - `apps/web/src/components/sign-in-form.tsx`
    - `apps/web/src/components/loader.tsx`
    - `apps/web/src/lib/auth-client.ts`
    - `packages/ui/src/components/button.tsx`
    - `packages/ui/src/components/input.tsx`
    - `packages/ui/src/components/label.tsx`
  - `apps/web/src/components/sign-up-form.tsx`
    - `apps/web/src/components/loader.tsx`
    - `apps/web/src/lib/auth-client.ts`
    - `packages/ui/src/components/button.tsx`
    - `packages/ui/src/components/input.tsx`
    - `packages/ui/src/components/label.tsx`

## /dashboard (Dashboard Page)
Entry: `apps/web/src/routes/dashboard.tsx`
Dependencies:
- `apps/web/src/routes/dashboard.tsx`
  - `apps/web/src/lib/auth-client.ts`
  - `apps/web/src/utils/trpc.ts`

## Shared Layout Dependencies (All Pages)
- `apps/web/src/routes/__root.tsx`
  - `apps/web/src/components/header.tsx`
    - `apps/web/src/components/mode-toggle.tsx`
      - `apps/web/src/components/theme-provider.tsx`
      - `packages/ui/src/components/button.tsx`
      - `packages/ui/src/components/dropdown-menu.tsx`
    - `apps/web/src/components/user-menu.tsx`
      - `apps/web/src/lib/auth-client.ts`
      - `packages/ui/src/components/button.tsx`
      - `packages/ui/src/components/dropdown-menu.tsx`
      - `packages/ui/src/components/skeleton.tsx`
  - `apps/web/src/components/theme-provider.tsx`
  - `packages/ui/src/components/sonner.tsx`
  - `apps/web/src/index.css`
  - `packages/ui/src/styles/globals.css`