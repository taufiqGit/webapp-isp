# Extractable Components

## Header
- Source: `apps/web/src/components/header.tsx`
- Category: layout
- Description: Top navigation bar with route links, theme toggle, and user menu.
- Extractable props: links (array, default: Home/Dashboard)
- Hardcoded: separator line, layout classes, default labels

## UserMenu
- Source: `apps/web/src/components/user-menu.tsx`
- Category: layout
- Description: Auth-aware user menu with sign-in/sign-out actions.
- Extractable props: isAuthenticated (boolean), userName (string), userEmail (string)
- Hardcoded: menu labels and variants

## ModeToggle
- Source: `apps/web/src/components/mode-toggle.tsx`
- Category: basic
- Description: Theme switcher dropdown (light/dark/system).
- Extractable props: currentTheme (string)
- Hardcoded: icons and menu options