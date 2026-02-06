# Deployment & Data Synchronization Guide

This document outlines the changes required when deploying this SME (Subject Matter Expert) application from a local development environment to your workplace server, with a focus on setting up automated employee data synchronization.

---

## Table of Contents

1. [Overview](#overview)
2. [Current Architecture](#current-architecture)
3. [Deployment Changes Required](#deployment-changes-required)
4. [Employee Data Sync Implementation](#employee-data-sync-implementation)
5. [Team Responsibilities](#team-responsibilities)
6. [Security Considerations](#security-considerations)
7. [Timeline & Checklist](#timeline--checklist)

---

## Overview

### What You're Trying to Achieve
- Deploy the SME application on an internal workplace server
- Automatically sync employee data from your HR/corporate database daily at 6:00 PM
- Keep the `employees` table up-to-date with the latest organizational data

### Current State
- Running locally with a PostgreSQL database
- Employee data is seeded manually via `prisma/seed.ts`
- No external data source integration

### Target State
- Running on internal server
- Connected to workplace PostgreSQL database
- Automated daily sync from HR/ERP system to populate employee data

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐        ┌──────────────────┐              │
│   │  Next.js    │───────▶│  PostgreSQL DB   │              │
│   │  Application│        │  (Local)         │              │
│   └─────────────┘        └──────────────────┘              │
│                                                             │
│   Employee data: Manual seed via prisma/seed.ts             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Changes Required

### 1. Environment Configuration

**File to Update: `.env` (create for production)**

```env
# Database Connection
DATABASE_URL="postgresql://username:password@your-db-server:5432/sme_database?schema=public"

# Application
NEXT_PUBLIC_APP_URL="https://your-internal-domain.company.com"
NODE_ENV="production"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-secure-secret-key-here"
BETTER_AUTH_URL="https://your-internal-domain.company.com"

# HR Data Source (for employee sync)
HR_API_URL="https://hr-system.company.com/api"
HR_API_KEY="your-hr-api-key"

# OR if using direct database connection to HR system
HR_DATABASE_URL="postgresql://readonly_user:password@hr-db-server:5432/hr_database"

# Email Configuration (for notifications)
SMTP_HOST="smtp.company.com"
SMTP_PORT="587"
SMTP_USER="sme-app@company.com"
SMTP_PASSWORD="email-password"
```

### 2. Database Changes

| Change | Local | Production |
|--------|-------|------------|
| Database Host | `localhost` | Internal DB Server |
| Database Name | `sme_dev` | `sme_production` |
| Connection Pool | Default | Optimized for production |
| SSL | Disabled | **Enabled** |

**Update `lib/prisma.ts` for production:**

```typescript
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const pool = new Pool({ 
    connectionString,
    // Production optimizations
    max: 20,                    // Maximum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Connection timeout
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
  })
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}
```

### 3. Server Configuration

You'll need to set up the application server:

```bash
# Install Node.js 18+ on the server
# Clone/Deploy the application
# Install dependencies
npm install

# Build for production
npm run build

# Run database migrations
npx prisma migrate deploy

# Start the application (use PM2 or similar)
pm2 start npm --name "sme-app" -- start
```

---

## Employee Data Sync Implementation

### Architecture for Employee Sync

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ENVIRONMENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐                              ┌──────────────────┐    │
│   │  HR/ERP System  │                              │   SME Database   │    │
│   │  (Data Source)  │                              │   (PostgreSQL)   │    │
│   └────────┬────────┘                              └────────▲─────────┘    │
│            │                                                 │              │
│            │  Option A: API                                  │              │
│            ▼                                                 │              │
│   ┌─────────────────┐      ┌─────────────────┐              │              │
│   │  HR API Layer   │─────▶│  Sync Service   │──────────────┘              │
│   │  (REST/GraphQL) │      │  (Scheduled)    │                             │
│   └─────────────────┘      └─────────────────┘                             │
│                                    │                                        │
│            OR                      │ Runs daily at 6:00 PM                  │
│                                    ▼                                        │
│   ┌─────────────────┐      ┌─────────────────┐                             │
│   │  HR Database    │─────▶│  ETL Process    │                             │
│   │  (Read-Only)    │      │  (Direct SQL)   │                             │
│   └─────────────────┘      └─────────────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Option A: API-Based Sync (Recommended)

**Create: `scripts/sync-employees.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

interface HREmployee {
  employee_id: string;
  emp_number: string;
  full_name: string;
  email: string;
  position: string;
  site_name: string;
  department_name: string;
  manager_id: string | null;
  is_active: boolean;
  image_url?: string;
}

async function syncEmployeesFromHR() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`[${new Date().toISOString()}] Starting employee sync...`);

  try {
    // Fetch employees from HR API
    const response = await fetch(process.env.HR_API_URL + '/employees', {
      headers: {
        'Authorization': `Bearer ${process.env.HR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HR API error: ${response.status}`);
    }

    const hrEmployees: HREmployee[] = await response.json();
    console.log(`Fetched ${hrEmployees.length} employees from HR system`);

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    // Get all current employee IDs for deactivation check
    const currentEmpNumbers = new Set(hrEmployees.map(e => e.emp_number));

    // Upsert each employee
    for (const hrEmp of hrEmployees) {
      const existingEmployee = await prisma.employee.findUnique({
        where: { empNumber: hrEmp.emp_number }
      });

      const employeeData = {
        empNumber: hrEmp.emp_number,
        fullName: hrEmp.full_name,
        email: hrEmp.email,
        position: hrEmp.position,
        siteName: hrEmp.site_name,
        departmentName: hrEmp.department_name,
        isActive: hrEmp.is_active,
        imageUrl: hrEmp.image_url || null,
        // Manager linking happens in a second pass
      };

      if (existingEmployee) {
        await prisma.employee.update({
          where: { empNumber: hrEmp.emp_number },
          data: employeeData
        });
        updated++;
      } else {
        await prisma.employee.create({
          data: employeeData
        });
        created++;
      }
    }

    // Deactivate employees no longer in HR system
    const deactivatedResult = await prisma.employee.updateMany({
      where: {
        empNumber: { notIn: Array.from(currentEmpNumbers) },
        isActive: true
      },
      data: { isActive: false }
    });
    deactivated = deactivatedResult.count;

    // Second pass: Link managers
    for (const hrEmp of hrEmployees) {
      if (hrEmp.manager_id) {
        const manager = await prisma.employee.findFirst({
          where: { empNumber: hrEmp.manager_id }
        });
        if (manager) {
          await prisma.employee.update({
            where: { empNumber: hrEmp.emp_number },
            data: { managerId: manager.employeeId }
          });
        }
      }
    }

    console.log(`Sync complete: ${created} created, ${updated} updated, ${deactivated} deactivated`);

  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run if called directly
syncEmployeesFromHR();
```

### Option B: Direct Database Sync

If your HR team provides direct database access:

**Create: `scripts/sync-employees-db.ts`**

```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function syncFromHRDatabase() {
  // SME Application Database
  const smePool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(smePool);
  const prisma = new PrismaClient({ adapter });

  // HR Database (read-only connection)
  const hrPool = new Pool({ connectionString: process.env.HR_DATABASE_URL });

  try {
    console.log(`[${new Date().toISOString()}] Starting database sync...`);

    // Query HR database directly
    const hrResult = await hrPool.query(`
      SELECT 
        employee_id,
        emp_number,
        full_name,
        email,
        position,
        site_name,
        department_name,
        manager_emp_number,
        is_active,
        photo_url
      FROM employees
      WHERE last_modified > NOW() - INTERVAL '1 day'
         OR created_at > NOW() - INTERVAL '1 day'
    `);

    console.log(`Found ${hrResult.rows.length} employees to sync`);

    // Process each employee...
    // (Similar upsert logic as Option A)

  } finally {
    await prisma.$disconnect();
    await smePool.end();
    await hrPool.end();
  }
}

syncFromHRDatabase();
```

### Scheduling the Sync (6:00 PM Daily)

**Option 1: Using Cron (Linux Server)**

```bash
# Edit crontab
crontab -e

# Add this line (runs at 6:00 PM every day)
0 18 * * * cd /path/to/sme-app && /usr/bin/node scripts/sync-employees.js >> /var/log/sme-sync.log 2>&1
```

**Option 2: Using node-cron (Within Application)**

**Create: `scripts/scheduler.ts`**

```typescript
import cron from 'node-cron';
import { syncEmployeesFromHR } from './sync-employees';

// Schedule for 6:00 PM every day
cron.schedule('0 18 * * *', async () => {
  console.log('Starting scheduled employee sync...');
  try {
    await syncEmployeesFromHR();
    console.log('Scheduled sync completed successfully');
  } catch (error) {
    console.error('Scheduled sync failed:', error);
    // Send alert notification
  }
}, {
  timezone: "Asia/Riyadh" // Adjust to your timezone
});

console.log('Employee sync scheduler started. Next run at 6:00 PM');
```

**Option 3: Using Windows Task Scheduler**

If deploying on Windows Server, create a scheduled task that runs:
```powershell
node C:\path\to\sme-app\scripts\sync-employees.js
```

---

## Team Responsibilities

### 🔵 Your Team (Development/Application)

| Task | Description | Priority |
|------|-------------|----------|
| Create sync scripts | Develop `scripts/sync-employees.ts` based on HR data format | High |
| API integration | Build connector to HR API or database | High |
| Error handling | Implement retry logic, notifications on failure | High |
| Logging | Set up sync logs for monitoring | Medium |
| Testing | Test sync with sample HR data | High |
| Documentation | Document the sync process | Medium |

### 🟢 Database Team (DBA)

| Task | Description | Priority |
|------|-------------|----------|
| Create production database | Set up `sme_production` PostgreSQL database | High |
| User credentials | Create database user with appropriate permissions | High |
| Connection string | Provide secure connection string | High |
| Backup strategy | Set up automated backups | High |
| Read-only HR access | If using Option B, provide read-only access to HR database | Medium |
| Performance tuning | Optimize for production workload | Medium |

**Required Database Permissions:**
```sql
-- For SME application database
GRANT ALL PRIVILEGES ON DATABASE sme_production TO sme_app_user;

-- For HR database (read-only)
GRANT SELECT ON employees TO sme_sync_user;
```

### 🟡 Network Team

| Task | Description | Priority |
|------|-------------|----------|
| Internal DNS | Set up internal domain (e.g., `sme.company.com`) | High |
| Firewall rules | Allow traffic on port 3000 (or your chosen port) | High |
| SSL certificate | Obtain and install SSL certificate | High |
| Load balancer | Configure if high availability is needed | Medium |
| API access | Enable outbound access to HR API if external | Medium |

**Required Firewall Rules:**
```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Users       │──443──▶│  SME Server  │──5432─▶│  PostgreSQL  │
│  (Intranet)  │        │  (App)       │        │  (DB Server) │
└──────────────┘        └──────────────┘        └──────────────┘
                               │
                               │ 443/HTTPS (if HR API is external)
                               ▼
                        ┌──────────────┐
                        │  HR API      │
                        │  Server      │
                        └──────────────┘
```

### 🟠 HR/IT Systems Team

| Task | Description | Priority |
|------|-------------|----------|
| Data source access | Provide API access or database read permissions | High |
| API documentation | Share HR API documentation (endpoints, auth) | High |
| Data mapping | Confirm field mappings between HR and SME systems | High |
| Data refresh schedule | Confirm when HR data is updated | Medium |
| Sample data | Provide sample employee data for testing | Medium |

**Required Employee Data Fields:**
```json
{
  "emp_number": "EMP001",        // Unique employee ID
  "full_name": "John Smith",     // Full name
  "email": "john.smith@co.com",  // Email (unique)
  "position": "Software Engineer",
  "site_name": "HQ Building",
  "department_name": "IT",
  "manager_emp_number": "EMP000", // Manager's employee number
  "is_active": true,             // Active status
  "image_url": "https://..."     // Optional profile photo
}
```

### 🔴 Security Team

| Task | Description | Priority |
|------|-------------|----------|
| Security review | Review application security | High |
| API key management | Secure storage for HR API keys | High |
| Access control | Define who can access the application | High |
| Audit logging | Review logging for compliance | Medium |
| Penetration testing | If required by policy | Medium |

---

## Security Considerations

### 1. Environment Variables
- **NEVER** commit `.env` files to version control
- Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.)
- Rotate API keys periodically

### 2. Database Security
```sql
-- Use SSL connections
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

-- Limit database user permissions
REVOKE ALL ON DATABASE sme_production FROM PUBLIC;
GRANT CONNECT ON DATABASE sme_production TO sme_app_user;
GRANT USAGE ON SCHEMA public TO sme_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sme_app_user;
```

### 3. Network Security
- Use HTTPS only (redirect HTTP to HTTPS)
- Restrict database access to application server IP only
- Use VPN if accessing from outside the office

### 4. Authentication
- The app uses Better Auth for user authentication
- Consider integrating with corporate SSO (Active Directory, Okta, etc.)

---

## Timeline & Checklist

### Phase 1: Infrastructure Setup (Week 1-2)

- [ ] **Network Team**: Set up internal DNS and SSL certificate
- [ ] **Database Team**: Create production PostgreSQL database
- [ ] **Database Team**: Create database user and provide credentials
- [ ] **Network Team**: Configure firewall rules
- [ ] **Your Team**: Prepare production environment variables

### Phase 2: HR Integration Setup (Week 2-3)

- [ ] **HR Team**: Provide API access/documentation OR database read access
- [ ] **HR Team**: Confirm data field mappings
- [ ] **Your Team**: Develop sync script (`scripts/sync-employees.ts`)
- [ ] **Your Team**: Test sync with sample data
- [ ] **Database Team**: If Option B, create read-only HR database user

### Phase 3: Deployment (Week 3-4)

- [ ] **Your Team**: Deploy application to server
- [ ] **Your Team**: Run database migrations
- [ ] **Your Team**: Configure scheduled sync (cron job)
- [ ] **Your Team**: Initial employee data sync
- [ ] **All Teams**: Verify application functionality

### Phase 4: Go-Live & Monitoring (Week 4+)

- [ ] **Your Team**: Set up monitoring and alerting
- [ ] **Your Team**: Document sync process and troubleshooting
- [ ] **All Teams**: Go-live review meeting
- [ ] **Your Team**: Monitor first few days of automated syncs

---

## Quick Reference: Configuration Changes Summary

| Component | Local | Production |
|-----------|-------|------------|
| Database URL | `localhost:5432` | `db-server.company.com:5432` |
| App URL | `http://localhost:3000` | `https://sme.company.com` |
| Node Environment | `development` | `production` |
| SSL | Disabled | Enabled |
| Employee Data | Manual seed | Automated sync at 6 PM |
| Authentication | Local accounts | Consider SSO integration |

---

## Support Contacts

| Team | Contact | Purpose |
|------|---------|---------|
| Database | _[Add DBA contact]_ | Database issues, credentials |
| Network | _[Add network contact]_ | Connectivity, firewall, DNS |
| HR Systems | _[Add HR IT contact]_ | API access, data mapping |
| Security | _[Add security contact]_ | Security reviews, compliance |

---

## Appendix: API Contract Example

If HR team is building an API, here's a suggested contract:

### GET /api/employees

**Request:**
```http
GET /api/employees
Authorization: Bearer <api_key>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "emp_number": "EMP001",
      "full_name": "Ahmed Al-Salem",
      "email": "ahmed.alsalem@company.com",
      "position": "Senior Engineer",
      "site_name": "Riyadh HQ",
      "department_name": "Engineering",
      "manager_emp_number": "EMP000",
      "is_active": true,
      "image_url": null,
      "last_modified": "2026-02-06T10:30:00Z"
    }
  ],
  "total": 1,
  "last_sync_available": "2026-02-06T18:00:00Z"
}
```

### GET /api/employees/changes?since={timestamp}

For incremental updates (more efficient):

```http
GET /api/employees/changes?since=2026-02-05T18:00:00Z
Authorization: Bearer <api_key>
```

---

*Document created: February 6, 2026*  
*Last updated: February 6, 2026*
