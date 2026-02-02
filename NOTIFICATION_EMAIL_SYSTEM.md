# Notification & Email System Documentation

This document provides a comprehensive overview of the notification and email system in the SME Directory application.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Notification Types](#notification-types)
5. [API Endpoints](#api-endpoints)
6. [Core Library Functions](#core-library-functions)
7. [Email System](#email-system)
8. [User Preferences](#user-preferences)
9. [Frontend Components](#frontend-components)
10. [Flow Diagrams](#flow-diagrams)
11. [Configuration](#configuration)

---

## Overview

The notification system provides a dual-channel approach for keeping users informed:

- **In-App Notifications**: Real-time notifications displayed via a notification bell in the header
- **Email Notifications**: Rich HTML emails sent via SMTP (internal relay server)

Users can control their notification preferences to enable/disable either channel and filter by notification type.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Trigger       │────▶│  notifications.ts    │────▶│   Database      │
│   (Endorsement) │     │  (Core Library)      │     │   (Prisma)      │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐     ┌─────────────────┐
                        │     email.ts         │────▶│  SMTP Server    │
                        │  (Email Service)     │     │  (Internal)     │
                        └──────────────────────┘     └─────────────────┘
```

### Key Components:

| Component | Location | Purpose |
|-----------|----------|---------|
| `notifications.ts` | `/lib/notifications.ts` | Core notification logic |
| `email.ts` | `/lib/email.ts` | Email generation & sending |
| Notification API | `/app/api/notifications/` | REST API endpoints |
| NotificationBell | `/components/NotificationBell.tsx` | Header notification popup |
| Notifications Page | `/app/notifications/page.tsx` | Full notifications list |
| Preferences Page | `/app/notifications/preferences/page.tsx` | User settings |

---

## Database Schema

### Notification Model

```prisma
model Notification {
  notificationId BigInt   @id @default(autoincrement())
  employeeId     BigInt   // Recipient employee
  type           String   // Notification type (e.g., "ENDORSEMENT")
  title          String   // Short title
  message        String   // Full message content
  actionUrl      String?  // Optional URL for click action
  relatedId      BigInt?  // Related entity ID (e.g., endorsementId)
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())

  employee Employee @relation(...)
}
```

**Indexes:**
- `(employeeId, isRead)` - For efficient unread count queries
- `(createdAt)` - For chronological ordering

### NotificationPreference Model

```prisma
model NotificationPreference {
  employeeId     BigInt  @id
  emailEnabled   Boolean @default(true)   // Master email toggle
  inAppEnabled   Boolean @default(true)   // Master in-app toggle
  endorsements   Boolean @default(true)   // Endorsement notifications
  nominations    Boolean @default(true)   // Nomination notifications
  profileChanges Boolean @default(true)   // Profile status changes

  employee Employee @relation(...)
}
```

---

## Notification Types

The system supports the following notification types:

| Type | Icon | Description |
|------|------|-------------|
| `ENDORSEMENT` | 👍 | When someone endorses your skill |
| `NOMINATION` | ⭐ | When you receive a nomination |
| `NOMINATION_DECISION` | ✅ | When your nomination is approved/rejected |
| `PROFILE_ACTIVATED` | 🎉 | When your SME profile becomes active |
| `PROFILE_DEACTIVATED` | ⏸️ | When your SME profile is deactivated |
| `NEW_SME_IN_DEPT` | 👋 | When a new SME joins your department |

```typescript
export type NotificationType =
  | "ENDORSEMENT"
  | "NOMINATION"
  | "NOMINATION_DECISION"
  | "PROFILE_ACTIVATED"
  | "PROFILE_DEACTIVATED"
  | "NEW_SME_IN_DEPT";
```

---

## API Endpoints

### GET `/api/notifications`

Fetch paginated notifications for the authenticated user.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `unreadOnly` | boolean | false | Filter unread only |
| `type` | string | - | Filter by notification type |

**Response:**
```json
{
  "notifications": [
    {
      "notificationId": "123",
      "type": "ENDORSEMENT",
      "title": "New endorsement for React",
      "message": "John Doe endorsed your skill...",
      "actionUrl": "/experts/456",
      "isRead": false,
      "createdAt": "2026-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### PATCH `/api/notifications`

Mark all notifications as read for the authenticated user.

**Response:**
```json
{
  "success": true,
  "updatedCount": 5
}
```

### GET `/api/notifications/unread-count`

Get the count of unread notifications.

**Response:**
```json
{
  "count": 5
}
```

### PATCH `/api/notifications/[id]`

Mark a specific notification as read.

**Response:**
```json
{
  "success": true
}
```

### DELETE `/api/notifications/[id]`

Delete a specific notification.

**Response:**
```json
{
  "success": true
}
```

### GET `/api/notifications/preferences`

Get user notification preferences.

**Response:**
```json
{
  "employeeId": "123",
  "emailEnabled": true,
  "inAppEnabled": true,
  "endorsements": true,
  "nominations": true,
  "profileChanges": true
}
```

### PUT `/api/notifications/preferences`

Update user notification preferences.

**Request Body:**
```json
{
  "emailEnabled": true,
  "inAppEnabled": true,
  "endorsements": true,
  "nominations": false,
  "profileChanges": true
}
```

---

## Core Library Functions

### `lib/notifications.ts`

#### `createNotification(params)`

Creates a basic in-app notification.

```typescript
interface CreateNotificationParams {
  employeeId: bigint;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: bigint;
}

await createNotification({
  employeeId: BigInt(123),
  type: "ENDORSEMENT",
  title: "New endorsement for React",
  message: "John Doe endorsed your skill...",
  actionUrl: "/experts/456",
  relatedId: BigInt(789),
});
```

#### `getUserPreferences(employeeId)`

Fetches user notification preferences, creating defaults if none exist.

```typescript
const preferences = await getUserPreferences(BigInt(123));
// Returns: { emailEnabled, inAppEnabled, endorsements, nominations, profileChanges }
```

#### `createEndorsementNotification(params)`

High-level function that creates both in-app and email notifications for endorsements (respecting user preferences).

```typescript
interface EndorsementNotificationParams {
  smeEmployeeId: bigint;
  endorserName: string;
  endorserPosition?: string | null;
  skillName: string;
  endorsementId: bigint;
  comment?: string | null;
}

await createEndorsementNotification({
  smeEmployeeId: BigInt(123),
  endorserName: "John Doe",
  endorserPosition: "Senior Developer",
  skillName: "React",
  endorsementId: BigInt(456),
  comment: "Great expertise!",
});
```

---

## Email System

### `lib/email.ts`

The email system uses **nodemailer** with SMTP transport for email delivery via your organization's internal relay server.

#### `sendNotificationEmail(params)`

Sends a formatted notification email via SMTP.

```typescript
interface SendEmailParams {
  to: string;
  recipientName: string;
  subject: string;
  type: "ENDORSEMENT";
  data: EndorsementEmailData;
}

await sendNotificationEmail({
  to: "user@example.com",
  recipientName: "Jane Smith",
  subject: "New endorsement for React",
  type: "ENDORSEMENT",
  data: {
    smeName: "Jane Smith",
    endorserName: "John Doe",
    endorserPosition: "Senior Developer",
    skillName: "React",
    comment: "Great work!",
    profileUrl: "https://app.example.com/experts/123",
    preferencesUrl: "https://app.example.com/notifications/preferences",
  },
});
```

### Email Template Features

- **Responsive HTML**: Works on all email clients
- **Plain Text Fallback**: For clients that don't support HTML
- **Branded Header**: Gradient purple/blue header with emoji
- **Comment Box**: Styled quote block for endorser comments
- **CTA Button**: "View Your Profile" button
- **Footer Links**: Manage email preferences link

### Email Template Preview

```
┌─────────────────────────────────────────────────┐
│       🎉 New Endorsement Received!              │ (Header)
├─────────────────────────────────────────────────┤
│                                                 │
│  Hi Jane Smith,                                 │
│                                                 │
│  John Doe (Senior Developer) just endorsed     │
│  your skill in React!                          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Comment                                  │   │
│  │ "Great work!"                           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│          [ View Your Profile ]                  │
│                                                 │
├─────────────────────────────────────────────────┤
│  SME Directory - Learning Hub & Expert Network  │
│  Manage email preferences                       │
└─────────────────────────────────────────────────┘
```

---

## User Preferences

### Preference Options

| Preference | Description |
|------------|-------------|
| **Email Enabled** | Master toggle for all email notifications |
| **In-App Enabled** | Master toggle for all in-app notifications |
| **Endorsements** | Notifications when skills are endorsed |
| **Nominations** | Notifications for nomination events |
| **Profile Changes** | Notifications for profile status changes |

### Default Preferences

When a user has no preferences stored, the system creates defaults with all options enabled:

```typescript
{
  emailEnabled: true,
  inAppEnabled: true,
  endorsements: true,
  nominations: true,
  profileChanges: true,
}
```

### Preference Logic Flow

```
User Preferences Check
         │
         ▼
┌─────────────────────┐
│ Is inAppEnabled?    │──No──▶ Skip in-app
└─────────────────────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Is type enabled?    │──No──▶ Skip in-app
│ (e.g., endorsements)│
└─────────────────────┘
         │ Yes
         ▼
   Create In-App Notification
         │
         ▼
┌─────────────────────┐
│ Is emailEnabled?    │──No──▶ Skip email
└─────────────────────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Is type enabled?    │──No──▶ Skip email
│ (e.g., endorsements)│
└─────────────────────┘
         │ Yes
         ▼
   Send Email Notification
```

---

## Frontend Components

### NotificationBell Component

**Location:** `/components/NotificationBell.tsx`

A header component that displays:
- Bell icon with unread count badge
- Popover with recent notifications (last 10)
- Quick access to view all notifications

**Features:**
- Polls for unread count every 30 seconds
- Lazy loads notifications on popover open
- Click to mark as read and navigate
- Relative time formatting (e.g., "5m ago")

### Notifications Page

**Location:** `/app/notifications/page.tsx`

A full page listing all notifications with:
- Filter by All / Unread
- Group by date (Today, Yesterday, This Week, Older)
- Mark all as read functionality
- Delete individual notifications
- Pagination support

### Preferences Page

**Location:** `/app/notifications/preferences/page.tsx`

Settings page allowing users to:
- Toggle email notifications on/off
- Toggle in-app notifications on/off
- Enable/disable specific notification types
- Auto-save with success feedback

---

## Flow Diagrams

### Endorsement Notification Flow

```
User A endorses User B's skill
            │
            ▼
┌─────────────────────────────┐
│  POST /api/endorsements     │
│  (Create endorsement)       │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│  createEndorsementNotification()  │
└─────────────────────────────┘
            │
            ├────────────────────────────┐
            ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Check User Prefs    │     │ Fetch SME Details   │
└─────────────────────┘     └─────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│ If inApp & endorsements    │ Build notification │
│ enabled → Create          │ message content     │
│ Notification record       │                     │
└─────────────────────┘     └─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ If email & endorsements   │
│ enabled → Send email via  │
│ SMTP relay                │
└─────────────────────┘
            │
            ▼
      User B receives notification
      (bell badge updates, email arrives)
```

### Notification Read Flow

```
User clicks notification in bell popover
            │
            ▼
┌─────────────────────────────┐
│  PATCH /api/notifications/[id]  │
└─────────────────────────────┘
            │
            ├────────────────────────────┐
            ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Update isRead=true  │     │ Update local state  │
│ in database         │     │ (optimistic UI)     │
└─────────────────────┘     └─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ If actionUrl exists │
│ → Navigate to URL   │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ Re-fetch unread     │
│ count (update badge)│
└─────────────────────┘
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | `localhost` | SMTP relay server hostname |
| `SMTP_PORT` | No | `25` | SMTP port (25, 465, or 587) |
| `SMTP_SECURE` | No | `false` | Set to `true` for SSL (port 465) |
| `SMTP_USER` | No | - | SMTP username (if auth required) |
| `SMTP_PASS` | No | - | SMTP password (if auth required) |
| `NOTIFICATION_FROM_EMAIL` | No | `noreply@yourdomain.com` | Sender email address |
| `APP_URL` | No | `http://localhost:3000` | Base URL for email links |

### Setup Instructions

1. **Get SMTP Server Details**: Contact your IT department to obtain the internal SMTP relay server hostname and port.

2. **Determine Authentication**: Check if your relay requires authentication or allows unauthenticated relay from internal IPs.

3. **Environment Setup**:
   ```bash
   # .env
   
   # SMTP Configuration (configure for your work environment)
   SMTP_HOST=smtp.yourcompany.com      # Your internal relay server
   SMTP_PORT=25                          # Common ports: 25, 465 (SSL), 587 (STARTTLS)
   SMTP_SECURE=false                     # Set to "true" for port 465
   # SMTP_USER=                          # Uncomment if auth required
   # SMTP_PASS=                          # Uncomment if auth required
   
   # Email Settings
   NOTIFICATION_FROM_EMAIL=sme-notifications@yourcompany.com
   APP_URL=https://sme.yourcompany.com
   ```

4. **Test Connection**: After configuration, test by triggering an endorsement notification and checking server logs.

### Graceful Degradation

The email system gracefully handles missing configuration:
- If `SMTP_HOST` is not set, emails are skipped with a warning log
- Notification creation failures don't break the primary action (e.g., endorsement still succeeds)
- All notification-related errors are caught and logged without throwing

---

## Adding New Notification Types

To add a new notification type:

1. **Add type to `NotificationType`** in `lib/notifications.ts`:
   ```typescript
   export type NotificationType =
     | "ENDORSEMENT"
     | "NEW_TYPE" // Add here
     // ...
   ```

2. **Create a helper function** (optional but recommended):
   ```typescript
   export async function createNewTypeNotification(params: NewTypeParams): Promise<void> {
     const preferences = await getUserPreferences(params.employeeId);
     
     if (preferences.inAppEnabled && preferences.relevantPreference) {
       await createNotification({
         employeeId: params.employeeId,
         type: "NEW_TYPE",
         title: "...",
         message: "...",
       });
     }
     
     if (preferences.emailEnabled && preferences.relevantPreference) {
       // Add email template in email.ts
       await sendNotificationEmail({ ... });
     }
   }
   ```

3. **Add icon mapping** in frontend components:
   ```typescript
   const getNotificationIcon = (type: string) => {
     switch (type) {
       case "NEW_TYPE":
         return "🆕";
       // ...
     }
   };
   ```

4. **Add email template** in `lib/email.ts` if email notifications are needed.

---

## Security Considerations

- **Authentication**: All notification endpoints require authenticated sessions
- **Authorization**: Users can only access their own notifications
- **Validation**: Notification IDs are validated to belong to the requesting user
- **Rate Limiting**: Consider implementing rate limiting for production (not currently implemented)
- **Sanitization**: User-generated content (comments) should be sanitized before display

---

## Performance Considerations

- **Polling Interval**: Unread count polls every 30 seconds (configurable)
- **Lazy Loading**: Notifications only load when popover opens
- **Pagination**: Large notification lists are paginated (20 per page)
- **Database Indexes**: Optimized indexes on `(employeeId, isRead)` and `createdAt`
- **Async Operations**: Email sending is non-blocking and won't slow down the main action

---

## Troubleshooting

### Emails not being sent

1. Check if `SMTP_HOST` is configured in environment variables
2. Verify the SMTP server is reachable from your application server
3. Check server logs for "SMTP_HOST not configured" warning or connection errors
4. Ensure user has `emailEnabled` and type-specific preference enabled
5. If using authentication, verify `SMTP_USER` and `SMTP_PASS` are correct
6. Check if your relay allows sending from the configured `NOTIFICATION_FROM_EMAIL` address

### Notifications not appearing

1. Verify user is authenticated
2. Check if `inAppEnabled` preference is true
3. Check if type-specific preference is enabled
4. Verify the notification creation didn't throw (check server logs)

### Badge count not updating

1. Check network requests to `/api/notifications/unread-count`
2. Verify 30-second polling interval is working
3. Check for JavaScript errors in console
