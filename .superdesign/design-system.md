# ISP App Design System

## Product Context
- Product: ISP management web app with auth and dashboard views.
- Frontend stack: React 19 + TanStack Router + Vite.
- UI primitives: shared shadcn-based components from `packages/ui/src/components`.
- Theme mode: light and dark (default dark), controlled by `next-themes`.

## Visual Direction
- Overall tone: modern, clean, utility-first interface with compact controls.
- Shape language: square corners (`rounded-none`) across core controls.
- Density: compact (small paddings, text-xs-heavy scale).
- Contrast: token-driven neutral palette with strong dark-mode baseline.

## Typography
- Font family: `Inter Variable`, sans-serif.
- Typical text sizes:
  - Body/UI copy: `text-xs`
  - Supporting copy: `text-xs/relaxed`, `text-muted-foreground`
  - Section emphasis: `text-sm`, `font-medium`
  - Page titles can be larger where needed.

## Color Tokens (From CSS Variables)
- Core semantic tokens:
  - `--background`, `--foreground`
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`
  - `--primary`, `--primary-foreground`
  - `--secondary`, `--secondary-foreground`
  - `--muted`, `--muted-foreground`
  - `--accent`, `--accent-foreground`
  - `--destructive`
  - `--border`, `--input`, `--ring`
- Additional chart tokens: `--chart-1` to `--chart-5`.
- Sidebar tokens present: `--sidebar-*`.

## Spacing and Layout
- Root app layout: `grid grid-rows-[auto_1fr] h-svh`.
- Container pattern used on home: `container mx-auto max-w-3xl px-4 py-2`.
- Form/card spacing uses utility classes like `gap-2`, `gap-4`, `space-y-4`, `p-4`, `p-6`.

## Radius, Borders, and Depth
- Radius token: `--radius: 0.625rem` available, but many components intentionally use sharp corners (`rounded-none`).
- Border treatment:
  - Inputs/buttons/cards rely on `border`, `ring-1`, and subtle ring color.
  - Base layer applies `border-border` and `outline-ring/50`.
- Shadows:
  - Menus/popovers use medium shadow (`shadow-md` / `shadow-lg`) with ring.

## Component Patterns
- Buttons:
  - Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`.
  - Sizes: `default`, `xs`, `sm`, `lg`, and icon sizes.
- Forms:
  - Label + Input stack, inline validation text in destructive/red.
- Menus:
  - Dropdown-based account and theme controls.
- Feedback:
  - Sonner toaster with semantic icons and tokenized colors.
- Skeleton:
  - Loading placeholders use pulse + muted backgrounds.

## Interaction and Motion
- Theme toggle uses icon rotation/scale transitions.
- Dropdown/popover animations use fade/zoom/slide combinations from utility classes.
- Focus styles are explicit via `focus-visible:border-ring` and ring utilities.

## Hard Constraints For New Designs
- Use ONLY project tokens and semantic color variables.
- Keep square-corner style for primary surfaces and controls unless explicitly requested otherwise.
- Reuse existing component primitives (`Button`, `Input`, `Card`, `DropdownMenu`, `Label`, `Skeleton`, `Toaster`).
- Preserve compact density and typography baseline unless a specific page requires deviation.
