# Search Functionality Enhancement Plan

## Overview
This document outlines a comprehensive plan to improve and enhance search functionality across the SME application. The current implementation has basic search capabilities, but there are significant opportunities for improvement in terms of performance, user experience, and feature completeness.

---

## Current State Analysis

### Existing Search Implementations

| Page/Feature | Search Fields | Type | Debounce | Pagination |
|--------------|---------------|------|----------|------------|
| Experts | Name, Department, Skills | Server-side | 300ms | ✅ |
| Skills | Skill Name, Description | Server-side | 300ms | ✅ |
| Courses | Title, Description, Instructor, Target Audience | Client-side | ❌ | ✅ |
| Department SMEs | Name, Email | Server-side | ❌ | ❌ |
| Nominations | Employee Name, Email, EmpNumber | Server-side | 300ms | ❌ |
| SME Profile (Skill Add) | Skill Name | Client-side | ❌ | ❌ |

### Current Limitations
1. **Inconsistent implementation** - Mix of client-side and server-side filtering
2. **No global search** - Users can only search within individual pages
3. **Limited search operators** - No support for advanced queries (AND, OR, exact match)
4. **No search history** - Users cannot access recent searches
5. **No search suggestions/autocomplete** - No predictive text or typeahead
6. **No fuzzy matching** - Typos and misspellings not handled
7. **No relevance ranking** - Results not sorted by relevance
8. **Missing keyboard shortcuts** - No Cmd+K or similar quick search access

---

## Enhancement Plan

### Phase 1: Foundation (Priority: High)

#### 1.1 Create Unified Search Component
**Description**: Build a reusable search component with consistent behavior across all pages.

**Tasks**:
- [ ] Create `components/ui/search-input.tsx` with the following features:
  - Configurable debounce delay (default 300ms)
  - Loading state indicator
  - Clear button
  - Search icon
  - Keyboard shortcut indicator
- [ ] Create `hooks/useDebounce.ts` - reusable debounce hook
- [ ] Create `hooks/useSearch.ts` - unified search state management hook

**Files to Create**:
```
components/ui/search-input.tsx
hooks/useDebounce.ts
hooks/useSearch.ts
```

**Estimated Effort**: 4-6 hours

---

#### 1.2 Global Search Implementation
**Description**: Add a global search feature accessible from any page via the header.

**Tasks**:
- [ ] Create `/api/search/route.ts` - unified search API endpoint
- [ ] Create `components/GlobalSearch.tsx` - command palette style search modal
- [ ] Implement keyboard shortcut (Cmd+K / Ctrl+K) to open global search
- [ ] Search across multiple entity types:
  - Experts (SME profiles)
  - Skills
  - Courses
  - Employees
- [ ] Display categorized results with icons and quick actions
- [ ] Add to `Header.tsx`

**API Response Structure**:
```typescript
interface GlobalSearchResult {
  experts: SearchResultItem[];
  skills: SearchResultItem[];
  courses: SearchResultItem[];
  employees: SearchResultItem[];
  totalCount: number;
}

interface SearchResultItem {
  id: string;
  type: 'expert' | 'skill' | 'course' | 'employee';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  relevanceScore: number;
}
```

**Files to Create/Modify**:
```
app/api/search/route.ts (new)
components/GlobalSearch.tsx (new)
components/Header.tsx (modify)
```

**Estimated Effort**: 8-12 hours

---

### Phase 2: Search Quality Improvements (Priority: High)

#### 2.1 Full-Text Search with PostgreSQL
**Description**: Leverage PostgreSQL's built-in full-text search capabilities for better performance and relevance.

**Tasks**:
- [ ] Create database migration to add search vectors
- [ ] Add GIN indexes for full-text search columns
- [ ] Implement `ts_vector` and `ts_query` for text search
- [ ] Add search ranking with `ts_rank`

**Migration SQL**:
```sql
-- Add search vector columns
ALTER TABLE employees ADD COLUMN search_vector tsvector;
ALTER TABLE skills ADD COLUMN search_vector tsvector;
ALTER TABLE sme_profiles ADD COLUMN search_vector tsvector;
ALTER TABLE courses ADD COLUMN search_vector tsvector;

-- Create indexes
CREATE INDEX idx_employees_search ON employees USING GIN(search_vector);
CREATE INDEX idx_skills_search ON skills USING GIN(search_vector);
CREATE INDEX idx_sme_profiles_search ON sme_profiles USING GIN(search_vector);
CREATE INDEX idx_courses_search ON courses USING GIN(search_vector);

-- Create trigger function to update search vectors
CREATE OR REPLACE FUNCTION update_employee_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.full_name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.position, '') || ' ' ||
    COALESCE(NEW.department_name, '') || ' ' ||
    COALESCE(NEW.site_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Files to Create**:
```
prisma/migrations/XXXXXX_add_fulltext_search/migration.sql
lib/search-utils.ts
```

**Estimated Effort**: 6-8 hours

---

#### 2.2 Search Suggestions & Autocomplete
**Description**: Provide real-time search suggestions as users type.

**Tasks**:
- [ ] Create `/api/search/suggestions/route.ts` endpoint
- [ ] Implement prefix matching for faster suggestions
- [ ] Cache popular searches using in-memory store or Redis
- [ ] Show recently searched terms per user
- [ ] Add trending searches section

**Features**:
- Show top 5-8 suggestions
- Group by category (Experts, Skills, Courses)
- Highlight matching text in suggestions
- Keyboard navigation (up/down arrows, enter to select)

**Files to Create**:
```
app/api/search/suggestions/route.ts
components/SearchSuggestions.tsx
lib/search-cache.ts
```

**Estimated Effort**: 6-8 hours

---

### Phase 3: Advanced Search Features (Priority: Medium)

#### 3.1 Advanced Search Filters
**Description**: Allow users to build complex search queries with multiple filters.

**Tasks**:
- [ ] Create `components/AdvancedSearchPanel.tsx`
- [ ] Implement filter chips UI for active filters
- [ ] Support date range filters
- [ ] Support multi-select filters (locations, departments, skills)
- [ ] Save filter presets per user
- [ ] URL-based filter state for shareable searches

**Filter Types**:
```typescript
interface SearchFilters {
  query: string;
  type?: ('expert' | 'skill' | 'course')[];
  locations?: string[];
  departments?: string[];
  skills?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  status?: string[];
  sortBy?: 'relevance' | 'name' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
```

**Files to Create**:
```
components/AdvancedSearchPanel.tsx
components/FilterChips.tsx
components/SavedFilters.tsx
```

**Estimated Effort**: 8-10 hours

---

#### 3.2 Fuzzy Search & Typo Tolerance
**Description**: Handle misspellings and similar terms using fuzzy matching.

**Tasks**:
- [ ] Implement Levenshtein distance algorithm for fuzzy matching
- [ ] Add phonetic matching (Soundex/Metaphone) for name searches
- [ ] Configure acceptable edit distance (1-2 characters)
- [ ] Show "Did you mean...?" suggestions for likely typos

**Implementation Options**:
1. PostgreSQL `pg_trgm` extension for trigram similarity
2. Custom fuzzy matching logic in application layer
3. Third-party search service (Algolia, Typesense, Meilisearch)

**Files to Create/Modify**:
```
lib/fuzzy-search.ts
app/api/search/route.ts (modify)
```

**Estimated Effort**: 6-8 hours

---

### Phase 4: User Experience Enhancements (Priority: Medium)

#### 4.1 Search History & Bookmarks
**Description**: Allow users to access recent searches and save favorite searches.

**Tasks**:
- [ ] Create database table for search history
- [ ] Store last 20 searches per user
- [ ] Implement "Recent Searches" dropdown
- [ ] Add ability to clear search history
- [ ] Implement search bookmarks/favorites

**Database Schema**:
```prisma
model SearchHistory {
  id          BigInt   @id @default(autoincrement())
  employeeId  BigInt   @map("employee_id")
  query       String   @db.VarChar(500)
  filters     Json?
  resultCount Int      @map("result_count")
  searchedAt  DateTime @default(now()) @map("searched_at")
  
  employee Employee @relation(fields: [employeeId], references: [employeeId])
  
  @@index([employeeId, searchedAt])
  @@map("search_history")
}

model SavedSearch {
  id          BigInt   @id @default(autoincrement())
  employeeId  BigInt   @map("employee_id")
  name        String   @db.VarChar(100)
  query       String   @db.VarChar(500)
  filters     Json?
  createdAt   DateTime @default(now()) @map("created_at")
  
  employee Employee @relation(fields: [employeeId], references: [employeeId])
  
  @@map("saved_searches")
}
```

**Files to Create**:
```
prisma/migrations/XXXXXX_add_search_history/migration.sql
app/api/search/history/route.ts
app/api/search/saved/route.ts
```

**Estimated Effort**: 6-8 hours

---

#### 4.2 Search Analytics Dashboard
**Description**: Track and display search analytics for admins.

**Tasks**:
- [ ] Create search analytics API endpoint
- [ ] Track popular search terms
- [ ] Track searches with no results (identify content gaps)
- [ ] Show search trends over time
- [ ] Add to management dashboard

**Metrics to Track**:
- Total searches per day/week/month
- Top 10 search queries
- Zero-result searches
- Search conversion rate (search → click)
- Average time to find result

**Files to Create**:
```
app/api/dashboard/search-analytics/route.ts
app/dashboard/components/SearchAnalytics.tsx
```

**Estimated Effort**: 6-8 hours

---

### Phase 5: Performance Optimization (Priority: Medium-High)

#### 5.1 Search Result Caching
**Description**: Implement caching layer for frequent searches.

**Tasks**:
- [ ] Add in-memory cache for search results (5-minute TTL)
- [ ] Implement cache invalidation on data changes
- [ ] Add cache-control headers for browser caching
- [ ] Consider Redis for distributed caching

**Implementation**:
```typescript
// lib/search-cache.ts
const searchCache = new Map<string, CacheEntry>();

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
  ttl: number;
}

export function getCachedSearch(key: string): SearchResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}
```

**Files to Create**:
```
lib/search-cache.ts
```

**Estimated Effort**: 4-6 hours

---

#### 5.2 Search Index Optimization
**Description**: Optimize database indexes for search queries.

**Tasks**:
- [ ] Analyze current query patterns with EXPLAIN ANALYZE
- [ ] Add composite indexes for common filter combinations
- [ ] Consider partial indexes for status-filtered searches
- [ ] Implement index-only scans where possible

**Indexes to Add**:
```sql
-- Composite index for expert search
CREATE INDEX idx_sme_search_composite ON sme_profiles(status) 
  WHERE status = 'APPROVED';

-- Composite index for course search
CREATE INDEX idx_course_search ON courses(is_published, scheduled_date) 
  WHERE is_published = true;

-- Partial index for active skills
CREATE INDEX idx_skills_active ON skills(skill_name) 
  WHERE is_active = true;
```

**Estimated Effort**: 4-6 hours

---

## Implementation Priority & Timeline

### High Priority (Week 1-2)
1. ✅ 1.1 Create Unified Search Component
2. ✅ 1.2 Global Search Implementation
3. ✅ 2.1 Full-Text Search with PostgreSQL

### Medium Priority (Week 3-4)
4. ✅ 2.2 Search Suggestions & Autocomplete
5. ✅ 5.1 Search Result Caching
6. ✅ 5.2 Search Index Optimization

### Lower Priority (Week 5-6)
7. ✅ 3.1 Advanced Search Filters
8. ✅ 3.2 Fuzzy Search & Typo Tolerance
9. ✅ 4.1 Search History & Bookmarks
10. ✅ 4.2 Search Analytics Dashboard

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Average search response time | ~500ms | <200ms |
| Search-to-click rate | Unknown | >40% |
| Zero-result searches | Unknown | <10% |
| User search satisfaction | Unknown | >4/5 stars |

---

## Technical Considerations

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with full-text search
- **Caching**: In-memory (Map) or Redis

### Dependencies to Consider
- `use-debounce` - Debounce hook (or custom implementation)
- `cmdk` - Command palette component (optional)
- `fuse.js` - Client-side fuzzy search (optional)

### Accessibility Requirements
- [ ] Keyboard navigation for all search features
- [ ] Screen reader announcements for results count
- [ ] Focus management when opening/closing search
- [ ] ARIA labels for search inputs
- [ ] High contrast mode support

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation | High | Medium | Implement caching, optimize indexes |
| Breaking existing functionality | High | Low | Comprehensive testing, feature flags |
| Database migration issues | Medium | Low | Test migrations on staging first |
| Poor search relevance | Medium | Medium | User testing, iterative tuning |

---

## Notes

- All search improvements should be backward compatible
- Consider A/B testing for major UI changes
- Monitor search performance in production
- Gather user feedback after each phase

---

*Document Created: February 6, 2026*
*Last Updated: February 6, 2026*
