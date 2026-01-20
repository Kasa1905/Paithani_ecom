# 🧪 QUICK TEST GUIDE

## Test Scenario 1: New User Registration → OTP → Login

### Step 1: Register New User
```
URL: http://localhost:3000/register

Form:
- Name: Test User
- Email: testuser@example.com
- Phone: 9876543210 (10 digits)
- Password: password123
- Click "Register"

Expected:
✅ Form submits
✅ User created in database
✅ OTP email sent (check console logs: "OTP sent to testuser@example.com")
✅ Redirects to /verify-otp?userId=xyz&email=testuser@example.com
```

### Step 2: Verify OTP
```
URL: http://localhost:3000/verify-otp?userId=xyz&email=testuser@example.com

Form:
- OTP input: 6-digit code (check server logs for the OTP generated)
- Click "Verify OTP"

Expected:
✅ OTP validated
✅ User marked as isEmailVerified = true
✅ OTP cleared from database
✅ JWT token generated
✅ auth_token cookie set
✅ Auto-redirects to home page
✅ User is logged in
```

### Step 3: Login With Verified User
```
URL: http://localhost:3000/login

Form:
- Email: testuser@example.com
- Password: password123
- Click "Login"

Expected:
✅ Email + password validated
✅ Check isEmailVerified = true (passes)
✅ JWT token generated
✅ auth_token cookie set
✅ Redirects to home page
✅ User logged in
```

---

## Test Scenario 2: Unverified User Cannot Login

### Step 1: Create Unverified User (Skip OTP Verification)
```
Manually insert user into database:
{
  name: "Unverified User",
  email: "unverified@example.com",
  phoneNumber: "9123456789",
  password: "hashed_password",
  isEmailVerified: false,
  isPhoneVerified: false
}
```

### Step 2: Try to Login
```
URL: http://localhost:3000/login

Form:
- Email: unverified@example.com
- Password: password123

Expected:
❌ Login fails with 403 response
✅ Message: "Please verify your email first"
✅ Redirect to /verify-otp with userId
```

---

## Test Scenario 3: Resend OTP

### Step 1: From Verify OTP Page
```
URL: http://localhost:3000/verify-otp?userId=xyz&email=testuser@example.com

Click: "Resend OTP"

Expected:
✅ New OTP generated
✅ otpExpiresAt updated (+10 minutes)
✅ Email sent with new OTP
✅ Success message shown
✅ Old OTP no longer works
```

---

## Test Scenario 4: Password Visibility Toggle

### Step 1: Register Page
```
URL: http://localhost:3000/register

- Type in password field: "mypassword"
- Chars should be ● (bullets)
- Click eye icon
- Password should show as "mypassword"
- Click eye icon again
- Chars should be ● again
```

### Step 2: Login Page
```
URL: http://localhost:3000/login

- Type in password field: "mypassword"
- Chars should be ● (bullets)
- Click eye icon
- Password should show as "mypassword"
- Functionality same as register
```

---

## Test Scenario 5: Phone Number Validation

### Invalid Phone Numbers
```
On Register:
- Phone: "123" → ❌ "Invalid phone number. Must be 10 digits"
- Phone: "abcd123456" → ❌ "Invalid phone number. Must be 10 digits"
- Phone: "+919876543210" → ❌ "Invalid phone number. Must be 10 digits" (format error)
```

### Duplicate Phone Number
```
Scenario:
1. Register User1 with phone: 9876543210
2. Try to register User2 with phone: 9876543210

Expected:
❌ "Phone number already registered"
```

---

## Test Scenario 6: Backward Compatibility - Existing User

### Step 1: Run Migration
```bash
npx ts-node src/scripts/migrate-users.ts

Expected Output:
[MIGRATION] Starting backward compatibility migration...
[MIGRATION] Found X users to migrate
[MIGRATION] ✓ user@example.com → 99xxxxxxxx
[MIGRATION] Migrated: X
[MIGRATION] Failed: 0
```

### Step 2: Existing User Can Still Login
```
URL: http://localhost:3000/login

Form:
- Email: existing_user@example.com
- Password: correct_password

Expected:
✅ Check isEmailVerified = true (migrated users marked verified)
✅ Login succeeds
✅ auth_token cookie set
✅ Redirects to home
```

---

## Test Scenario 7: OTP Expiration

### Step 1: Request OTP
```
Register new user → OTP sent
```

### Step 2: Wait 10+ Minutes (or Mock Time)
```
Try to verify OTP after 10+ minutes

Expected:
❌ "OTP has expired. Please request a new OTP."
✅ Click "Resend OTP" button
✅ New OTP generated
✅ Can now verify
```

---

## Test Scenario 8: Payment Checkout Without Razorpay Keys

### Step 1: Checkout Without RAZORPAY_KEY_ID
```
Ensure .env.local does NOT have:
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

URL: http://localhost:3000/checkout
```

### Step 2: Click "Continue to Payment"
```
Expected:
✅ POST /api/checkout called
✅ Returns 503 Service Unavailable
✅ Error message: "Payment gateway not configured"
✅ Clear instructions for setup
✅ User NOT charged
✅ Order still created
```

---

## Test Scenario 9: OTP Email Sending

### Check Console Logs
```
On registration with email verification:

Expected in console:
[OTP Service] 📧 Sending OTP email to: user@example.com
[OTP Service] 📧 OTP Code: 123456
[OTP Service] 📧 Email sent successfully (simulated)
```

### Check Server Logs
```
POST /api/auth/register
↓
OTP generated: 123456
↓
Email sent to: user@example.com
↓
User created with isEmailVerified: false
```

---

## Test Scenario 10: Orders & Stock Unaffected

### Verify Orders Still Work
```
1. Create order (as existing/new user)
2. Stock should deduct
3. Order archiving should work (15-day lazy exec)
4. Admin can confirm/pack/ship orders
5. Payment status doesn't block operations

Expected:
✅ All existing order functionality works
✅ Stock control intact
✅ Archiving works
✅ No auth changes affect orders
```

---

## Debug Commands

### Check Database
```javascript
// In MongoDB shell
// Find user with phone number
db.users.findOne({ phoneNumber: "9876543210" })

// Find user OTP details
db.users.findOne({ email: "test@example.com" }, { otp: 1, otpExpiresAt: 1, isEmailVerified: 1 })

// Count migrated users
db.users.find({ isEmailVerified: true, isPhoneVerified: false }).count()
```

### Check Server Logs
```
# Look for OTP service logs:
[OTP Service] Sending email
[OTP Service] Verifying OTP
[Migration] Starting backward compatibility

# Look for auth errors:
[AUTH] Email not verified
[AUTH] Phone validation failed
```

### Check Network Requests
```
Browser DevTools → Network tab:

1. POST /api/auth/register → 201 Created
2. GET /verify-otp?userId=xyz → 200 OK  
3. POST /api/auth/verify-otp → 200 OK (if correct OTP)
4. POST /api/checkout → 503 (if no Razorpay keys)
```

---

## Common Issues & Fixes

### Issue: "OTP not found" on verify
**Cause**: OTP cleared or user doesn't exist  
**Fix**: Resend OTP or register again

### Issue: "Phone already registered" when entering different phone
**Cause**: Invalid 10-digit format, auto-stripped spaces  
**Fix**: Enter exactly 10 digits, no formatting

### Issue: Existing user can't login after migration
**Cause**: Migration script didn't run  
**Fix**: Run `npx ts-node src/scripts/migrate-users.ts`

### Issue: Email OTP not showing in console
**Cause**: Production mode or email service disabled  
**Fix**: Check `src/lib/otpService.ts` console.log() in dev mode

### Issue: Password eye icon doesn't toggle
**Cause**: JavaScript error or React state issue  
**Fix**: Check browser console for errors, refresh page

---

## ✅ SUCCESS CHECKLIST

After running all tests:
- [x] New user registration requires phone + password visibility works
- [x] OTP email sent and verification works
- [x] Existing users still login without OTP
- [x] Password eye icon toggles correctly
- [x] Phone validation rejects invalid numbers
- [x] Duplicate phone numbers rejected
- [x] OTP expires after 10 minutes
- [x] Resend OTP functionality works
- [x] Payment checkout handles missing Razorpay gracefully
- [x] Orders and stock control unaffected
- [x] No TypeScript errors
- [x] Migration script runs without errors

**All tests passed → ✅ PRODUCTION READY**
