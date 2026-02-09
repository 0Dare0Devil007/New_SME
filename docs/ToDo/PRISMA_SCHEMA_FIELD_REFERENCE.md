# Prisma Schema Field Reference

> **Status:** ✅ Resolved | **Priority:** Reference Documentation  
> **Last Updated:** February 6, 2026

---

## Summary

This document serves as a reference for the correct timestamp field names across Prisma models in the SME Platform. An issue was previously encountered where incorrect field names caused dashboard failures.

---

## Timestamp Field Reference

| Model | Timestamp Field | Purpose |
|-------|-----------------|---------|
| `SmeProfile` | `createdAt` | Profile creation date |
| `SmeProfile` | `updatedAt` | Profile last modified |
| `SmeNomination` | `requestedAt` | Nomination submission date |
| `SmeNomination` | `decisionAt` | Approval/rejection date |
| `Endorsement` | `endorsedAt` | Endorsement given date |
| `SmeSkill` | `addedAt` | Skill assignment date |
| `Course` | — | No timestamp filtering |
| `Skill` | — | No timestamp filtering |

---

## Query Examples

### Correct Usage

```typescript
// SmeProfile - uses createdAt
prisma.smeProfile.count({
  where: { createdAt: { gte: dateFilter } }
})

// SmeNomination - uses requestedAt
prisma.smeNomination.count({
  where: { requestedAt: { gte: dateFilter } }
})

// Endorsement - uses endorsedAt
prisma.endorsement.count({
  where: { endorsedAt: { gte: dateFilter } }
})

// SmeSkill - uses addedAt
prisma.skill.findMany({
  include: {
    smeSkills: {
      where: { addedAt: { gte: dateFilter } }
    }
  }
})
```

### Common Mistakes to Avoid

```typescript
// ❌ Wrong - Endorsement does not have createdAt
prisma.endorsement.count({
  where: { createdAt: { gte: dateFilter } }
})

// ❌ Wrong - SmeSkill does not have createdAt
prisma.smeSkill.findMany({
  where: { createdAt: { gte: dateFilter } }
})
```

---

## Affected Files

| File | Status |
|------|--------|
| `app/api/dashboard/stats/route.ts` | ✅ Fixed |
| `prisma/schema.prisma` | Reference only |

---

## Best Practices

1. **Always verify schema field names** before writing date filter queries
2. **Check Prisma error messages** — they list available fields when a mismatch occurs
3. **Test all date range filters** (7d, 30d, 90d, 1y, all time) during development
4. **Refer to this document** when adding new date-filtered queries

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Full schema documentation
