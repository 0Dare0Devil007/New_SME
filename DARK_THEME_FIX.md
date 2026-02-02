# Dark Theme Fix Documentation

## Overview
This document identifies all pages and components that have dark theme inconsistencies and provides the fixes needed to ensure proper dark mode support across the entire application.

## CSS Variables Already Configured
The `app/globals.css` file already has proper dark mode CSS variables configured using the `.dark` class selector. The theme variables include:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`, `--ring`
- Chart and status colors

## Pages Requiring Dark Theme Fixes

### 1. `/app/skills/page.tsx` ❌ NEEDS FIX
**Issues:**
- Uses hardcoded light theme colors: `bg-gradient-to-br from-gray-50 to-gray-100`
- Uses hardcoded text colors: `text-gray-600`, `text-gray-900`
- Hero section uses hardcoded `bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800`
- Search input uses hardcoded `bg-white`
- Loading spinner uses `border-blue-600`
- Pagination buttons use hardcoded `bg-white`, `border-gray-200`, `text-gray-700`, `bg-blue-600`

**Fix:**
```tsx
// Replace hardcoded colors with theme-aware classes:
// bg-gradient-to-br from-gray-50 to-gray-100 → bg-background
// text-gray-600 → text-muted-foreground
// text-gray-900 → text-foreground
// bg-white → bg-card
// border-gray-200 → border-border
// border-blue-600 → border-primary
// bg-blue-600 → bg-primary
// text-gray-700 → text-foreground
// text-gray-400 → text-muted-foreground
```

---

### 2. `/app/courses/page.tsx` ❌ NEEDS FIX
**Issues:**
- Uses `bg-gradient-to-b from-gray-50 to-white`
- Uses hardcoded `bg-white`, `border-gray-200`
- Uses `text-gray-900`, `text-gray-600`, `text-gray-500`, `text-gray-400`, `text-gray-700`
- Uses `bg-teal-100`, `text-teal-600`, `bg-teal-600`
- CourseCard uses hardcoded gradient backgrounds
- Loading and error states use hardcoded colors

**Fix:**
```tsx
// Background: bg-gradient-to-b from-gray-50 to-white → bg-background
// Cards: bg-white → bg-card
// Borders: border-gray-200 → border-border
// Text colors:
//   text-gray-900 → text-foreground
//   text-gray-600 → text-muted-foreground
//   text-gray-500 → text-muted-foreground
//   text-gray-400 → text-muted-foreground
//   text-gray-700 → text-foreground
// Accent colors can remain as teal for branding, but ensure good contrast in dark mode
```

---

### 3. `/app/nominations/NominationsClient.tsx` ❌ NEEDS FIX
**Issues:**
- Uses `bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20`
- Uses hardcoded `bg-white`, `border-gray-200`, `border-gray-300`
- Uses `text-gray-900`, `text-gray-600`, `text-gray-500`, `text-gray-400`
- Search input uses `text-gray-900`, `placeholder-gray-500`
- Status badges use hardcoded `bg-yellow-100`, `bg-green-100`, `bg-red-100`
- Selected employee uses `bg-blue-50`, `border-blue-200`

**Fix:**
```tsx
// Main background: bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 → bg-background
// Cards: bg-white → bg-card
// Borders: border-gray-200/300 → border-border
// Text: Use text-foreground, text-muted-foreground
// Search input: Use bg-card text-foreground placeholder:text-muted-foreground
// Status badges: Consider using CSS variables or dark-aware variants
//   bg-yellow-100 → bg-status-pending/20 (already defined)
//   bg-green-100 → bg-status-success/20
//   bg-red-100 → bg-status-error/20
```

---

### 4. `/app/department-smes/DepartmentSmesClient.tsx` ❌ NEEDS FIX
**Issues:**
- Uses `bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20`
- Uses hardcoded `bg-white`, `border-gray-200`, `border-gray-300`
- Uses `text-gray-900`, `text-gray-600`, `text-gray-500`, `text-gray-400`, `text-gray-700`
- Status badges use hardcoded colors
- Filter buttons use `bg-gray-100 text-gray-600`, `bg-blue-600 text-white`
- Modal uses `bg-white`

**Fix:**
```tsx
// Same pattern as nominations page
// bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 → bg-background
// bg-white → bg-card
// border-gray-200 → border-border
// text-gray-900 → text-foreground
// text-gray-600/500/400 → text-muted-foreground
// Filter buttons: bg-gray-100 → bg-muted, bg-blue-600 → bg-primary
```

---

### 5. `/app/notifications/page.tsx` ❌ NEEDS FIX
**Issues:**
- Uses `bg-gray-50` for main background
- Uses hardcoded `bg-white`, `text-gray-900`, `text-gray-600`, `text-gray-700`
- Filter buttons use hardcoded colors
- Notification items use `bg-blue-50/50` for unread state
- Pagination uses hardcoded colors

**Fix:**
```tsx
// bg-gray-50 → bg-background
// bg-white → bg-card
// text-gray-900 → text-foreground
// text-gray-600/700 → text-muted-foreground or text-foreground
// bg-blue-50/50 → bg-accent/50 or bg-primary/10
```

---

### 6. `/app/notifications/preferences/page.tsx` ❌ NEEDS FIX
**Issues:**
- Uses `bg-gray-50` for main background
- Loading spinner uses hardcoded colors

**Fix:**
```tsx
// bg-gray-50 → bg-background
// Use theme-aware colors throughout
```

---

### 7. `/app/experts/[id]/page.tsx` ⚠️ PARTIAL FIX NEEDED
**Issues:**
- May have some hardcoded colors in specific sections
- Need to verify modal backgrounds and overlay colors
- Form inputs may need dark mode styling

---

### 8. `/app/sme-profile/page.tsx` ⚠️ NEEDS REVIEW
**Issues:**
- Form elements may have hardcoded backgrounds
- Modal/overlay colors need verification
- Status indicators may use hardcoded colors

---

## Pages Already Using Theme Variables ✅

### `/app/experts/page.tsx` ✅ GOOD
- Uses `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
- Uses `border-border`, `bg-muted`, `bg-primary`
- Properly themed

### `/app/page.tsx` (Homepage) ✅ GOOD
- Uses theme variables properly
- `bg-muted`, `text-foreground`, `text-muted-foreground`
- `bg-primary`, `text-primary-foreground`

### `/app/dashboard/DashboardClient.tsx` ✅ GOOD
- Uses `bg-background`, `text-foreground`, `text-muted-foreground`
- Uses `text-primary`, `text-destructive`
- Status badges use theme variables

---

## Components Status

### `/components/SkillCard.tsx` ✅ GOOD
- Uses `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`
- Properly themed

### `/components/SmeCard.tsx` ✅ GOOD  
- Uses `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`
- Uses `bg-primary`, `text-primary-foreground`
- Properly themed

### `/components/Header.tsx` ✅ GOOD
- Uses theme-aware classes
- Includes ThemeToggle component

---

## Required Changes Summary

### High Priority (User-facing pages with obvious issues)

1. **`/app/skills/page.tsx`**
   - Replace all `gray-*` colors with theme variables
   - Replace `bg-white` with `bg-card`
   - Replace `bg-blue-600` with `bg-primary`

2. **`/app/courses/page.tsx`**
   - Replace gradient backgrounds
   - Replace all hardcoded text/border colors
   - Update CourseCard component colors

3. **`/app/notifications/page.tsx`**
   - Replace `bg-gray-50` with `bg-background`
   - Replace all card backgrounds
   - Update filter button colors

4. **`/app/nominations/NominationsClient.tsx`**
   - Replace gradient background
   - Update all hardcoded colors

5. **`/app/department-smes/DepartmentSmesClient.tsx`**
   - Replace gradient background
   - Update all hardcoded colors

6. **`/app/notifications/preferences/page.tsx`**
   - Replace background colors
   - Update loading indicator colors

---

## CSS Class Mapping Reference

| Hardcoded Class | Theme-Aware Replacement |
|-----------------|------------------------|
| `bg-white` | `bg-card` |
| `bg-gray-50` | `bg-background` or `bg-muted` |
| `bg-gray-100` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-800` | `text-foreground` |
| `text-gray-700` | `text-foreground` or `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `bg-blue-600` | `bg-primary` |
| `text-blue-600` | `text-primary` |
| `hover:bg-gray-50` | `hover:bg-muted` |
| `hover:bg-gray-100` | `hover:bg-accent` |
| `placeholder-gray-500` | `placeholder:text-muted-foreground` |
| `divide-gray-100` | `divide-border` |

---

## Implementation Steps

1. **Update `/app/skills/page.tsx`** - Replace all hardcoded colors
2. **Update `/app/courses/page.tsx`** - Replace all hardcoded colors including CourseCard
3. **Update `/app/notifications/page.tsx`** - Replace all hardcoded colors
4. **Update `/app/nominations/NominationsClient.tsx`** - Replace all hardcoded colors
5. **Update `/app/department-smes/DepartmentSmesClient.tsx`** - Replace all hardcoded colors
6. **Update `/app/notifications/preferences/page.tsx`** - Replace all hardcoded colors
7. **Test all pages in both light and dark modes**
8. **Verify contrast ratios meet accessibility standards**

---

## Notes

- The theme toggle component is already working in the Header
- CSS variables for both light and dark modes are properly defined in `globals.css`
- Some accent colors (like teal for courses, blue for buttons) may be kept for branding but should ensure good contrast in dark mode
- Status colors (`--status-pending`, `--status-success`, `--status-error`, `--status-info`) are already defined for both themes
