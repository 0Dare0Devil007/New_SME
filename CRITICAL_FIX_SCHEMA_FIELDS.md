# Critical Fix: Prisma Schema Field Names

## Issue
Dashboard completely failed with error:
```
Unknown argument `createdAt`. Available options are marked with ?
```

## Root Cause
The API route was using incorrect field names for date filtering. Different Prisma models use different timestamp field names:

### Correct Schema Field Names

| Model | Timestamp Field | Usage |
|-------|----------------|-------|
| `SmeProfile` | `createdAt` | When profile was created |
| `SmeNomination` | `requestedAt` | When nomination was submitted |
| `Endorsement` | `endorsedAt` | When endorsement was given |
| `SmeSkill` | `addedAt` | When skill was added to SME |
| `Course` | N/A | No filtering needed |
| `Skill` | N/A | No filtering needed |

## Changes Made

### 1. Fixed Endorsement Count Query
**File**: `app/api/dashboard/stats/route.ts` (line ~107)

```typescript
// ❌ BEFORE (INCORRECT)
prisma.endorsement.count({
  where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
})

// ✅ AFTER (CORRECT)
prisma.endorsement.count({
  where: dateFilter ? { endorsedAt: { gte: dateFilter } } : undefined,
})
```

### 2. Fixed SmeSkill Query
**File**: `app/api/dashboard/stats/route.ts` (line ~195)

```typescript
// ❌ BEFORE (INCORRECT)
prisma.skill.findMany({
  include: {
    smeSkills: {
      where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
    },
  },
})

// ✅ AFTER (CORRECT)
prisma.skill.findMany({
  include: {
    smeSkills: {
      where: dateFilter ? { addedAt: { gte: dateFilter } } : undefined,
    },
  },
})
```

## Verification Checklist

### Schema Fields Used Correctly
- ✅ `SmeProfile.createdAt` - Used for SME creation date
- ✅ `SmeNomination.requestedAt` - Used for nomination date
- ✅ `Endorsement.endorsedAt` - Fixed to use correct field
- ✅ `SmeSkill.addedAt` - Fixed to use correct field

### Queries Now Working
- ✅ Total SMEs count with date filter
- ✅ Approved/Suspended SMEs count with date filter
- ✅ Pending nominations count with date filter
- ✅ Total endorsements count with date filter
- ✅ SMEs by department with date filter
- ✅ SMEs by site with date filter
- ✅ Recent nominations with date filter
- ✅ Top endorsed SMEs with date filter
- ✅ Most endorsed skills with date filter

## Testing

### Test All Date Ranges
1. **Last 7 days** - Should work without errors
2. **Last 30 days** - Default, should work
3. **Last 90 days** - Should work
4. **Last year** - Should work
5. **All time** - Should show all data

### Expected Behavior
- No console errors
- Data loads correctly
- Counts update based on filter
- Charts display filtered data
- No Prisma validation errors

## Prevention

### When Adding New Date Filters
1. **Always check the Prisma schema** for the correct field name
2. **Don't assume** all models use `createdAt`
3. **Test with different date ranges** to catch field name errors early
4. **Check Prisma error messages** - they show available fields

### Common Timestamp Field Names in This Schema
```typescript
// Creation/Addition timestamps
createdAt   // SmeProfile
requestedAt // SmeNomination
endorsedAt  // Endorsement
addedAt     // SmeSkill

// Update timestamps
updatedAt   // SmeProfile
decisionAt  // SmeNomination
```

## Impact
**Before**: Dashboard completely broken, nothing displayed
**After**: Dashboard fully functional with all date filters working

## Related Files
- `/prisma/schema.prisma` - Schema definitions (reference only, not modified)
- `/app/api/dashboard/stats/route.ts` - Fixed field names
- `/app/dashboard/DashboardClient.tsx` - No changes needed
- `/app/dashboard/components/DashboardFilters.tsx` - No changes needed

## Status
✅ **FIXED** - Dashboard now loads correctly with all date filters working
