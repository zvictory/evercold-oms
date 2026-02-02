# Quick Start - Testing the RBAC Security Layer

## 🚀 5-Minute Setup & Test

### Step 1: Create Admin User (1 minute)

```bash
npm run db:seed-admin
```

Expected output:
```
✓ Admin user created!
   Email: admin@evercold.uz
   Password: EverCold2026!
   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!
```

### Step 2: Start Development Server (1 minute)

```bash
npm run dev
```

Expected output:
```
> evercold-crm@0.1.0 dev
> next dev

▲ Next.js 16.0.10
- ready started server on 0.0.0.0:3000
```

### Step 3: Test Login Flow (1 minute)

1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@evercold.uz`
   - Password: `EverCold2026!`
3. Click login
4. Should redirect to dashboard

### Step 4: Test Role Protection (2 minutes)

#### Test ADMIN Access ✅
```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evercold.uz","password":"EverCold2026!"}' \
  | jq -r '.token')

# Test registry import endpoint (should work for admin)
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $TOKEN"
# Should return: { "locations": [...], "timestamp": "..." }
```

#### Test VIEWER Access ❌
First, create a viewer user in the admin panel, then:

```bash
# Login as viewer
VIEWER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"password123"}' \
  | jq -r '.token')

# Try to access critical GPS tracking (should fail)
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $VIEWER_TOKEN"
# Should return: { "error": "Forbidden: Insufficient permissions" }

# Try to import registry (should fail)
curl -X POST http://localhost:3000/api/upload/registry \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -F "file=@sample.xlsx"
# Should return: { "error": "Forbidden: Insufficient permissions" }
```

## 🧪 Manual Testing Checklist

### Authentication ✅
- [ ] Login with valid credentials → Success
- [ ] Login with wrong password → Error message
- [ ] Access protected route without token → Redirect to /login
- [ ] Use expired token → Redirect to /login

### Authorization ✅
- [ ] Access `/admin` as VIEWER → 403 error page
- [ ] Access `/api/upload/registry` as MANAGER → 403 error
- [ ] View orders as VIEWER → ✅ Works
- [ ] Create order as VIEWER → 403 error
- [ ] Create order as MANAGER → ✅ Works
- [ ] Import registry as ADMIN → ✅ Works

### Error Handling ✅
- [ ] Invalid token format → 401 Unauthorized
- [ ] Insufficient permissions → 403 Forbidden
- [ ] Missing auth header → 401 Unauthorized
- [ ] Malformed JSON → 400 Bad Request

## 📊 Test User Setup

### Create Test Users in Admin Panel

**Admin User (Default)**
- Email: `admin@evercold.uz`
- Password: `EverCold2026!` (auto-created)
- Role: ADMIN

**Manager User (Create manually)**
1. Login as admin
2. Go to `/api/users` or admin panel
3. Create new user:
   - Email: `manager@evercold.uz`
   - Password: `Manager123!`
   - Role: MANAGER

**Viewer User (Create manually)**
1. Login as admin
2. Create new user:
   - Email: `viewer@evercold.uz`
   - Password: `Viewer123!`
   - Role: VIEWER

## 🔍 API Endpoints to Test

### Critical ADMIN-Only
```bash
# Should work: curl with ADMIN token
curl -X POST http://localhost:3000/api/upload/registry \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@data.xlsx"

# Should fail: curl with MANAGER or VIEWER token
curl -X POST http://localhost:3000/api/upload/registry \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -F "file=@data.xlsx"
# Expected: 403 Forbidden
```

### High-Priority ADMIN/MANAGER
```bash
# Should work: ADMIN and MANAGER
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $ADMIN_TOKEN"
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Should fail: VIEWER
curl http://localhost:3000/api/drivers/locations \
  -H "Authorization: Bearer $VIEWER_TOKEN"
# Expected: 403 Forbidden
```

### Standard Read/Write
```bash
# Read (should work for all authenticated users)
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $VIEWER_TOKEN"
# Expected: 200 OK with order list

# Write (should fail for VIEWER)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"123","items":[]}'
# Expected: 403 Forbidden

# Write (should work for ADMIN/MANAGER)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"123","items":[]}'
# Expected: 201 Created
```

## 🐛 Troubleshooting

### Issue: "Cannot resolve environment variable: DATABASE_URL"
**Solution:** This happens only during build. Development works fine.

### Issue: "AuthError: Forbidden: Insufficient permissions"
**Expected behavior!** This means the RBAC is working correctly. The user doesn't have permission for that route.

### Issue: Middleware not redirecting
**Check:**
1. Token exists in UserSession table
2. Token hasn't expired (check expiresAt)
3. User has isActive = true

### Issue: 403 page not showing
**Check:**
1. User logged in with valid role
2. Route matches ADMIN_ROUTES or MANAGER_ROUTES in middleware.ts
3. Browser cookies/localStorage not cached

## ✅ Verification Steps

### Step 1: Verify Middleware
```bash
# Check that middleware validates roles
grep -n "ADMIN_ROUTES\|MANAGER_ROUTES" /path/to/middleware.ts
# Should show route classifications
```

### Step 2: Verify API Routes
```bash
# Check that routes have role checks
grep -r "requireManagerOrAdmin\|requireAdmin" src/app/api/ --include="route.ts" | wc -l
# Should show 30+ instances
```

### Step 3: Verify Database
```bash
# Check UserRole enum in schema
grep -A 5 "enum UserRole" prisma/schema.prisma
# Should show: ADMIN, MANAGER, VIEWER
```

### Step 4: Verify Admin User
```bash
# Check admin exists in database
sqlite3 DATABASE_FILE "SELECT * FROM User WHERE role = 'ADMIN';"
# Should return admin@evercold.uz record
```

## 📝 Test Report Template

Use this template to document your testing:

```markdown
## RBAC Security Testing Report
Date: [DATE]
Tester: [NAME]

### Authentication Tests
- [ ] Login successful with valid credentials
- [ ] Login failed with invalid password
- [ ] Session persists across requests
- [ ] Session expires properly
- [ ] Logout clears session

### Authorization Tests
- [ ] ADMIN can access all routes
- [ ] MANAGER can access manager routes
- [ ] VIEWER can access read-only routes
- [ ] Unauthorized access → 403 redirect
- [ ] Insufficient permissions → 403 error

### API Tests
- [ ] GET endpoints work for authorized roles
- [ ] POST endpoints blocked for unauthorized roles
- [ ] Error messages are helpful
- [ ] Status codes are correct (401, 403, 500)

### Results
[ ] All tests passed
[ ] Some tests failed (see details below)
[ ] Critical issues found (describe)

### Issues Found
(List any bugs or unexpected behavior)

### Recommendations
(Suggest improvements or additional tests)
```

## 🎯 Success Criteria

✅ You'll know RBAC is working when:

1. **Authentication:**
   - Login works with admin credentials
   - Invalid credentials are rejected
   - Tokens expire after 24 hours

2. **Authorization:**
   - ADMIN can access `/admin` page
   - MANAGER cannot access `/admin` (gets 403)
   - VIEWER can see dashboards but cannot create resources

3. **Critical Protection:**
   - Only ADMIN can import registry
   - Only ADMIN/MANAGER can view GPS tracking
   - Only ADMIN/MANAGER can manage routes

4. **Error Handling:**
   - No auth token → Redirect to login
   - Insufficient role → 403 page
   - Expired token → Login redirect

## 📞 Next Steps

After testing:
1. Review `RBAC_IMPLEMENTATION_GUIDE.md` for details
2. Check `IMPLEMENTATION_CHECKLIST.md` for full coverage
3. Plan security enhancements (2FA, audit logging, etc.)
4. Prepare for production deployment
5. Set up monitoring for unauthorized access attempts

---

**Ready to test?** Start with Step 1: `npm run db:seed-admin`
