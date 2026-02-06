# KnowledgeResource - Content Management Implementation Plan

This document outlines the complete implementation plan for adding the KnowledgeResource feature to the SME Platform, enabling SMEs to share knowledge articles, documents, videos, and links.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Database Schema Changes](#phase-1-database-schema-changes)
3. [Phase 2: API Routes](#phase-2-api-routes)
4. [Phase 3: Frontend Pages](#phase-3-frontend-pages)
5. [Phase 4: UI Features](#phase-4-ui-features)
6. [Phase 5: Integration Points](#phase-5-integration-points)
7. [Phase 6: Implementation Checklist](#phase-6-implementation-checklist)
8. [Phase 7: Future Enhancements](#phase-7-future-enhancements)
9. [Estimated Timeline](#estimated-timeline)

---

## Overview

The KnowledgeResource feature allows SMEs to share knowledge beyond structured courses. This includes:

- **Articles** - Written content with rich text
- **Videos** - Links to YouTube, Vimeo, or internal video platforms
- **Documents** - PDFs, presentations, spreadsheets
- **Links** - External resources, tools, documentation

### Business Value

- Extends SME contribution beyond live training
- Creates a searchable knowledge base
- Tracks content engagement via view counts
- Associates resources with skills for better discovery

---

## Phase 1: Database Schema Changes

### 1.1 Add Prisma Models

Add to `prisma/schema.prisma`:

```prisma
model KnowledgeResource {
  resourceId    BigInt   @id @default(autoincrement()) @map("resource_id")
  smeId         BigInt   @map("sme_id")
  title         String   @db.VarChar(250)
  description   String?
  resourceType  String   @map("resource_type") @db.VarChar(30) // ARTICLE, VIDEO, DOCUMENT, LINK
  contentUrl    String?  @map("content_url")
  content       String?  // For inline articles (Markdown/HTML)
  skillId       BigInt?  @map("skill_id")
  viewCount     Int      @default(0) @map("view_count")
  isPublished   Boolean  @default(false) @map("is_published")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  sme   SmeProfile @relation(fields: [smeId], references: [smeId], onDelete: Cascade)
  skill Skill?     @relation(fields: [skillId], references: [skillId])
  tags  ResourceTag[]

  @@index([smeId])
  @@index([skillId])
  @@index([resourceType])
  @@index([isPublished])
  @@map("knowledge_resources")
}

model ResourceTag {
  resourceId BigInt @map("resource_id")
  tag        String @db.VarChar(50)

  resource KnowledgeResource @relation(fields: [resourceId], references: [resourceId], onDelete: Cascade)

  @@id([resourceId, tag])
  @@index([tag])
  @@map("resource_tags")
}
```

### 1.2 Update Related Models

Add relation to `SmeProfile`:

```prisma
model SmeProfile {
  // ... existing fields
  resources KnowledgeResource[]
}
```

Add relation to `Skill`:

```prisma
model Skill {
  // ... existing fields
  resources KnowledgeResource[]
}
```

### 1.3 Run Migration

```bash
npx prisma migrate dev --name add_knowledge_resources
```

### 1.4 Resource Types Enum (Application Level)

```typescript
// lib/constants.ts
export const RESOURCE_TYPES = {
  ARTICLE: 'ARTICLE',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  LINK: 'LINK',
} as const;

export type ResourceType = keyof typeof RESOURCE_TYPES;
```

---

## Phase 2: API Routes

### 2.1 Create API Structure

```
app/api/resources/
├── route.ts              # GET (list), POST (create)
├── [id]/
│   ├── route.ts          # GET, PUT, DELETE single resource
│   └── view/
│       └── route.ts      # POST - increment view count
└── tags/
    └── route.ts          # GET - list popular tags
```

### 2.2 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/resources` | List published resources with filtering | No |
| `POST` | `/api/resources` | Create new resource | Yes (SME only) |
| `GET` | `/api/resources/[id]` | Get single resource | No |
| `PUT` | `/api/resources/[id]` | Update resource | Yes (Owner/Admin) |
| `DELETE` | `/api/resources/[id]` | Delete resource | Yes (Owner/Admin) |
| `POST` | `/api/resources/[id]/view` | Increment view count | No |
| `GET` | `/api/resources/tags` | Get popular tags | No |

### 2.3 Query Parameters for GET /api/resources

| Parameter | Type | Description |
|-----------|------|-------------|
| `skillId` | BigInt | Filter by associated skill |
| `smeId` | BigInt | Filter by author |
| `type` | String | Filter by resource type (ARTICLE, VIDEO, DOCUMENT, LINK) |
| `tag` | String | Filter by tag |
| `search` | String | Full-text search on title/description |
| `page` | Int | Page number (default: 1) |
| `limit` | Int | Items per page (default: 12) |
| `sortBy` | String | Sort field: `createdAt`, `viewCount`, `title` |
| `sortOrder` | String | `asc` or `desc` |

### 2.4 API Implementation Examples

#### GET /api/resources/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const skillId = searchParams.get("skillId");
  const smeId = searchParams.get("smeId");
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const where: any = {
    isPublished: true,
  };

  if (skillId) where.skillId = BigInt(skillId);
  if (smeId) where.smeId = BigInt(smeId);
  if (type) where.resourceType = type;
  if (tag) where.tags = { some: { tag } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [resources, total] = await Promise.all([
    prisma.knowledgeResource.findMany({
      where,
      include: {
        sme: { include: { employee: true } },
        skill: true,
        tags: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeResource.count({ where }),
  ]);

  return NextResponse.json({
    resources,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  // Authentication check
  // Create resource with tags
  // Return created resource
}
```

#### POST /api/resources/[id]/view/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = BigInt(params.id);

  const resource = await prisma.knowledgeResource.update({
    where: { resourceId },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({ viewCount: resource.viewCount });
}
```

---

## Phase 3: Frontend Pages

### 3.1 Page Structure

```
app/
├── resources/
│   ├── page.tsx              # Resource listing/discovery
│   ├── ResourcesClient.tsx   # Client component with state
│   ├── [id]/
│   │   └── page.tsx          # Resource detail view
│   └── create/
│       └── page.tsx          # Create new resource (SME only)
└── sme-profile/
    └── resources/
        └── page.tsx          # Manage my resources (SME dashboard)
```

### 3.2 Components Structure

```
components/
├── resources/
│   ├── ResourceCard.tsx       # Card display for listings
│   ├── ResourceList.tsx       # List with filtering
│   ├── ResourceDetail.tsx     # Full resource view
│   ├── ResourceForm.tsx       # Create/Edit form
│   ├── ResourceTypeIcon.tsx   # Icon by type
│   ├── ResourceTypeBadge.tsx  # Badge with color by type
│   ├── TagInput.tsx           # Tag management input
│   ├── TagBadge.tsx           # Display tag badges
│   └── ResourceFilters.tsx    # Filter sidebar/controls
```

---

## Phase 4: UI Features

### 4.1 Resource Discovery Page (`/resources`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: Knowledge Resources                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 Search resources...                    [Filters] │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [All] [Articles] [Videos] [Documents] [Links]           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Card 1  │ │ Card 2  │ │ Card 3  │ │ Card 4  │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Card 5  │ │ Card 6  │ │ Card 7  │ │ Card 8  │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ < 1 2 3 4 5 ... 10 >                                    │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar with debounced input
- Tab-based type filtering
- Sidebar filters: Skill, Tags, Author
- Sort options: Latest, Most Viewed, A-Z
- Grid/List view toggle
- Responsive 4→2→1 column grid

### 4.2 Resource Card Design

```
┌────────────────────────────────────┐
│ [📄 ARTICLE]                       │
├────────────────────────────────────┤
│                                    │
│ Introduction to AWS Lambda         │
│                                    │
│ Learn the basics of serverless     │
│ computing with AWS Lambda...       │
│                                    │
│ ┌─────┐ ┌─────┐ ┌──────┐          │
│ │ AWS │ │Cloud│ │Server│          │
│ └─────┘ └─────┘ └──────┘          │
├────────────────────────────────────┤
│ 👤 John Smith                      │
│ 👁 1,234 views  •  📅 Feb 5, 2026 │
└────────────────────────────────────┘
```

**Color Coding by Type:**
- ARTICLE: Blue (`bg-blue-100 text-blue-700`)
- VIDEO: Red (`bg-red-100 text-red-700`)
- DOCUMENT: Green (`bg-green-100 text-green-700`)
- LINK: Purple (`bg-purple-100 text-purple-700`)

### 4.3 Resource Detail Page (`/resources/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Resources                                      │
├─────────────────────────────────────────────────────────┤
│ [📄 ARTICLE]  [Cloud Computing]                         │
│                                                         │
│ Introduction to AWS Lambda                              │
│ ═══════════════════════════════════════════════════════│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 👤 John Smith          │ 👁 1,234 │ 📅 Feb 5, 2026 ││
│ │ Cloud Architect        │  views   │                 ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Tags: [AWS] [Lambda] [Serverless] [Cloud]              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Article content rendered here with Markdown support...  │
│                                                         │
│ ## Getting Started                                      │
│ Lorem ipsum dolor sit amet...                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Related Resources                                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │Related 1│ │Related 2│ │Related 3│                    │
│ └─────────┘ └─────────┘ └─────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Create/Edit Resource Form

**Form Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | Text input | ✅ | Max 250 chars |
| Resource Type | Dropdown | ✅ | ARTICLE, VIDEO, DOCUMENT, LINK |
| Description | Textarea | ❌ | Short summary |
| Content | Rich Text Editor | Conditional | Required for ARTICLE type |
| Content URL | URL input | Conditional | Required for VIDEO, DOCUMENT, LINK |
| Skill | Dropdown | ❌ | Associate with a skill |
| Tags | Tag input | ❌ | Comma-separated or autocomplete |
| Published | Toggle | ✅ | Default: false (draft) |

**Validation Rules:**
- Title: Required, 3-250 characters
- Content URL: Valid URL format
- At least one of `content` or `contentUrl` must be provided
- Maximum 10 tags per resource
- Tag length: 2-50 characters each

---

## Phase 5: Integration Points

### 5.1 SME Profile Enhancement

**Add to `/experts/[id]` page:**

```
┌─────────────────────────────────────────────────────────┐
│ [Overview] [Skills] [Courses] [Resources] [Reviews]     │
├─────────────────────────────────────────────────────────┤
│ Resources by John Smith (12 total)                      │
│                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │Resource1│ │Resource2│ │Resource3│ │Resource4│        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────┘
```

**API Addition:**
- `GET /api/experts/[id]/resources` - Get resources by SME

### 5.2 Skill Page Enhancement

**Add to skill detail/listing:**
- "Learning Resources" section
- Count of resources per skill
- Link to filtered resources page

### 5.3 Dashboard Widget

**SME Dashboard Card:**

```
┌────────────────────────────────┐
│ 📚 My Resources                │
├────────────────────────────────┤
│ Total: 12    Views: 5,432      │
│ Published: 10  Drafts: 2       │
│                                │
│ [Manage Resources →]           │
└────────────────────────────────┘
```

### 5.4 Navigation Updates

**Header Navigation:**
Add "Resources" link to main navigation between "Courses" and "Skills"

```typescript
// components/Header.tsx
const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Experts", href: "/experts" },
  { name: "Courses", href: "/courses" },
  { name: "Resources", href: "/resources" }, // NEW
  { name: "Skills", href: "/skills" },
];
```

### 5.5 Notifications Integration

**New Notification Types:**

| Type | Trigger | Message |
|------|---------|---------|
| `RESOURCE_PUBLISHED` | SME publishes a new resource | "{SME} published a new resource: {title}" |
| `RESOURCE_MILESTONE` | Resource hits view milestone | "Your resource '{title}' reached {count} views!" |

Add to notification preferences:
```typescript
// Add to NotificationPreference model
resourceUpdates Boolean @default(true) @map("resource_updates")
```

---

## Phase 6: Implementation Checklist

### Database
- [ ] Add `KnowledgeResource` model to `prisma/schema.prisma`
- [ ] Add `ResourceTag` model to `prisma/schema.prisma`
- [ ] Add `resources` relation to `SmeProfile` model
- [ ] Add `resources` relation to `Skill` model
- [ ] Run `npx prisma migrate dev --name add_knowledge_resources`
- [ ] Run `npx prisma generate`
- [ ] Add seed data for testing in `prisma/seed.ts`

### API Routes
- [ ] Create `app/api/resources/route.ts` (GET, POST)
- [ ] Create `app/api/resources/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Create `app/api/resources/[id]/view/route.ts` (POST)
- [ ] Create `app/api/resources/tags/route.ts` (GET)
- [ ] Add authentication middleware checks
- [ ] Add input validation with Zod

### Frontend Pages
- [ ] Create `app/resources/page.tsx`
- [ ] Create `app/resources/ResourcesClient.tsx`
- [ ] Create `app/resources/[id]/page.tsx`
- [ ] Create `app/resources/create/page.tsx`
- [ ] Create `app/sme-profile/resources/page.tsx`

### Components
- [ ] Create `components/resources/ResourceCard.tsx`
- [ ] Create `components/resources/ResourceList.tsx`
- [ ] Create `components/resources/ResourceDetail.tsx`
- [ ] Create `components/resources/ResourceForm.tsx`
- [ ] Create `components/resources/ResourceTypeIcon.tsx`
- [ ] Create `components/resources/ResourceTypeBadge.tsx`
- [ ] Create `components/resources/TagInput.tsx`
- [ ] Create `components/resources/TagBadge.tsx`
- [ ] Create `components/resources/ResourceFilters.tsx`

### Integration
- [ ] Add Resources tab to SME profile page
- [ ] Add resources section to skill pages
- [ ] Add dashboard widget for SME resource management
- [ ] Add "Resources" link to Header navigation
- [ ] Update notification types and preferences

### Polish & Testing
- [ ] Add loading skeletons for all pages
- [ ] Add error boundary and error states
- [ ] Add empty states with CTAs
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Test dark mode support
- [ ] Add toast notifications for actions
- [ ] Write API integration tests
- [ ] Test all CRUD operations
- [ ] Test filtering and search functionality
- [ ] Test pagination

---

## Phase 7: Future Enhancements

### Priority 1 - High Value
1. **Rich Text Editor** - Implement TipTap or Slate for WYSIWYG article editing
2. **File Upload** - Support direct PDF/document uploads to S3/Azure Blob Storage
3. **Video Embed** - Auto-parse YouTube/Vimeo URLs for thumbnail previews

### Priority 2 - Medium Value
4. **Bookmarks/Favorites** - Allow users to save resources for later
5. **Resource Comments** - Discussion section on resources
6. **Resource Ratings** - Star ratings for quality feedback
7. **View Analytics** - Detailed view statistics dashboard for SMEs

### Priority 3 - Nice to Have
8. **Resource Collections** - Curated playlists or learning paths
9. **Full-Text Search** - PostgreSQL GIN indexes for better search
10. **Resource Versioning** - Track changes and revision history
11. **PDF Preview** - In-app document preview
12. **Share Functionality** - Copy link, share to Teams/Slack

### Technical Improvements
- Add Redis caching for popular resources
- Implement view count batching to reduce DB writes
- Add CDN for document/media delivery
- Implement SEO meta tags for public resources

---

## Estimated Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Database Schema | 0.5 days | None |
| **Phase 2** | API Routes | 1.5 days | Phase 1 |
| **Phase 3** | Frontend Pages | 2 days | Phase 2 |
| **Phase 4** | UI/UX Polish | 1.5 days | Phase 3 |
| **Phase 5** | Integration | 1 day | Phase 3 |
| **Phase 6** | Testing & QA | 1.5 days | All phases |

**Total Estimated Time: 8-10 days**

### Resource Requirements
- 1 Full-stack developer
- Design assets for resource type icons (optional - can use Lucide icons)
- Access to test data / SME profiles

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full database schema reference
- [NOTIFICATION_SYSTEM.md](../NOTIFICATION_SYSTEM.md) - Notification implementation details
- [DASHBOARD_IMPLEMENTATION_SUMMARY.md](../DASHBOARD_IMPLEMENTATION_SUMMARY.md) - Dashboard patterns

---

*Document created: February 6, 2026*
*Last updated: February 6, 2026*
