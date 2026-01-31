# Dashboard Filter Bug Fix

## Issue
When changing the date range filter to "Last 7 days", the dashboard failed to fetch data.

## Root Cause
The Prisma `groupBy` queries with nested relation filters were using the spread operator syntax incorrectly:

```typescript
// ❌ INCORRECT - Prisma groupBy doesn't support spread operator in nested relations
prisma.employee.groupBy({
  where: {
    smeProfile: {
      status: "APPROVED",
      ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
    },
  },
})
```

## Solution
Split the queries into conditional branches with explicit filter objects:

```typescript
// ✅ CORRECT - Use ternary to create separate query objects
dateFilter
  ? prisma.employee.groupBy({
      where: {
        smeProfile: {
          status: "APPROVED",
          createdAt: { gte: dateFilter },
        },
      },
    })
  : prisma.employee.groupBy({
      where: {
        smeProfile: {
          status: "APPROVED",
        },
      },
    })
```

## Changes Made

### 1. Fixed SMEs by Department Query
**File**: `app/api/dashboard/stats/route.ts` (around line 213)

Changed from spread operator to explicit conditional query.

### 2. Fixed SMEs by Site Query
**File**: `app/api/dashboard/stats/route.ts` (around line 168)

Changed from spread operator to explicit conditional query within the `Promise.all()` array.

### 3. Enhanced Error Handling
- Added console logging for date filter values
- Added detailed error messages in catch block
- Included error stack traces for debugging
- Return error details in API response (development mode)

### 4. Improved Frontend Error Display
**File**: `app/dashboard/DashboardClient.tsx`

- Clear error state before fetching
- Parse and display API error details
- Console log errors for debugging
- Better error message extraction from API response

## Testing
1. ✅ Test "Last 7 days" filter
2. ✅ Test "Last 30 days" filter (default)
3. ✅ Test "Last 90 days" filter
4. ✅ Test "Last year" filter
5. ✅ Test "All time" filter
6. ✅ Verify data is filtered correctly by date
7. ✅ Check browser console for any errors
8. ✅ Check server logs for query execution

## Notes

### Prisma GroupBy Limitations
- The `groupBy` method has limitations with nested relation filters
- When using object spread with conditional properties in nested relations, Prisma may fail silently or throw errors
- Always use explicit conditional queries for `groupBy` with nested relations

### Why This Happened
- The spread operator pattern works fine for simple Prisma queries
- But `groupBy` with nested relations requires more explicit query structure
- Prisma's type system doesn't always catch these issues at compile time

## Prevention
When using Prisma `groupBy` with nested relation filters:
1. Avoid spread operators in nested relation conditions
2. Use ternary operators to create separate query objects
3. Test all filter combinations thoroughly
4. Add comprehensive error logging

## Related Files
- `/app/api/dashboard/stats/route.ts` - API route with fixes
- `/app/dashboard/DashboardClient.tsx` - Frontend with better error handling
- `/app/dashboard/components/DashboardFilters.tsx` - Filter component (no changes needed)
