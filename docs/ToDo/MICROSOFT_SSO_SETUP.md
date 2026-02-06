# Microsoft Active Directory SSO Integration Guide

This document provides a comprehensive guide for integrating Microsoft Active Directory (Azure AD / Microsoft Entra ID) Single Sign-On (SSO) with the SME application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Team Responsibilities](#team-responsibilities)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Code Changes Required](#code-changes-required)
7. [Testing & Troubleshooting](#testing--troubleshooting)
8. [Security Best Practices](#security-best-practices)
9. [Timeline & Checklist](#timeline--checklist)

---

## Overview

### What is SSO?
Single Sign-On (SSO) allows employees to log into the SME application using their corporate Microsoft/Active Directory credentials. No separate username/password needed.

### Benefits
- ✅ **Security**: Centralized authentication, enforced password policies
- ✅ **User Experience**: One login for all corporate applications
- ✅ **Compliance**: Audit trails, conditional access policies
- ✅ **Administration**: Automatic user provisioning/deprovisioning
- ✅ **MFA Support**: Leverage existing MFA setup

### Current State
- Using Better Auth with email/password authentication
- Users must create separate accounts for the SME application

### Target State
- Users click "Sign in with Microsoft"
- Redirected to corporate login page
- Automatically authenticated and redirected back
- User account created/linked automatically

---

## Prerequisites

Before starting, ensure you have:

| Requirement | Description | Who Provides |
|-------------|-------------|--------------|
| Azure AD Tenant | Your organization's Azure AD/Entra ID | IT/Azure Admin |
| Admin Access | Permission to register applications in Azure AD | IT/Azure Admin |
| Domain Name | Production URL for the SME app (e.g., `sme.company.com`) | Network Team |
| SSL Certificate | HTTPS is required for OAuth | Network Team |

---

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SSO AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐                                                               │
│   │  User   │                                                               │
│   └────┬────┘                                                               │
│        │ 1. Click "Sign in with Microsoft"                                  │
│        ▼                                                                    │
│   ┌─────────────┐      2. Redirect to Azure AD      ┌──────────────────┐   │
│   │  SME App    │──────────────────────────────────▶│  Azure AD /      │   │
│   │  (Next.js)  │                                   │  Microsoft Entra │   │
│   └─────────────┘                                   └────────┬─────────┘   │
│        ▲                                                     │              │
│        │                                                     │              │
│        │ 4. Redirect back with auth code         3. User logs in           │
│        │                                            (corporate credentials) │
│        │                                                     │              │
│   ┌─────────────┐      5. Exchange code for tokens          │              │
│   │  Better Auth│◀──────────────────────────────────────────┘              │
│   │  (Backend)  │                                                           │
│   └─────────────┘                                                           │
│        │                                                                    │
│        │ 6. Create/update user session                                      │
│        ▼                                                                    │
│   ┌─────────────┐                                                           │
│   │  PostgreSQL │  User data stored                                         │
│   │  Database   │                                                           │
│   └─────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Protocol: OAuth 2.0 / OpenID Connect (OIDC)

The integration uses the standard OAuth 2.0 Authorization Code flow with PKCE:

1. **Authorization Request** → Azure AD
2. **User Authentication** → Corporate login page
3. **Authorization Code** → Returned to app
4. **Token Exchange** → Access token + ID token
5. **User Info** → Extract user details from token

---

## Team Responsibilities

### 🔵 Your Team (Development/Application)

| Task | Description | Priority | Estimated Time |
|------|-------------|----------|----------------|
| Install dependencies | Add `@better-auth/oauth2` package | High | 30 min |
| Update auth config | Configure Microsoft provider in Better Auth | High | 2 hours |
| Update login UI | Add "Sign in with Microsoft" button | High | 1 hour |
| Handle user mapping | Link Azure AD users to Employee records | High | 3 hours |
| Test integration | Verify login flow works correctly | High | 2 hours |
| Update documentation | Document the SSO process | Medium | 1 hour |

### 🟣 IT/Azure AD Administrator

| Task | Description | Priority | Estimated Time |
|------|-------------|----------|----------------|
| Register application | Create app registration in Azure AD | High | 30 min |
| Configure redirect URIs | Add callback URLs for the SME app | High | 15 min |
| Create client secret | Generate and securely share client secret | High | 15 min |
| Configure permissions | Grant required API permissions | High | 30 min |
| Enable user consent | Configure consent settings | Medium | 15 min |
| Set up groups (optional) | Configure group claims for roles | Medium | 1 hour |
| Configure conditional access | Set up MFA, location policies | Medium | 1 hour |

**Azure AD Configuration Details:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE AD APP REGISTRATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App Name:           SME Application                            │
│  Application Type:   Web Application                            │
│                                                                 │
│  Redirect URIs:                                                 │
│  ├─ https://sme.company.com/api/auth/callback/microsoft        │
│  └─ http://localhost:3000/api/auth/callback/microsoft (dev)    │
│                                                                 │
│  API Permissions:                                               │
│  ├─ Microsoft Graph                                             │
│  │   ├─ openid (delegated)                                     │
│  │   ├─ profile (delegated)                                    │
│  │   ├─ email (delegated)                                      │
│  │   └─ User.Read (delegated)                                  │
│  │                                                             │
│  Token Configuration:                                           │
│  ├─ ID Token: enabled                                          │
│  └─ Access Token: enabled                                       │
│                                                                 │
│  Client Secret:                                                 │
│  └─ Create new secret (expires in 24 months recommended)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🟡 Network Team

| Task | Description | Priority |
|------|-------------|----------|
| Ensure HTTPS | SSL certificate must be installed | High |
| Allow outbound traffic | Enable connections to `login.microsoftonline.com` | High |
| Allow Microsoft Graph | Enable connections to `graph.microsoft.com` | High |
| DNS configuration | Ensure domain resolves correctly | High |

**Required Outbound Firewall Rules:**

| Destination | Port | Protocol | Purpose |
|-------------|------|----------|---------|
| `login.microsoftonline.com` | 443 | HTTPS | Azure AD authentication |
| `graph.microsoft.com` | 443 | HTTPS | Microsoft Graph API |
| `login.microsoft.com` | 443 | HTTPS | Microsoft login |
| `*.microsoft.com` | 443 | HTTPS | Microsoft services |

### 🔴 Security Team

| Task | Description | Priority |
|------|-------------|----------|
| Review OAuth flow | Ensure secure implementation | High |
| Validate token handling | Review token storage and validation | High |
| Approve app permissions | Review requested Azure AD permissions | High |
| Configure conditional access | Set up security policies if required | Medium |
| Enable audit logging | Track authentication events | Medium |

---

## Step-by-Step Implementation

### Step 1: Azure AD App Registration (IT Admin)

1. **Navigate to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Navigate to **Azure Active Directory** → **App registrations**

2. **Create New Registration**
   - Click **New registration**
   - Name: `SME Application`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: `https://sme.company.com/api/auth/callback/microsoft`

3. **Note the Application Details**
   ```
   Application (client) ID:  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID:    yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
   ```

4. **Create Client Secret**
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Description: `SME App Production`
   - Expires: 24 months (recommended)
   - **Copy the secret value immediately** (shown only once!)

5. **Configure API Permissions**
   - Go to **API permissions**
   - Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Add: `openid`, `profile`, `email`, `User.Read`
   - Click **Grant admin consent** (if required)

6. **Configure Token**
   - Go to **Authentication**
   - Under **Implicit grant and hybrid flows**, enable:
     - ✅ ID tokens
   - Save changes

### Step 2: Share Credentials with Development Team

The IT Admin should securely share these values with the development team:

```env
# Microsoft Azure AD Configuration
MICROSOFT_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MICROSOFT_CLIENT_SECRET="your-client-secret-here"
MICROSOFT_TENANT_ID="yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
```

> ⚠️ **Security Note**: Never share secrets via email or chat. Use a secure method like:
> - Azure Key Vault
> - Password manager (1Password, LastPass)
> - Encrypted file transfer

### Step 3: Install Dependencies (Development Team)

```bash
# Navigate to project directory
cd /path/to/sme-app

# Install required package (if not already included with better-auth)
npm install better-auth
```

### Step 4: Update Environment Variables

Add to `.env` file:

```env
# Microsoft Azure AD SSO
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"

# Ensure these are set
BETTER_AUTH_URL="https://sme.company.com"
BETTER_AUTH_SECRET="your-random-secret-key"
```

### Step 5: Update Auth Configuration

**Update: `lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "./prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_BASE_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  
  // Keep email/password as fallback (optional)
  emailAndPassword: { enabled: true },
  
  // Add Microsoft SSO
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID, // For single-tenant apps
      // For multi-tenant: use "common" or "organizations"
    },
  },
  
  // Account linking - link SSO to existing accounts by email
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["microsoft"],
    },
  },
  
  // Callbacks for custom logic
  callbacks: {
    // Called after successful sign-in
    async signIn({ user, account }) {
      // Link to Employee record if exists
      if (user.email) {
        const employee = await prisma.employee.findUnique({
          where: { email: user.email },
        });
        
        if (employee) {
          // Optionally update user image from employee
          console.log(`User ${user.email} linked to employee ${employee.empNumber}`);
        }
      }
      return true; // Allow sign-in
    },
  },
  
  plugins: [nextCookies()],
});
```

### Step 6: Update Auth Client

**Update: `lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export social sign-in helpers
export const signInWithMicrosoft = () => {
  return authClient.signIn.social({
    provider: "microsoft",
    callbackURL: "/dashboard", // Where to redirect after login
  });
};
```

### Step 7: Update Login Page

**Update: `app/sign-in/page.tsx`**

Add a "Sign in with Microsoft" button:

```tsx
"use client";

import { signInWithMicrosoft } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const handleMicrosoftSignIn = async () => {
    try {
      await signInWithMicrosoft();
    } catch (error) {
      console.error("Microsoft sign-in failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        
        {/* Microsoft SSO Button */}
        <Button
          onClick={handleMicrosoftSignIn}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
        >
          <MicrosoftIcon className="w-5 h-5" />
          Sign in with Microsoft
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        {/* Existing email/password form (optional fallback) */}
        {/* ... your existing form ... */}
      </div>
    </div>
  );
}

// Microsoft Icon Component
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" fill="none">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}
```

### Step 8: Link SSO Users to Employees

Create a utility to automatically link authenticated users to employee records:

**Create: `lib/link-sso-user.ts`**

```typescript
import prisma from "./prisma";

export async function linkUserToEmployee(email: string) {
  // Find employee by email
  const employee = await prisma.employee.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!employee) {
    console.warn(`No employee record found for email: ${email}`);
    return null;
  }

  return {
    employeeId: employee.employeeId,
    empNumber: employee.empNumber,
    fullName: employee.fullName,
    department: employee.departmentName,
    position: employee.position,
    roles: employee.roles.map((er) => er.role.roleCode),
  };
}
```

---

## Code Changes Required

### Summary of Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `lib/auth.ts` | Add Microsoft social provider configuration | High |
| `lib/auth-client.ts` | Add `signInWithMicrosoft` helper function | High |
| `app/sign-in/page.tsx` | Add "Sign in with Microsoft" button | High |
| `.env` | Add Microsoft client ID, secret, tenant ID | High |
| `lib/link-sso-user.ts` | Create user-employee linking utility | Medium |
| `prisma/schema.prisma` | No changes needed (Account model exists) | None |

### Environment Variables Summary

```env
# Required for Microsoft SSO
MICROSOFT_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MICROSOFT_CLIENT_SECRET="your-secret-here"
MICROSOFT_TENANT_ID="yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"

# Already should exist
BETTER_AUTH_URL="https://sme.company.com"
BETTER_AUTH_SECRET="your-auth-secret"
DATABASE_URL="postgresql://..."
```

---

## Testing & Troubleshooting

### Testing Checklist

- [ ] Click "Sign in with Microsoft" redirects to Microsoft login
- [ ] After login, user is redirected back to the app
- [ ] User session is created correctly
- [ ] User data (name, email) is populated from Azure AD
- [ ] User is linked to correct Employee record
- [ ] Logout works correctly
- [ ] Session persists across page refreshes

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid redirect URI" | Mismatch between app and Azure AD | Verify redirect URI exactly matches in Azure AD |
| "Consent required" | Admin consent not granted | IT Admin must grant admin consent in Azure AD |
| "Token expired" | Session timeout | Implement token refresh logic |
| "User not found" | No Employee record | Ensure employee sync runs before SSO |
| "CORS error" | Missing allowed origin | Check BETTER_AUTH_URL matches your domain |

### Debug Mode

Enable detailed logging during development:

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... config
  advanced: {
    debug: process.env.NODE_ENV === "development",
  },
});
```

### Verify Token Claims

Check what claims are returned from Azure AD:

```typescript
// In your callback or middleware
callbacks: {
  async signIn({ user, account, profile }) {
    console.log("User:", user);
    console.log("Account:", account);
    console.log("Profile:", profile);
    // Profile contains Azure AD claims like:
    // - oid (object ID)
    // - preferred_username
    // - name
    // - email
    return true;
  },
},
```

---

## Security Best Practices

### 1. Client Secret Management
- ❌ Never commit secrets to version control
- ✅ Use environment variables
- ✅ Rotate secrets periodically (every 6-12 months)
- ✅ Use Azure Key Vault for production

### 2. Token Handling
- ✅ Tokens are stored server-side by Better Auth
- ✅ Use HTTPS only
- ✅ Implement token refresh before expiry
- ✅ Clear tokens on logout

### 3. User Validation
- ✅ Verify user email matches Employee record
- ✅ Check user is active before granting access
- ✅ Log all authentication events

### 4. Conditional Access (Azure AD)
Consider configuring these policies with IT Admin:
- Require MFA for all users
- Block sign-in from unfamiliar locations
- Require compliant devices
- Session lifetime limits

### 5. Audit Logging

```typescript
// Log authentication events
callbacks: {
  async signIn({ user }) {
    console.log(`[AUTH] User signed in: ${user.email} at ${new Date().toISOString()}`);
    // Optionally: Write to audit log table
    return true;
  },
},
```

---

## Timeline & Checklist

### Phase 1: Azure AD Setup (Day 1-2)

- [ ] **IT Admin**: Create Azure AD app registration
- [ ] **IT Admin**: Configure redirect URIs
- [ ] **IT Admin**: Create client secret
- [ ] **IT Admin**: Configure API permissions
- [ ] **IT Admin**: Grant admin consent
- [ ] **IT Admin**: Share credentials securely with dev team

### Phase 2: Development (Day 3-5)

- [ ] **Dev Team**: Update `.env` with Azure AD credentials
- [ ] **Dev Team**: Update `lib/auth.ts` with Microsoft provider
- [ ] **Dev Team**: Update `lib/auth-client.ts` with sign-in helper
- [ ] **Dev Team**: Update sign-in page with Microsoft button
- [ ] **Dev Team**: Implement user-employee linking
- [ ] **Network Team**: Verify outbound firewall rules

### Phase 3: Testing (Day 6-7)

- [ ] **Dev Team**: Test login flow in development
- [ ] **Dev Team**: Test with multiple user accounts
- [ ] **Dev Team**: Verify employee linking works
- [ ] **Security Team**: Review implementation
- [ ] **All Teams**: UAT testing

### Phase 4: Deployment (Day 8-10)

- [ ] **IT Admin**: Add production redirect URI to Azure AD
- [ ] **Dev Team**: Deploy to production
- [ ] **Dev Team**: Verify production SSO works
- [ ] **IT Admin**: Monitor Azure AD sign-in logs
- [ ] **All Teams**: Go-live announcement

---

## Support Contacts

| Team | Contact | Purpose |
|------|---------|---------|
| Azure AD Admin | _[Add IT Admin contact]_ | App registration, permissions |
| Network | _[Add network contact]_ | Firewall rules, DNS |
| Security | _[Add security contact]_ | Security review, policies |
| Development | _[Add dev lead contact]_ | Implementation questions |

---

## Appendix: Azure AD Configuration Screenshots Guide

### A. Creating App Registration

1. Azure Portal → Azure Active Directory → App registrations → New registration
2. Fill in:
   - Name: `SME Application`
   - Supported account types: `Single tenant`
   - Redirect URI: `Web` + `https://sme.company.com/api/auth/callback/microsoft`

### B. Required API Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `openid` | Delegated | Sign users in |
| `profile` | Delegated | View users' basic profile |
| `email` | Delegated | View users' email address |
| `User.Read` | Delegated | Sign in and read user profile |

### C. Token Configuration

Enable ID tokens in Authentication settings for the authorization code flow.

---

## Appendix: Keeping Email/Password as Fallback

If you want to keep email/password login alongside SSO (e.g., for admin accounts or testing):

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... other config
  
  // Keep email/password enabled
  emailAndPassword: { 
    enabled: true,
    // Optional: Only allow specific domains
    // allowedDomains: ["company.com"],
  },
  
  // SSO configuration
  socialProviders: {
    microsoft: {
      // ... config
    },
  },
});
```

The sign-in page will show both options:
1. "Sign in with Microsoft" button (SSO)
2. Email/password form (fallback)

---

## Appendix: Disabling Email/Password After SSO Rollout

Once SSO is fully rolled out, you may want to disable email/password:

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // Disable email/password
  emailAndPassword: { enabled: false },
  
  // Only allow SSO
  socialProviders: {
    microsoft: {
      // ... config
    },
  },
});
```

---

*Document created: February 6, 2026*  
*Last updated: February 6, 2026*
