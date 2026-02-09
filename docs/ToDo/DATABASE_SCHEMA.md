# SME Platform Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the SME (Subject Matter Expert) Platform, including how each model is used, current gaps, and suggestions for improvements.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Models](#core-models)
   - [Authentication Models](#authentication-models)
   - [Employee & Organization](#employee--organization)
   - [Roles & Authorization](#roles--authorization)
   - [Skill Taxonomy](#skill-taxonomy)
   - [SME Lifecycle](#sme-lifecycle)
   - [Endorsements](#endorsements)
   - [Certifications](#certifications)
   - [Courses & Trainings](#courses--trainings)
   - [Notifications](#notifications)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Current Usage Patterns](#current-usage-patterns)
5. [Missing Features in Schema](#missing-features-in-schema)
6. [Suggested Schema Additions](#suggested-schema-additions)

---

## Overview

The SME Platform uses **PostgreSQL** as its database with **Prisma ORM** for database access. The schema is designed to support:

- User authentication (via Better Auth)
- Employee management with organizational hierarchy
- Role-based access control
- Skills and expertise taxonomy
- SME profile management and nomination workflow
- Endorsement system for skill validation
- Course and training management
- Notification system

---

## Core Models

### Authentication Models

These models are managed by **Better Auth** for user authentication.

#### User
Primary authentication entity for the platform.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `email` | String | Unique email address |
| `name` | String? | Display name |
| `emailVerified` | Boolean | Email verification status |
| `image` | String? | Profile image URL |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Usage:** Stores authenticated user data. Linked to `Session` and `Account` models.

#### Session
Manages active user sessions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `token` | String | Session token (unique) |
| `expiresAt` | DateTime | Session expiry time |
| `userId` | String | Reference to User |
| `ipAddress` | String? | Client IP address |
| `userAgent` | String? | Browser/client info |

#### Account
OAuth provider accounts linked to users.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `providerId` | String | OAuth provider identifier |
| `accountId` | String | Provider account ID |
| `userId` | String | Reference to User |
| `accessToken` | String? | OAuth access token |
| `refreshToken` | String? | OAuth refresh token |
| `password` | String? | Hashed password (for email auth) |

#### Verification
Email/phone verification tokens.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `identifier` | String | Email/phone being verified |
| `value` | String | Verification token |
| `expiresAt` | DateTime | Token expiry time |

---

### Employee & Organization

#### Employee
Central entity representing organization members.

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | BigInt | Primary key (auto-increment) |
| `empNumber` | String | Unique employee number |
| `fullName` | String | Full name |
| `email` | String | Unique email address |
| `imageUrl` | String? | Profile picture URL |
| `position` | String? | Job title |
| `siteName` | String? | Work location |
| `departmentName` | String? | Department |
| `managerId` | BigInt? | Self-reference to manager |
| `isActive` | Boolean | Active status |

**Relations:**
- Self-referential: `manager` ↔ `subordinates`
- `roles` → EmployeeRole[]
- `smeProfile` → SmeProfile (1:1)
- `nominations` → SmeNomination[] (as nominee, TL, or coordinator)
- `endorsements` → Endorsement[]
- `notifications` → Notification[]
- `courseEnrollments` → CourseEnrollment[]

**Usage:**
- Core user data linked to auth User by email
- Used for displaying expert profiles, filtering by department/location
- Manager hierarchy supports organizational reporting

---

### Roles & Authorization

#### AppRole
Defines available roles in the system.

| Field | Type | Description |
|-------|------|-------------|
| `roleId` | BigInt | Primary key |
| `roleCode` | String | Unique role identifier (e.g., `TEAM_LEADER`, `COORDINATOR`) |
| `roleName` | String | Human-readable role name |

**Current Roles:**
- `TEAM_LEADER` - Can nominate team members as SMEs
- `COORDINATOR` - Department coordinator, approves nominations
- `ADMIN` - System administrator
- `SME` - Subject Matter Expert

#### EmployeeRole
Junction table for many-to-many Employee ↔ AppRole relationship.

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | BigInt | Reference to Employee |
| `roleId` | BigInt | Reference to AppRole |
| `assignedAt` | DateTime | Role assignment timestamp |

**Usage:** Controls access to features like nominations, dashboard views, and admin functions.

---

### Skill Taxonomy

#### SkillCategory
Groups related skills into categories.

| Field | Type | Description |
|-------|------|-------------|
| `categoryId` | BigInt | Primary key |
| `categoryName` | String | Unique category name |
| `description` | String? | Category description |
| `isActive` | Boolean | Active status |

#### Skill
Individual skills that SMEs can possess.

| Field | Type | Description |
|-------|------|-------------|
| `skillId` | BigInt | Primary key |
| `skillName` | String | Unique skill name |
| `categoryId` | BigInt? | Reference to SkillCategory |
| `description` | String? | Skill description |
| `imageUrl` | String? | Skill icon/image |
| `isActive` | Boolean | Active status |
| `createdBy` | BigInt? | Employee who created the skill |

**Usage:**
- `/api/skills` - Lists all skills with top experts
- Skills page displays skill cards with expert counts
- Used for filtering experts by skill

---

### SME Lifecycle

#### SmeProfile
Core SME profile linked to an Employee.

| Field | Type | Description |
|-------|------|-------------|
| `smeId` | BigInt | Primary key |
| `employeeId` | BigInt | Unique reference to Employee |
| `bio` | String? | SME biography |
| `languages` | String? | Languages spoken |
| `availability` | String? | Availability schedule |
| `status` | String | Profile status (`PENDING`, `APPROVED`, `REJECTED`) |
| `statusReason` | String? | Reason for status change |

**Relations:**
- `skills` → SmeSkill[]
- `certifications` → SmeCertification[]
- `courses` → Course[]

**Usage:**
- `/api/experts` - Lists approved SMEs with filtering
- Expert detail pages show full profile
- Status determines visibility in expert listings

#### SmeNomination
Tracks the nomination workflow for new SMEs.

| Field | Type | Description |
|-------|------|-------------|
| `nominationId` | BigInt | Primary key |
| `nomineeEmployeeId` | BigInt | Employee being nominated |
| `nominatedByTlId` | BigInt | Team Leader who nominated |
| `departmentName` | String? | Department for the nomination |
| `status` | String | Status (`SUBMITTED`, `APPROVED`, `REJECTED`) |
| `decisionByCoordId` | BigInt? | Coordinator who made decision |
| `decisionAt` | DateTime? | Decision timestamp |
| `decisionNote` | String? | Decision notes/comments |

**Usage:**
- `/api/nominations` - Team Leaders create nominations
- `/api/my-nomination` - Check own nomination status
- Workflow: TL nominates → Coordinator reviews → Approved/Rejected

#### DepartmentCoordinator
Maps coordinators to departments.

| Field | Type | Description |
|-------|------|-------------|
| `departmentName` | String | Department name (composite PK) |
| `employeeId` | BigInt | Coordinator employee (composite PK) |
| `assignedAt` | DateTime | Assignment timestamp |

---

### Endorsements

#### SmeSkill
Links SMEs to their skills with proficiency details.

| Field | Type | Description |
|-------|------|-------------|
| `smeSkillId` | BigInt | Primary key |
| `smeId` | BigInt | Reference to SmeProfile |
| `skillId` | BigInt | Reference to Skill |
| `proficiency` | String? | Level (e.g., `BEGINNER`, `INTERMEDIATE`, `EXPERT`) |
| `yearsExp` | Decimal? | Years of experience |
| `isActive` | Boolean | Active status |

#### Endorsement
Records when someone endorses an SME's skill.

| Field | Type | Description |
|-------|------|-------------|
| `endorsementId` | BigInt | Primary key |
| `smeSkillId` | BigInt | Reference to SmeSkill |
| `endorsedByEmployeeId` | BigInt | Employee who endorsed |
| `endorsedAt` | DateTime | Endorsement timestamp |
| `comment` | String? | Optional comment |

**Constraints:**
- Unique constraint prevents duplicate endorsements (same person, same skill)
- Self-endorsement is prevented in application logic

**Usage:**
- `/api/endorsements` - Create/remove endorsements
- Endorsement count displayed on SME profiles
- Used for ranking experts by popularity

---

### Certifications

#### SmeCertification
Stores SME certifications and credentials.

| Field | Type | Description |
|-------|------|-------------|
| `certificationId` | BigInt | Primary key |
| `smeId` | BigInt | Reference to SmeProfile |
| `title` | String | Certification name |
| `issuer` | String? | Issuing organization |
| `credentialId` | String? | Credential ID |
| `credentialUrl` | String? | Verification URL |
| `issuedDate` | Date? | Issue date |
| `expiryDate` | Date? | Expiry date |
| `fileUrl` | String? | Uploaded certificate file |

---

### Courses & Trainings

#### Course
Training courses offered by SMEs.

| Field | Type | Description |
|-------|------|-------------|
| `courseId` | BigInt | Primary key |
| `smeId` | BigInt | Reference to instructor (SmeProfile) |
| `title` | String | Course title |
| `description` | String? | Course description |
| `targetAudience` | String? | Intended audience |
| `durationMinutes` | Int? | Course duration |
| `deliveryMode` | String | Mode (`TEAMS`, `IN_PERSON`, `HYBRID`) |
| `materialsUrl` | String? | Course materials link |
| `scheduledDate` | DateTime? | Scheduled session date |
| `maxCapacity` | Int? | Maximum enrollment |
| `location` | String? | Physical location (if applicable) |
| `isPublished` | Boolean | Published status |

#### CourseEnrollment
Tracks employee enrollments in courses.

| Field | Type | Description |
|-------|------|-------------|
| `enrollmentId` | BigInt | Primary key |
| `courseId` | BigInt | Reference to Course |
| `employeeId` | BigInt | Reference to Employee |
| `status` | String | Status (`ENROLLED`, `COMPLETED`, `CANCELLED`, `WAITLISTED`) |
| `enrolledAt` | DateTime | Enrollment timestamp |
| `completedAt` | DateTime? | Completion timestamp |
| `cancelledAt` | DateTime? | Cancellation timestamp |
| `feedback` | String? | Course feedback |
| `rating` | Int? | Rating (1-5) |

**Usage:**
- `/api/courses` - List all published courses
- `/api/courses/[id]` - Course details
- `/api/courses/enrollments` - Manage enrollments

---

### Notifications

#### Notification
In-app notifications for users.

| Field | Type | Description |
|-------|------|-------------|
| `notificationId` | BigInt | Primary key |
| `employeeId` | BigInt | Recipient employee |
| `type` | String | Notification type |
| `title` | String | Notification title |
| `message` | String | Full message |
| `actionUrl` | String? | Link to related content |
| `relatedId` | BigInt? | Related entity ID |
| `isRead` | Boolean | Read status |

#### NotificationPreference
User notification settings.

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | BigInt | Primary key (1:1 with Employee) |
| `emailEnabled` | Boolean | Email notifications enabled |
| `inAppEnabled` | Boolean | In-app notifications enabled |
| `endorsements` | Boolean | Endorsement notifications |
| `nominations` | Boolean | Nomination notifications |
| `profileChanges` | Boolean | Profile change notifications |

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Account   │     │   Session   │
│  (auth)     │────▶│   (auth)    │     │   (auth)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ (linked by email)
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Employee   │────▶│ EmployeeRole│◀────│   AppRole   │
│             │     └─────────────┘     └─────────────┘
└─────────────┘
       │
       ├────────────┬────────────┬────────────┐
       ▼            ▼            ▼            ▼
┌─────────────┐┌───────────┐┌───────────┐┌───────────┐
│ SmeProfile  ││Endorsement││Notification││CourseEnroll│
└─────────────┘└───────────┘└───────────┘└───────────┘
       │
       ├────────────┬────────────┐
       ▼            ▼            ▼
┌─────────────┐┌───────────┐┌───────────┐
│  SmeSkill   ││SmeCertif. ││  Course   │
└─────────────┘└───────────┘└───────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│    Skill    │◀────│SkillCategory│
└─────────────┘     └─────────────┘
```

---

## Current Usage Patterns

### Expert Discovery
```typescript
// Fetch approved SMEs with skills and endorsements
prisma.smeProfile.findMany({
  where: { status: "APPROVED" },
  include: {
    employee: true,
    skills: { include: { skill: true, endorsements: true } },
    certifications: true
  }
});
```

### Nomination Workflow
```typescript
// Team Leader creates nomination
prisma.smeNomination.create({
  data: {
    nomineeEmployeeId: employeeId,
    nominatedByTlId: currentEmployeeId,
    departmentName: department
  }
});
```

### Endorsement System
```typescript
// Endorse an SME's skill (with duplicate prevention)
prisma.endorsement.create({
  data: {
    smeSkillId: skillId,
    endorsedByEmployeeId: endorserId
  }
});
```

### Course Management
```typescript
// Get upcoming courses with instructor info
prisma.course.findMany({
  where: { 
    isPublished: true,
    scheduledDate: { gte: new Date() }
  },
  include: { sme: { include: { employee: true } } }
});
```

---

## Missing Features in Schema

### 1. **No Skill Levels/Hierarchy**
- Skills are flat; no parent-child relationships
- Cannot represent "Cloud Architecture → AWS → Lambda"

### 2. **No Audit Trail**
- No logging of who changed what and when
- Critical for compliance and debugging

### 3. **No Activity/Interaction Tracking**
- No way to track SME consultations or help sessions
- Cannot measure SME impact or engagement

### 4. **Limited Search Capabilities**
- No full-text search indexes
- Searching relies on basic LIKE queries

### 5. **No Waitlist Management**
- Course has `maxCapacity` but no waitlist position tracking
- No automatic promotion from waitlist

### 6. **No SME Availability Calendar**
- `availability` is just a text field
- No structured booking/scheduling

### 7. **No Content/Resource Management**
- SMEs cannot share knowledge articles, documents, or videos
- Only courses are supported

### 8. **No Skill Assessment/Verification**
- No way to verify claimed proficiency
- Endorsements are subjective

### 9. **No Department/Team Model**
- `departmentName` is just a string
- No formal department entity with metadata

### 10. **No Skill Request/Gap Analysis**
- No way for employees to request new skills
- Cannot track organizational skill gaps

---

## Suggested Schema Additions

### 1. **SkillHierarchy - Support Skill Trees**

```prisma
model Skill {
  // ... existing fields
  parentSkillId BigInt? @map("parent_skill_id")
  parentSkill   Skill?  @relation("SkillHierarchy", fields: [parentSkillId], references: [skillId])
  childSkills   Skill[] @relation("SkillHierarchy")
  level         Int     @default(0) // 0 = root, 1 = sub-skill, etc.
}
```

### 2. **AuditLog - Track All Changes**

```prisma
model AuditLog {
  logId       BigInt   @id @default(autoincrement()) @map("log_id")
  tableName   String   @map("table_name") @db.VarChar(100)
  recordId    String   @map("record_id") @db.VarChar(100)
  action      String   @db.VarChar(20) // CREATE, UPDATE, DELETE
  oldValues   Json?    @map("old_values")
  newValues   Json?    @map("new_values")
  employeeId  BigInt?  @map("employee_id")
  ipAddress   String?  @map("ip_address") @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at")

  employee Employee? @relation(fields: [employeeId], references: [employeeId])

  @@index([tableName, recordId])
  @@index([employeeId])
  @@map("audit_logs")
}
```

### 3. **Consultation - Track SME Interactions**

```prisma
model Consultation {
  consultationId BigInt   @id @default(autoincrement()) @map("consultation_id")
  smeId          BigInt   @map("sme_id")
  requesterId    BigInt   @map("requester_id")
  skillId        BigInt?  @map("skill_id")
  topic          String   @db.VarChar(500)
  description    String?
  status         String   @default("REQUESTED") @db.VarChar(30) // REQUESTED, SCHEDULED, COMPLETED, CANCELLED
  scheduledAt    DateTime? @map("scheduled_at")
  completedAt    DateTime? @map("completed_at")
  durationMinutes Int?    @map("duration_minutes")
  rating         Int?     // 1-5
  feedback       String?
  createdAt      DateTime @default(now()) @map("created_at")

  sme       SmeProfile @relation(fields: [smeId], references: [smeId])
  requester Employee   @relation(fields: [requesterId], references: [employeeId])
  skill     Skill?     @relation(fields: [skillId], references: [skillId])

  @@index([smeId])
  @@index([requesterId])
  @@map("consultations")
}
```

### 4. **SmeAvailability - Structured Scheduling**

```prisma
model SmeAvailability {
  availabilityId BigInt   @id @default(autoincrement()) @map("availability_id")
  smeId          BigInt   @map("sme_id")
  dayOfWeek      Int      @map("day_of_week") // 0-6 (Sunday-Saturday)
  startTime      String   @map("start_time") @db.VarChar(5) // HH:MM
  endTime        String   @map("end_time") @db.VarChar(5)
  timezone       String   @default("UTC") @db.VarChar(50)
  isActive       Boolean  @default(true) @map("is_active")

  sme SmeProfile @relation(fields: [smeId], references: [smeId], onDelete: Cascade)

  @@unique([smeId, dayOfWeek, startTime])
  @@map("sme_availability")
}

model SmeTimeOff {
  timeOffId   BigInt   @id @default(autoincrement()) @map("time_off_id")
  smeId       BigInt   @map("sme_id")
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  reason      String?
  createdAt   DateTime @default(now()) @map("created_at")

  sme SmeProfile @relation(fields: [smeId], references: [smeId], onDelete: Cascade)

  @@map("sme_time_off")
}
```

### 5. **KnowledgeResource - Content Management**

```prisma
model KnowledgeResource {
  resourceId    BigInt   @id @default(autoincrement()) @map("resource_id")
  smeId         BigInt   @map("sme_id")
  title         String   @db.VarChar(250)
  description   String?
  resourceType  String   @map("resource_type") @db.VarChar(30) // ARTICLE, VIDEO, DOCUMENT, LINK
  contentUrl    String?  @map("content_url")
  content       String?  // For inline articles
  skillId       BigInt?  @map("skill_id")
  viewCount     Int      @default(0) @map("view_count")
  isPublished   Boolean  @default(false) @map("is_published")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  sme   SmeProfile @relation(fields: [smeId], references: [smeId], onDelete: Cascade)
  skill Skill?     @relation(fields: [skillId], references: [skillId])
  tags  ResourceTag[]

  @@index([skillId])
  @@map("knowledge_resources")
}

model ResourceTag {
  resourceId BigInt @map("resource_id")
  tag        String @db.VarChar(50)

  resource KnowledgeResource @relation(fields: [resourceId], references: [resourceId], onDelete: Cascade)

  @@id([resourceId, tag])
  @@map("resource_tags")
}
```

### 6. **Department - Formal Department Entity**

```prisma
model Department {
  departmentId   BigInt   @id @default(autoincrement()) @map("department_id")
  departmentCode String   @unique @map("department_code") @db.VarChar(50)
  departmentName String   @unique @map("department_name") @db.VarChar(200)
  description    String?
  parentDeptId   BigInt?  @map("parent_dept_id")
  headEmployeeId BigInt?  @map("head_employee_id")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  parentDept   Department?  @relation("DeptHierarchy", fields: [parentDeptId], references: [departmentId])
  childDepts   Department[] @relation("DeptHierarchy")
  head         Employee?    @relation(fields: [headEmployeeId], references: [employeeId])
  employees    Employee[]
  coordinators DepartmentCoordinator[]

  @@map("departments")
}
```

### 7. **SkillRequest - Track Skill Gaps**

```prisma
model SkillRequest {
  requestId      BigInt   @id @default(autoincrement()) @map("request_id")
  skillName      String   @map("skill_name") @db.VarChar(200)
  description    String?
  businessNeed   String?  @map("business_need")
  requesterId    BigInt   @map("requester_id")
  status         String   @default("PENDING") @db.VarChar(30) // PENDING, APPROVED, REJECTED
  approvedSkillId BigInt? @map("approved_skill_id")
  reviewedById   BigInt?  @map("reviewed_by_id")
  reviewedAt     DateTime? @map("reviewed_at")
  createdAt      DateTime @default(now()) @map("created_at")

  requester    Employee @relation("SkillRequester", fields: [requesterId], references: [employeeId])
  reviewedBy   Employee? @relation("SkillReviewer", fields: [reviewedById], references: [employeeId])
  approvedSkill Skill?  @relation(fields: [approvedSkillId], references: [skillId])

  @@map("skill_requests")
}
```

### 8. **SkillAssessment - Verify Proficiency**

```prisma
model SkillAssessment {
  assessmentId   BigInt   @id @default(autoincrement()) @map("assessment_id")
  smeSkillId     BigInt   @map("sme_skill_id")
  assessorId     BigInt   @map("assessor_id")
  assessmentType String   @map("assessment_type") @db.VarChar(30) // SELF, PEER, MANAGER, EXTERNAL
  score          Int?     // 1-100
  proficiencyLevel String? @map("proficiency_level") @db.VarChar(30)
  notes          String?
  evidenceUrl    String?  @map("evidence_url")
  assessedAt     DateTime @default(now()) @map("assessed_at")

  smeSkill SmeSkill @relation(fields: [smeSkillId], references: [smeSkillId], onDelete: Cascade)
  assessor Employee @relation(fields: [assessorId], references: [employeeId])

  @@map("skill_assessments")
}
```

### 9. **CourseWaitlist - Proper Waitlist Management**

```prisma
model CourseWaitlist {
  waitlistId   BigInt   @id @default(autoincrement()) @map("waitlist_id")
  courseId     BigInt   @map("course_id")
  employeeId   BigInt   @map("employee_id")
  position     Int      // Position in waitlist queue
  addedAt      DateTime @default(now()) @map("added_at")
  notifiedAt   DateTime? @map("notified_at")
  expiresAt    DateTime? @map("expires_at")

  course   Course   @relation(fields: [courseId], references: [courseId], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [employeeId], onDelete: Cascade)

  @@unique([courseId, employeeId])
  @@index([courseId, position])
  @@map("course_waitlist")
}
```

### 10. **Full-Text Search Enhancement**

For PostgreSQL, add these indexes to improve search performance:

```sql
-- Add after migration
CREATE INDEX idx_employee_fulltext ON employees USING gin(to_tsvector('english', full_name || ' ' || COALESCE(position, '')));
CREATE INDEX idx_skill_fulltext ON skills USING gin(to_tsvector('english', skill_name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_course_fulltext ON courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

## Priority Recommendations

| Priority | Addition | Business Value |
|----------|----------|----------------|
| 🔴 High | AuditLog | Compliance, debugging, security |
| 🔴 High | Consultation | Track SME impact & utilization |
| 🟡 Medium | Department entity | Clean data model, reporting |
| 🟡 Medium | KnowledgeResource | Knowledge sharing beyond courses |
| 🟡 Medium | SmeAvailability | Enable scheduling features |
| 🟢 Low | SkillHierarchy | Better skill organization |
| 🟢 Low | SkillAssessment | Skill verification |
| 🟢 Low | CourseWaitlist | Better enrollment UX |

---

## Migration Notes

When implementing these additions:

1. **Audit Log** can be implemented using Prisma middleware or database triggers
2. **Department migration** requires updating existing `departmentName` string fields to FK references
3. **Full-text search** requires raw SQL and custom migration scripts
4. Consider backward compatibility when modifying existing tables

---

*Last updated: February 2026*
