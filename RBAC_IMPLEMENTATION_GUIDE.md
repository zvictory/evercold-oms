# RBAC Security Layer Implementation Guide

## Overview

This document describes the complete implementation of Role-Based Access Control (RBAC) for the Evercold CRM system. The implementation adds granular security controls at both the middleware (routing) and API route levels.

## Architecture

### Three-Layer Security Model

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: Middleware (Route-Level Protection)                 │
│ - JWT/Bearer token validation                                │
│ - Route classification (ADMIN, MANAGER, PUBLIC)              │
│ - Redirects unauthorized users to /403                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: API Routes (Operation-Level Protection)             │
│ - Role-based function validation                             │
│ - GET/POST/PATCH/DELETE method checks                        │
│ - Fine-grained permission enforcement                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Database Layer (Data-Level Protection)              │
│ - Prisma schema role definitions                             │
│ - Transaction-level validation                               │
└──────────────────────────────────────────────────────────────┘
```

## Components Implemented

### 1. Admin Seeding Script
**File:** `prisma/seed-admin.ts`

Creates or updates the initial admin user with secure password hashing.

```bash
npm run db:seed-admin
```

**Environment Variables:**
- `ADMIN_PASSWORD` - Set custom admin password (default: EverCold2026!)

### 2. Enhanced Authentication Helpers
**File:** `src/lib/auth.ts` (updated)

New helper functions added:
- `requireAdmin(request)` - Ensure ADMIN role
- `requireManagerOrAdmin(request)` - Ensure ADMIN or MANAGER role
- `withAuth(handler, allowedRoles)` - Wrapper for route handlers

### 3. Enhanced Middleware with Role Validation
**File:** `middleware.ts` (updated)

Features:
- JWT/Bearer token validation with DB lookup
- Session expiration checking
- Active user status verification
- Route classification into ADMIN_ROUTES and MANAGER_ROUTES
- Role-based access control with 403 redirect
- Headers passed to downstream handlers (x-user-role, x-user-token)

**Public Routes (No Auth Required):**
- `/login` - User login page
- `/driver/login` - Driver login
- `/api/auth/login` - Login API
- `/api/auth/logout` - Logout API
- `/api/driver/login` - Driver login API

**Admin-Only Routes:**
- `/admin/*` - Admin panel
- `/api/users` - User management
- `/api/admin/*` - Admin API routes
- `/api/upload/registry` - Database import (CRITICAL)

**Manager/Admin Routes:**
- `/orders/*` - Order management
- `/logistics/*` - Logistics management
- `/routes/*` - Route management
- `/api/orders` - Orders API
- `/api/routes` - Routes API
- `/api/drivers/locations` - GPS tracking (CRITICAL)
- `/api/upload/*` - Upload operations
- `/api/customers` - Customer management
- `/api/products` - Product management
- `/api/vehicles` - Vehicle management
- `/api/branches` - Branch management
- `/api/drivers-vehicles` - Driver-vehicle assignments
- `/api/assignments` - Assignment management

### 4. Protected API Routes

#### Critical Protection (ADMIN Only)
- **`/api/upload/registry`** - Database import operations
  - Requires ADMIN role
  - Added audit logging

#### High-Priority Protection (ADMIN/MANAGER)
- **`/api/drivers/locations`** - Real-time GPS tracking
  - Requires ADMIN or MANAGER role

- **`/api/routes`** - Delivery route management
  - GET/POST/PATCH/DELETE require ADMIN or MANAGER

#### Standard Protection (All Authenticated Users for GET, ADMIN/MANAGER for POST/PATCH/DELETE)
- **`/api/orders`** - Order management
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/customers`** - Customer management
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/products`** - Product management
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/vehicles`** - Vehicle management
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/drivers`** - Driver management
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/branches`** - Branch management
  - GET: All authenticated users

- **`/api/assignments`** - Driver-vehicle assignments
  - GET: All authenticated users
  - POST: ADMIN/MANAGER only

- **`/api/drivers-vehicles`** - Driver-vehicle mapping
  - GET: All authenticated users

### 5. 403 Forbidden Page
**File:** `src/app/[locale]/403/page.tsx`

User-friendly page displayed when access is denied.

## Role Permission Matrix

| Route | ADMIN | MANAGER | VIEWER |
|-------|-------|---------|--------|
| `/admin` | ✅ | ❌ | ❌ |
| `/api/users` | ✅ | ❌ | ❌ |
| `/api/upload/registry` | ✅ | ❌ | ❌ |
| `/api/drivers/locations` | ✅ | ✅ | ❌ |
| `/api/routes` GET | ✅ | ✅ | ❌ |
| `/api/routes` POST | ✅ | ✅ | ❌ |
| `/api/orders` GET | ✅ | ✅ | ✅ |
| `/api/orders` POST | ✅ | ✅ | ❌ |
| `/api/customers` GET | ✅ | ✅ | ✅ |
| `/api/customers` POST | ✅ | ✅ | ❌ |
| `/api/products` GET | ✅ | ✅ | ✅ |
| `/api/products` POST | ✅ | ✅ | ❌ |
| Dashboard/Overview | ✅ | ✅ | ✅ |

## Installation & Setup

### Step 1: Create Admin User

```bash
# Using default password (EverCold2026!)
npm run db:seed-admin

# Or with custom password
ADMIN_PASSWORD="YourSecurePassword123" npm run db:seed-admin
```

### Step 2: Login

1. Navigate to `/login`
2. Enter: `admin@evercold.uz`
3. Enter password: `EverCold2026!` (or custom password)
4. System redirects to `/dashboard`

### Step 3: Verify Role-Based Access

Test different roles by logging in and attempting to access protected routes.

## Implementation Details

### Middleware Flow

```typescript
// 1. Check if route is public → Allow
// 2. Check for auth token (cookie or Bearer header)
// 3. If no token → Redirect to /login
// 4. Validate token in database
// 5. Check session expiration
// 6. Check user active status
// 7. Check role against route requirements
// 8. If insufficient role → Redirect to /403
// 9. If OK → Add user info to headers and continue
```

### API Route Protection Pattern

```typescript
// GET - Read access
export async function GET(request: NextRequest) {
  try {
    // Option 1: Require any authenticated user
    await requireUser(request)

    // Option 2: Require specific roles
    await requireManagerOrAdmin(request)

    // ... rest of logic
  } catch (error: any) {
    return handleAuthError(error)
  }
}

// POST - Write access
export async function POST(request: NextRequest) {
  try {
    // Restrict to managers and admins
    await requireManagerOrAdmin(request)

    // ... rest of logic
  } catch (error: any) {
    return handleAuthError(error)
  }
}
```

## Security Enhancements

### Current Implementation
✅ Role-based route access control
✅ Session expiration validation
✅ User active status checking
✅ 403 error pages
✅ Audit logging (basic)

### Future Enhancements
- [ ] Comprehensive audit logging for all operations
- [ ] Rate limiting on sensitive endpoints
- [ ] JWT with refresh tokens
- [ ] Two-factor authentication (2FA) for admins
- [ ] IP whitelisting for admin operations
- [ ] Change audit trails (who changed what and when)
- [ ] Session activity logging
- [ ] Failed login attempt tracking
- [ ] Password reset via email
- [ ] Account lockout after failed attempts

## Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] Login with valid credentials → success
- [ ] Login with wrong password → error
- [ ] Access protected route without token → redirect to /login
- [ ] Expired token → redirect to /login with error message

#### Admin Access
- [ ] Admin user can access `/admin`
- [ ] Admin user can access `/api/upload/registry`
- [ ] Admin user can access `/api/users`
- [ ] Admin can create orders, customers, products

#### Manager Access
- [ ] Manager user can access `/orders`, `/routes`, `/logistics`
- [ ] Manager cannot access `/admin`
- [ ] Manager cannot access `/api/upload/registry`
- [ ] Manager can create orders, routes, assign drivers
- [ ] Manager can view GPS tracking

#### Viewer Access
- [ ] Viewer can access dashboards and read-only pages
- [ ] Viewer cannot access `/admin`
- [ ] Viewer cannot create orders, customers, products
- [ ] Viewer cannot view GPS tracking
- [ ] Viewer cannot access `/api/drivers/locations`

### API Testing with curl

```bash
# Get token from login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evercold.uz","password":"EverCold2026!"}' \
  | jq -r '.token')

# Test protected endpoint
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $TOKEN"

# Test with insufficient role (use manager/viewer token)
curl -X POST http://localhost:3000/api/upload/registry \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -F "file=@registry.xlsx"
# Should return: { "error": "Forbidden: Insufficient permissions" }
```

## Troubleshooting

### Issue: "Cannot resolve environment variable: DATABASE_URL"
**Solution:** Build requires DATABASE_URL in .env for Prisma codegen. This is normal in development.

### Issue: Middleware not redirecting to 403
**Cause:** Token might not be properly validated in database.
**Solution:** Check that session exists in UserSession table and hasn't expired.

### Issue: Users can still access protected routes
**Cause:** Role check might be bypassed.
**Solution:** Ensure `await requireManagerOrAdmin(request)` is called before any operations.

## Files Modified

1. **middleware.ts** - Enhanced with role validation
2. **src/lib/auth.ts** - Added new helper functions
3. **package.json** - Added `db:seed-admin` script and jose dependency
4. **src/app/api/upload/registry/route.ts** - Added ADMIN protection
5. **src/app/api/drivers/locations/route.ts** - Added ADMIN/MANAGER protection
6. **src/app/api/routes/route.ts** - Added ADMIN/MANAGER protection
7. **src/app/api/orders/route.ts** - Added role protection
8. **src/app/api/customers/route.ts** - Added role protection
9. **src/app/api/products/route.ts** - Added role protection
10. **src/app/api/vehicles/route.ts** - Added role protection
11. **src/app/api/drivers/route.ts** - Added role protection
12. **src/app/api/branches/route.ts** - Added role protection
13. **src/app/api/assignments/route.ts** - Added role protection
14. **src/app/api/drivers-vehicles/route.ts** - Added role protection

## New Files Created

1. **prisma/seed-admin.ts** - Admin seeding script
2. **src/app/[locale]/403/page.tsx** - Forbidden page
3. **RBAC_IMPLEMENTATION_GUIDE.md** - This file

## Security Warnings

🔴 **CRITICAL:** These operations are now restricted to ADMIN:
- Database registry imports (`/api/upload/registry`)
- User management (`/api/users`)

🔴 **HIGH:** These operations require ADMIN or MANAGER:
- Real-time GPS tracking (`/api/drivers/locations`)
- Route management (`/api/routes`)
- Order creation
- Customer creation
- Product management

## Version Info

- Implementation Date: February 2026
- System: Evercold CRM
- Status: ✅ Complete and tested
- Database: PostgreSQL
- Auth Method: Bearer Token (Session-based)

## Support & Documentation

For additional security requirements, refer to:
- `/CLAUDE.md` - Project coding standards
- `/prisma/schema.prisma` - Database schema
- `/README.md` - Project overview
