# Authentication Testing Guide

## Prerequisites

1. **Database seeded with demo accounts**
   ```bash
   npm run db:seed
   ```

2. **Development server running**
   ```bash
   npm run dev
   ```

3. **Browser with DevTools** (for inspecting cookies/network)

## Test Accounts

### Provider Account
```
Email: dr.smith@clinicos.com
Password: DrSmith123!
Role: PROVIDER
Provider ID: (from database)
```

### Front Desk Account
```
Email: frontdesk@clinicos.com
Password: FrontDesk123!
Role: FRONT_DESK
```

### Additional Provider
```
Email: dr.johnson@clinicos.com
Password: DrJohnson123!
Role: PROVIDER
Provider ID: (different from dr.smith)
```

## Test Scenarios

### 1. Authentication Flow

#### Test 1.1: Successful Login (Provider)
**Steps:**
1. Navigate to `/login`
2. Enter: `dr.smith@clinicos.com` / `DrSmith123!`
3. Click "Sign In"

**Expected:**
- ✅ Redirects to `/dashboard`
- ✅ Session cookie set (check DevTools → Application → Cookies)
- ✅ User info displayed in dashboard
- ✅ Role shows "Provider"

#### Test 1.2: Successful Login (Front Desk)
**Steps:**
1. Navigate to `/login`
2. Enter: `frontdesk@clinicos.com` / `FrontDesk123!`
3. Click "Sign In"

**Expected:**
- ✅ Redirects to `/dashboard`
- ✅ Session cookie set
- ✅ Role shows "Front Desk Staff"

#### Test 1.3: Failed Login - Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter: `test@test.com` / `wrongpassword`
3. Click "Sign In"

**Expected:**
- ❌ Login fails
- ❌ Error message: "Invalid email or password"
- ❌ No redirect
- ❌ No session cookie

#### Test 1.4: Failed Login - Missing Fields
**Steps:**
1. Navigate to `/login`
2. Leave email or password empty
3. Try to submit

**Expected:**
- ❌ HTML5 validation prevents submission
- ❌ "Please fill out this field" message

### 2. Session Management

#### Test 2.1: Session Persistence
**Steps:**
1. Login successfully
2. Refresh the page
3. Close and reopen browser tab
4. Visit `/dashboard` directly

**Expected:**
- ✅ Session persists across refreshes
- ✅ User remains logged in after tab close/reopen
- ✅ Direct access to `/dashboard` works

#### Test 2.2: Logout
**Steps:**
1. Login successfully
2. Click "Sign Out" button
3. Try accessing `/dashboard`

**Expected:**
- ✅ Redirects to `/login`
- ✅ Session cookie cleared
- ✅ Cannot access `/dashboard` without re-login

#### Test 2.3: Session Cookie Properties
**Steps:**
1. Login successfully
2. Open DevTools → Application → Cookies
3. Inspect session cookie

**Expected:**
- ✅ `httpOnly: true` (cannot access via JavaScript)
- ✅ `sameSite: lax` (CSRF protection)
- ✅ Cookie contains encrypted JWT

### 3. Route Protection

#### Test 3.1: Unauthenticated Access to Protected Routes
**Steps:**
1. Ensure logged out
2. Try accessing:
   - `/dashboard`
   - `/appointments`
   - `/patients`
   - `/providers`

**Expected:**
- ❌ All routes redirect to `/login`
- ✅ Callback URL preserved in redirect

#### Test 3.2: Authenticated Access to Public Routes
**Steps:**
1. Login successfully
2. Try accessing `/login`

**Expected:**
- ✅ Redirects to `/dashboard`
- ✅ Cannot return to login page while authenticated

#### Test 3.3: Public Route Access
**Steps:**
1. Ensure logged out
2. Access `/` (landing page)

**Expected:**
- ✅ Landing page loads successfully
- ✅ No redirect to login

### 4. Provider Data Isolation

#### Test 4.1: Provider Accessing Own Data
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. GET `/api/appointments`
3. Inspect response

**Expected:**
- ✅ Returns only Dr. Smith's appointments
- ✅ No appointments from Dr. Johnson

**Command Line Test:**
```bash
# Login and get cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.smith@clinicos.com","password":"DrSmith123!"}'

# Get appointments
curl -b cookies.txt http://localhost:3000/api/appointments
```

#### Test 4.2: Provider Accessing Another Provider's Data
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. Get Dr. Johnson's provider ID from database
3. GET `/api/providers/{dr.johnson.providerId}`

**Expected:**
- ❌ Returns 403 Forbidden
- ❌ Error: "Unauthorized: You can only access your own provider data"

**Test with curl:**
```bash
curl -b cookies.txt http://localhost:3000/api/providers/{other-provider-id}
# Should return 403
```

#### Test 4.3: Front Desk Accessing All Provider Data
**Steps:**
1. Login as `frontdesk@clinicos.com`
2. GET `/api/providers/{any-provider-id}`

**Expected:**
- ✅ Returns provider data
- ✅ Works for any provider ID

### 5. Role-Based Authorization

#### Test 5.1: Provider Creating Appointment for Self
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. POST `/api/appointments` with own providerId

**Expected:**
- ✅ Appointment created successfully
- ✅ Returns 201 status

**Test Data:**
```json
{
  "patientId": "patient-id-from-db",
  "providerId": "dr-smith-provider-id",
  "scheduledAt": "2026-09-15T10:00:00Z",
  "reason": "Follow-up visit"
}
```

#### Test 5.2: Provider Creating Appointment for Another Provider
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. POST `/api/appointments` with Dr. Johnson's providerId

**Expected:**
- ❌ Returns 403 Forbidden
- ❌ Error: "Providers can only create appointments for themselves"

#### Test 5.3: Front Desk Creating Appointment for Any Provider
**Steps:**
1. Login as `frontdesk@clinicos.com`
2. POST `/api/appointments` with any providerId

**Expected:**
- ✅ Appointment created successfully
- ✅ Works for any provider

### 6. Patient Data Access

#### Test 6.1: Provider Accessing Own Patient
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. Find patient with Dr. Smith appointment
3. GET `/api/patients/{patientId}`

**Expected:**
- ✅ Returns patient data
- ✅ Provider has appointment with this patient

#### Test 6.2: Provider Accessing Unrelated Patient
**Steps:**
1. Login as `dr.smith@clinicos.com`
2. Find patient with NO Dr. Smith appointments
3. GET `/api/patients/{patientId}`

**Expected:**
- ❌ Returns 403 Forbidden
- ❌ Provider has no appointments with this patient

#### Test 6.3: Front Desk Accessing Any Patient
**Steps:**
1. Login as `frontdesk@clinicos.com`
2. GET `/api/patients/{any-patient-id}`

**Expected:**
- ✅ Returns patient data
- ✅ Works for any patient

### 7. Security Tests

#### Test 7.1: JWT Token Tampering
**Steps:**
1. Login successfully
2. Get session cookie from DevTools
3. Modify cookie value
4. Try accessing protected route

**Expected:**
- ❌ Authentication fails
- ❌ Redirects to login
- ✅ Tampered token rejected

#### Test 7.2: XSS Protection (HTTP-Only Cookie)
**Steps:**
1. Login successfully
2. Open browser console
3. Try accessing cookie via JavaScript:
   ```javascript
   document.cookie
   ```

**Expected:**
- ❌ Session cookie NOT visible in `document.cookie`
- ✅ HTTP-only flag prevents JavaScript access

#### Test 7.3: CSRF Protection
**Steps:**
1. Login successfully
2. Try making authenticated request from different origin
3. Check if CSRF token required

**Expected:**
- ✅ Auth.js CSRF protection active
- ✅ Cross-origin requests blocked

### 8. Error Handling

#### Test 8.1: Database Connection Error
**Steps:**
1. Stop database or use invalid DATABASE_URL
2. Try logging in

**Expected:**
- ❌ Login fails gracefully
- ❌ Error message displayed
- ✅ No sensitive error details exposed

#### Test 8.2: Expired Session
**Steps:**
1. Login successfully
2. Wait for session expiry (or manually expire)
3. Try accessing protected route

**Expected:**
- ❌ Session expired
- ❌ Redirects to login
- ✅ Graceful handling

## Automated Testing Scripts

### Test Script 1: Provider Isolation
```bash
#!/bin/bash

# Login as Dr. Smith
SMITH_COOKIE=$(curl -s -c - -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.smith@clinicos.com","password":"DrSmith123!"}' \
  | grep "session-token" | awk '{print $7}')

# Try accessing Dr. Johnson's data
RESPONSE=$(curl -s -b "session-token=$SMITH_COOKIE" \
  http://localhost:3000/api/providers/dr-johnson-id)

# Should contain "Unauthorized"
echo $RESPONSE | grep -q "Unauthorized" && echo "✅ Provider isolation working" || echo "❌ Provider isolation FAILED"
```

### Test Script 2: Front Desk Access
```bash
#!/bin/bash

# Login as Front Desk
FD_COOKIE=$(curl -s -c - -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"frontdesk@clinicos.com","password":"FrontDesk123!"}' \
  | grep "session-token" | awk '{print $7}')

# Access all appointments
RESPONSE=$(curl -s -b "session-token=$FD_COOKIE" \
  http://localhost:3000/api/appointments)

# Should return appointments array
echo $RESPONSE | grep -q "appointments" && echo "✅ Front desk access working" || echo "❌ Front desk access FAILED"
```

## Manual Testing Checklist

### Authentication
- [ ] Login with valid credentials (Provider)
- [ ] Login with valid credentials (Front Desk)
- [ ] Login with invalid credentials fails
- [ ] Empty fields validation works
- [ ] Logout clears session
- [ ] Session persists across page refreshes

### Authorization
- [ ] Provider can access own data
- [ ] Provider cannot access other provider data
- [ ] Provider cannot access unrelated patients
- [ ] Front desk can access all data
- [ ] Unauthenticated users redirected to login

### API Routes
- [ ] GET /api/appointments (filtered by role)
- [ ] POST /api/appointments (role validation)
- [ ] GET /api/providers/[id] (authorization check)
- [ ] PATCH /api/providers/[id] (authorization check)

### Security
- [ ] HTTP-only cookies prevent XSS
- [ ] JWT tampering detected
- [ ] CSRF protection active
- [ ] Secure cookies in production

## Common Issues & Solutions

### Issue: Session not persisting
**Solution**: Check AUTH_SECRET is set correctly

### Issue: Always redirects to login
**Solution**: Check middleware matcher configuration

### Issue: "Unauthorized" for own data
**Solution**: Verify providerId is set correctly in session

### Issue: CORS errors
**Solution**: Check AUTH_URL matches your domain

## Production Testing

Before deploying:

1. ✅ Test with production database
2. ✅ Verify HTTPS cookies work
3. ✅ Test session timeout (30 days)
4. ✅ Test concurrent sessions
5. ✅ Load test authentication endpoints
6. ✅ Verify audit logging works
7. ✅ Test password complexity rules
8. ✅ Verify bcrypt performance

## Reporting Issues

When reporting auth issues, include:
- User role (PROVIDER/FRONT_DESK)
- Route or API endpoint
- Expected vs actual behavior
- Browser console errors
- Network tab details (sanitize tokens!)
- Session cookie presence (yes/no only)