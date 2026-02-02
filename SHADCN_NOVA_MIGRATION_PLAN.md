# shadcn Nova Theme Migration Plan

## Overview

This document outlines the plan to migrate the SME platform from the default shadcn style to the **Nova style** with:
- **Base**: Radix
- **Style**: Nova
- **Base Color**: Gray
- **Theme**: Blue
- **Icon Library**: RemixIcon
- **Font**: Outfit
- **Menu Accent**: Subtle
- **Menu Color**: Inverted
- **Radius**: Small

---

## Design Decisions

### 1. Gradient Handling
**Decision**: ❌ No gradients in the design

All gradient backgrounds will be replaced with solid colors using theme variables:
- Hero sections: Use `bg-primary` instead of gradient backgrounds
- Cards with gradient backgrounds: Use `bg-card` or `bg-muted`
- Avatar placeholders: Use solid `bg-primary` or `bg-accent`

### 2. Status Colors
**Decision**: ❌ No hardcoding - Use CSS variables

Create semantic CSS variables for status colors:
```css
:root {
  --status-pending: 48 96% 53%;      /* Yellow/Amber */
  --status-success: 142 71% 45%;     /* Green */
  --status-error: 0 84% 60%;         /* Red */
  --status-info: 217 91% 60%;        /* Blue */
}

.dark {
  --status-pending: 48 96% 70%;
  --status-success: 142 71% 60%;
  --status-error: 0 84% 70%;
  --status-info: 217 91% 70%;
}
```

### 3. Chart Dark Mode
**Decision**: ✅ Yes, add dark variants for charts

Update chart CSS variables with dark mode variants for better contrast and visibility.

---

## Migration Steps

### Phase 1: Run shadcn Preset Command

```bash
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=gray&theme=blue&iconLibrary=remixicon&font=outfit&menuAccent=subtle&menuColor=inverted&radius=small&template=next&rtl=false" --template next
```

**Files affected:**
- `components.json` - Updated configuration
- `app/globals.css` - New CSS variables
- `components/ui/*` - Regenerated with Nova style

---

### Phase 2: Install Dependencies

```bash
npm install @remixicon/react
npm uninstall lucide-react  # After migration complete
```

Update `app/layout.tsx` to use Outfit font:
```tsx
import { Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'] })
```

---

### Phase 3: Add Dark Mode Infrastructure

#### 3.1 Update `app/layout.tsx`
- Wrap app with `ThemeProvider` from `next-themes`
- Set `attribute="class"` for Tailwind dark mode
- Set `defaultTheme="system"`

#### 3.2 Update `app/globals.css`
Add complete dark mode CSS variables:

```css
.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --card: 224 71% 4%;
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 4%;
  --popover-foreground: 213 31% 91%;
  --primary: 217 91% 60%;
  --primary-foreground: 210 40% 98%;
  --secondary: 222 47% 11%;
  --secondary-foreground: 210 40% 98%;
  --muted: 223 47% 11%;
  --muted-foreground: 215 20% 65%;
  --accent: 216 34% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 216 34% 17%;
  --input: 216 34% 17%;
  --ring: 217 91% 60%;
  
  /* Chart colors - dark variants */
  --chart-1: 217 91% 70%;
  --chart-2: 262 83% 68%;
  --chart-3: 142 71% 55%;
  --chart-4: 38 92% 60%;
  --chart-5: 4 90% 68%;
  --chart-6: 188 91% 51%;
  --chart-7: 327 73% 67%;
  --chart-8: 24 95% 63%;
  
  /* Status colors - dark variants */
  --status-pending: 48 96% 70%;
  --status-success: 142 71% 60%;
  --status-error: 0 84% 70%;
  --status-info: 217 91% 70%;
}
```

#### 3.3 Create Theme Toggle Component
Create `components/ThemeToggle.tsx` with light/dark/system options.

---

### Phase 4: Refactor Pages

#### Color Replacement Map

| Old (Hardcoded) | New (Theme Variable) |
|-----------------|---------------------|
| `bg-white` | `bg-background` or `bg-card` |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground` |
| `border-gray-200`, `border-gray-300` | `border-border` |
| `bg-blue-600`, `bg-blue-700` | `bg-primary` |
| `text-blue-600` | `text-primary` |
| `text-blue-100` | `text-primary-foreground` |
| `hover:bg-gray-50` | `hover:bg-muted` |
| `hover:bg-gray-100` | `hover:bg-accent` |
| `bg-gradient-to-br from-*` | `bg-primary` (solid) |

#### Status Badge Replacements

| Old | New |
|-----|-----|
| `bg-yellow-100 text-yellow-700` | `bg-status-pending/20 text-status-pending` |
| `bg-green-100 text-green-700` | `bg-status-success/20 text-status-success` |
| `bg-red-100 text-red-700` | `bg-status-error/20 text-status-error` |
| `bg-blue-100 text-blue-700` | `bg-status-info/20 text-status-info` |

#### Files to Refactor

**Main Pages:**
1. `app/page.tsx` - Homepage
2. `app/dashboard/DashboardClient.tsx` - Dashboard
3. `app/experts/page.tsx` - Experts listing
4. `app/experts/[id]/page.tsx` - Expert detail
5. `app/nominations/NominationsClient.tsx` - Nominations
6. `app/notifications/page.tsx` - Notifications
7. `app/notifications/preferences/page.tsx` - Notification preferences
8. `app/skills/page.tsx` - Skills listing
9. `app/courses/page.tsx` - Courses
10. `app/department-smes/DepartmentSmesClient.tsx` - Department SMEs
11. `app/sme-profile/page.tsx` - SME Profile
12. `app/sign-in/page.tsx` - Sign in
13. `app/sign-up/page.tsx` - Sign up

**Components:**
1. `components/Header.tsx`
2. `components/SkillCard.tsx`
3. `components/SmeCard.tsx`
4. `components/NotificationBell.tsx`

**Dashboard Charts:**
1. `app/dashboard/components/ActivityLineChart.tsx`
2. `app/dashboard/components/DepartmentBarChart.tsx`
3. `app/dashboard/components/MostEndorsedSkillsTable.tsx`
4. `app/dashboard/components/SitePieChart.tsx`
5. `app/dashboard/components/SkillProgressBar.tsx`
6. `app/dashboard/components/TrainingAreaChart.tsx`
7. `app/dashboard/components/DashboardFilters.tsx`

---

### Phase 5: Icon Migration

Replace all `lucide-react` icons with `@remixicon/react` equivalents:

| Lucide Icon | RemixIcon Equivalent |
|-------------|---------------------|
| `Bell` | `RiNotification3Line` |
| `User` | `RiUserLine` |
| `Grid3X3` | `RiGridLine` |
| `Search` | `RiSearchLine` |
| `ChevronDown` | `RiArrowDownSLine` |
| `ChevronRight` | `RiArrowRightSLine` |
| `X` | `RiCloseLine` |
| `Check` | `RiCheckLine` |
| `Plus` | `RiAddLine` |
| `Settings` | `RiSettings3Line` |
| `LogOut` | `RiLogoutBoxLine` |
| `Moon` | `RiMoonLine` |
| `Sun` | `RiSunLine` |
| `Menu` | `RiMenuLine` |
| `Filter` | `RiFilterLine` |
| `Calendar` | `RiCalendarLine` |
| `Mail` | `RiMailLine` |
| `Building` | `RiBuilding2Line` |
| `MapPin` | `RiMapPinLine` |
| `Award` | `RiAwardLine` |
| `Star` | `RiStarLine` |
| `Users` | `RiTeamLine` |
| `TrendingUp` | `RiLineChartLine` |
| `BarChart` | `RiBarChartLine` |
| `PieChart` | `RiPieChartLine` |

---

### Phase 6: Testing Checklist

- [ ] Light mode renders correctly on all pages
- [ ] Dark mode renders correctly on all pages
- [ ] Theme toggle works (light/dark/system)
- [ ] All charts visible in both themes
- [ ] Status badges readable in both themes
- [ ] No hardcoded colors remaining
- [ ] All icons render correctly
- [ ] Font (Outfit) loads correctly
- [ ] Responsive design maintained
- [ ] Accessibility (contrast ratios) validated

---

## File Structure After Migration

```
components/
├── ui/
│   ├── badge.tsx          (Nova style)
│   ├── button.tsx         (Nova style)
│   ├── card.tsx           (Nova style)
│   ├── chart.tsx          (Nova style)
│   ├── dropdown-menu.tsx  (Nova style)
│   ├── popover.tsx        (Nova style)
│   ├── scroll-area.tsx    (Nova style)
│   └── sonner.tsx         (Nova style)
├── Header.tsx             (Refactored)
├── SkillCard.tsx          (Refactored)
├── SmeCard.tsx            (Refactored)
├── NotificationBell.tsx   (Refactored)
└── ThemeToggle.tsx        (New)
```

---

## Notes

- The `next-themes` package is already installed
- Tailwind CSS v4 is in use (no separate config file)
- Chart components already use CSS variables for colors
- Some UI components already have partial dark mode support
