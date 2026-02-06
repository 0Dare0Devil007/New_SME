# Figma Icons Replacement Summary

## Overview
All Figma asset URLs (`figma.com/api/mcp/asset/*`) have been replaced with Remix Icons (`@remixicon/react`) throughout the codebase. Figma asset URLs expire after 7 days, so using proper icon libraries ensures long-term stability.

---

## Files Modified

### 1. `app/experts/[id]/page.tsx`
- **Removed** the entire unused `icons` object containing 16 Figma URLs
- These icons were defined but never actually used (Lucide icons were already in use)

### 2. `components/SmeCard.tsx`
| Old (Figma) | New (Remix Icon) | Purpose |
|-------------|------------------|---------|
| `icons.endorsementIcon` | `RiThumbUpLine` | Endorsement badge |
| `icons.skillsIcon` | `RiLightbulbLine` | Skills & Expertise section header |
| `icons.certificationsIcon` | `RiMedalLine` | Certifications section header |

### 3. `app/page.tsx`
| Old (Figma) | New (Remix Icon) | Purpose |
|-------------|------------------|---------|
| `icons.crownIcon` | `RiVipCrownFill` | Verified expert badge |
| `icons.endorsement` | `RiThumbUpLine` | Endorsement count display |
| `icons.featuredExperts` | `RiStarFill` | Featured Experts section header |

### 4. `components/Header.tsx`
| Old (Figma) | New (Remix Icon) | Purpose |
|-------------|------------------|---------|
| `icons.logo` | `RiUserStarLine` | App logo in header |

### 5. `components/SkillCard.tsx`
| Old (Figma) | New (Remix Icon) | Purpose |
|-------------|------------------|---------|
| `skill.icon` (dynamic img) | `RiLightbulbLine` | Default skill icon |

### 6. `prisma/seed.ts`
- All 8 skill icon URLs set to empty strings
- UI now displays default icons via `SkillCard` component

---

## Icons Available for Customization

If you want to change any of these icons later, here are the current assignments:

| Location | Component | Current Icon | Suggested Alternatives |
|----------|-----------|--------------|------------------------|
| Header Logo | `Header.tsx` | `RiUserStarLine` | `RiGroupLine`, `RiTeamLine`, `RiBuilding2Line` |
| Skill Cards | `SkillCard.tsx` | `RiLightbulbLine` | `RiBookLine`, `RiGraduationCapLine`, `RiCodeLine` |
| Featured Experts | `app/page.tsx` | `RiStarFill` | `RiAwardLine`, `RiTrophyLine`, `RiMedalLine` |
| Verified Badge | `app/page.tsx` | `RiVipCrownFill` | `RiShieldCheckLine`, `RiVerifiedBadgeLine` |
| Endorsements | Multiple files | `RiThumbUpLine` | `RiHeartLine`, `RiHandHeartLine` |
| Skills Section | `SmeCard.tsx` | `RiLightbulbLine` | `RiStackLine`, `RiToolsLine` |
| Certifications | `SmeCard.tsx` | `RiMedalLine` | `RiAwardLine`, `RiFilePaper2Line` |

---

## How to Change Icons

1. Browse available icons at: https://remixicon.com/
2. Import the icon in your component:
   ```tsx
   import { RiNewIconName } from "@remixicon/react";
   ```
3. Replace the icon component:
   ```tsx
   <RiNewIconName className="w-5 h-5" />
   ```

---

## Notes

- All icons use the `@remixicon/react` package (already installed)
- Icon sizes are controlled via Tailwind classes (`w-3 h-3`, `w-5 h-5`, etc.)
- Colors are applied via `text-*` classes (e.g., `text-primary-foreground`)
- The seed file icons are set to empty strings - the UI handles default display
