# AUTHENTICATION & USER EXTENSION - COMPLETE DOCUMENTATION

## Overview
Extended authentication system with mandatory phone numbers, email OTP verification, password visibility toggles, and payment readiness (no live calls).

**Implementation Date**: January 19, 2026  
**Status**: ✅ Complete, Production-Ready

---

## 🔐 SECTION 1: PAYMENT GATEWAY (PREP ONLY)

### Status
Payment system is **prepared** but **NOT calling Razorpay APIs**.

### Fields in Order Schema
```typescript
payment: {
  razorpayOrderId: String,       // Will be set when payment starts
  razorpayPaymentId: String,     // Set after successful payment
  razorpaySignature: String,     // For payment verification
  status: enum ['pending', 'completed', 'failed'], // default: 'pending'
  amount: Number,                 // Amount in INR
  currency: String,               // default: 'INR'
}
```

### Order Flow WITHOUT Payment
1. Order created with `payment.status = 'pending'`
2. Order remains usable (stock is already reserved)
3. Admin can confirm/pack/ship WITHOUT payment
4. Payment status does NOT block operations

### When Ready to Integrate Razorpay
1. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env.local`
2. Uncomment Razorpay calls in `/app/api/checkout/route.ts`
3. Set `payment.razorpayOrderId` after API response
4. Verify payment signature before marking as completed

---

## 👁️ SECTION 2: PASSWORD VISIBILITY TOGGLE

### Feature
- Eye icon to toggle between `type="password"` and `type="text"`
- Works on Login and Register pages
- Accessible and keyboard-safe
- No validation/submission logic changes

### Pages Updated
1. **Login** - `app/login/page.tsx`
2. **Register** - `app/register/page.tsx`

### Implementation
```tsx
const [showPassword, setShowPassword] = useState(false);

<input type={showPassword ? 'text' : 'password'} />
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? '👁️' : '👁️‍🗨️'}
</button>
```

---

## 📱 SECTION 3: MOBILE NUMBER AS MANDATORY FIELD

### User Schema Updates
```typescript
phoneNumber: {
  type: String,        // 10-digit number
  required: true,      // Mandatory for all users
  unique: true,        // No duplicates
}

isPhoneVerified: {
  type: Boolean,
  default: false,      // Verified after OTP check
}
```

### Registration Requirements
- Phone number is MANDATORY
- Must be 10 digits (Indian format)
- Must be unique (no duplicates allowed)
- Validation: `^[0-9]{10}$`

### Validation Error Messages
- "Invalid phone number. Must be 10 digits."
- "Phone number already registered"

---

## 📧 SECTION 4: OTP VERIFICATION (EMAIL/PHONE)

### OTP Service (`src/lib/otpService.ts`)

#### Functions
1. **generateOTP()** - Creates 6-digit OTP
2. **getOTPExpirationTime()** - Returns expiration (10 minutes)
3. **isOTPExpired()** - Check if expired
4. **verifyOTP()** - Validate provided OTP against stored
5. **sendEmailOTP()** - Send to email (✅ Fully functional)
6. **sendPhoneOTP()** - Send via SMS (⏳ Stubbed, logs only)

### User Schema OTP Fields
```typescript
otp: {
  type: String,
  select: false,       // Hidden by default for security
}

otpExpiresAt: {
  type: Date,
  select: false,
}

otpType: {
  type: String,        // 'email' or 'phone'
  enum: ['email', 'phone'],
  default: 'email',
  select: false,
}

isEmailVerified: {
  type: Boolean,
  default: false,      // Must verify via OTP
}
```

### Registration Flow
```
1. User submits registration form
   ↓
2. System validates phone number (10 digits, unique)
   ↓
3. Generate OTP and store in User document
   ↓
4. Send OTP to email (sendEmailOTP)
   ↓
5. Redirect to /verify-otp page
   ↓
6. User enters OTP
   ↓
7. API verifies OTP (not expired, matches)
   ↓
8. Set isEmailVerified = true, clear OTP
   ↓
9. Generate JWT token, set cookie
   ↓
10. Auto-login and redirect to home
```

### OTP Verification API
**Endpoint**: `POST /api/auth/verify-otp`

**Request**:
```json
{
  "userId": "objectId",
  "otp": "123456",
  "otpType": "email"
}
```

**Success Response** (200):
```json
{
  "message": "Email verified successfully. You are now logged in.",
  "userId": "...",
  "email": "user@example.com"
}
```

**Error Responses**:
- 404: User not found
- 400: OTP expired, incorrect, or missing

### Resend OTP API
**Endpoint**: `PUT /api/auth/verify-otp`

**Request**:
```json
{
  "userId": "objectId",
  "otpType": "email"
}
```

---

## 🔄 SECTION 5: BACKWARD COMPATIBILITY

### Problem
Existing users don't have `phoneNumber` field (required now).

### Solution
Migration script auto-assigns placeholder phone numbers to existing users.

### Migration Script
**File**: `src/scripts/migrate-users.ts`

**What It Does**:
1. Finds all users without `phoneNumber`
2. Generates unique 10-digit placeholder (format: `99xxxxxxxx`)
3. Sets `isPhoneVerified = true` (existing users marked verified)
4. Sets `isEmailVerified = true` (existing users assumed verified)
5. Clears OTP fields

**Safety**:
- ✅ No user deletion
- ✅ No data loss
- ✅ No login failures
- ✅ Idempotent (safe to run multiple times)

**How to Run**:
```bash
# Method 1: Direct Node execution
npx ts-node src/scripts/migrate-users.ts

# Method 2: Inside your application initialization
// In your app startup code:
import migrateExistingUsers from '@/scripts/migrate-users';
await migrateExistingUsers();
```

**Example Output**:
```
[MIGRATION] Starting backward compatibility migration...
[MIGRATION] Found 5 users to migrate
[MIGRATION] ✓ user1@example.com → 9912345678
[MIGRATION] ✓ user2@example.com → 9987654321
[MIGRATION] =================================
[MIGRATION] Migrated: 5
[MIGRATION] Failed: 0
[MIGRATION] =================================
```

### Existing User Login
After migration, existing users can login with email + password:
1. Email/password validated ✓
2. Check `isEmailVerified` (now true for existing) ✓
3. Set JWT cookie ✓
4. Redirect to home ✓

**No OTP required** for existing users (backwards compatible).

---

## 🧪 SECTION 6: VERIFICATION CHECKLIST

### ✅ Authentication Flow
- [x] New users MUST provide phone number
- [x] Phone number validated (10 digits)
- [x] Phone number uniqueness enforced
- [x] New users get OTP sent to email
- [x] OTP verification required before login
- [x] After OTP verified, auto-login
- [x] Password visibility toggle works

### ✅ Password Visibility
- [x] Login page has eye toggle
- [x] Register page has eye toggle
- [x] Toggles between password/text
- [x] No security issues
- [x] Accessible (proper aria-labels)

### ✅ Mobile Number
- [x] User model has phoneNumber (required, unique)
- [x] Registration form asks for phone
- [x] Phone validated as 10 digits
- [x] Duplicates rejected with error
- [x] Existing users migrated safely

### ✅ OTP System
- [x] 6-digit OTP generated
- [x] 10-minute expiration
- [x] Email OTP functional
- [x] Phone OTP stubbed (logs only)
- [x] Resend OTP works
- [x] Verification clears OTP after use

### ✅ Backward Compatibility
- [x] Existing users can still login
- [x] No login failures
- [x] No order failures
- [x] No admin access issues
- [x] Migration script idempotent
- [x] Orders still work

### ✅ Payment Readiness
- [x] Payment fields in Order schema
- [x] No live Razorpay API calls
- [x] paymentStatus: pending|completed|failed
- [x] System works without Razorpay keys
- [x] Orders processable without payment
- [x] Stock reserved on order creation

---

## 📋 FILES CREATED/UPDATED

### Created
1. `src/lib/otpService.ts` - OTP generation/verification
2. `src/models/User.ts` - Updated with phone + OTP fields (modified)
3. `app/api/auth/verify-otp/route.ts` - OTP verification endpoint
4. `app/verify-otp/page.tsx` - OTP entry page
5. `src/scripts/migrate-users.ts` - Migration script

### Updated
1. `app/login/page.tsx` - Added password visibility toggle
2. `app/register/page.tsx` - Added phone field + password toggle
3. `app/api/auth/register/route.ts` - Phone validation + OTP generation
4. `app/api/auth/login/route.ts` - Check email verified before login

---

## 🔧 CONFIGURATION

### Environment Variables
No new environment variables needed. System works with existing:
```env
MONGODB_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Optional (when ready):
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

## 🚀 DEPLOYMENT CHECKLIST

1. **Before deploying**:
   - Run migration script: `npm run migrate:users`
   - Verify no errors in console
   - Test with existing user: login should work

2. **After deploying**:
   - New registrations require phone number
   - New users must verify email via OTP
   - Existing users login normally (already verified)
   - Password eye toggle works

3. **Optional - Add Razorpay**:
   - Get test mode keys from https://dashboard.razorpay.com/
   - Add to `.env.local`
   - Uncomment Razorpay API calls
   - Test checkout flow

---

## 🐛 TROUBLESHOOTING

### "Phone number already registered"
- User trying to register with phone already in system
- Solution: Use different phone number or login if existing user

### "OTP has expired"
- OTP valid for 10 minutes only
- Solution: Click "Resend OTP" button on verify page

### "Email already registered"
- Email exists in database
- Solution: Login or use password reset (if implemented)

### Existing user can't login
- Run migration script to add phone numbers
- Verify migration ran successfully
- Check database `isEmailVerified = true`

---

## 📞 PHONE OTP IMPLEMENTATION (FUTURE)

When ready to add SMS:

1. Choose SMS provider (Twilio, AWS SNS, etc.)
2. Add credentials to `.env`
3. Update `sendPhoneOTP()` in `otpService.ts`
4. Uncomment phone OTP in registration (currently email-only)
5. Test with both email and phone OTP

---

## ✅ IMPLEMENTATION STATUS: COMPLETE

All sections implemented and tested.  
System is **production-ready** with full backward compatibility.
