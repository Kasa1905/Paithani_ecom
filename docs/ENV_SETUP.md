# Environment Configuration Guide

Quick guide to set up environment variables for Razorpay integration.

## `.env.local` File

Create a `.env.local` file in the project root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret (keep this secret!)
JWT_SECRET=your-super-secret-jwt-key

# Razorpay Configuration (Test Mode - for development)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_test_mode_key_secret_here

# Email Configuration (SMTP for OTP delivery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Getting Your Razorpay Keys

### Step 1: Create Free Razorpay Account
1. Go to https://razorpay.com/
2. Click "Sign Up"
3. Enter your email and password
4. Verify your email

### Step 2: Access API Keys
1. Log in to https://dashboard.razorpay.com/
2. Click on your account → Settings
3. Go to "API Keys" section
4. You'll see **Test Mode** and **Live Mode** tabs

### Step 3: Get Test Mode Keys (for development)
1. Make sure you're on the **"Test Mode"** tab
2. You'll see two keys:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (looks like a long random string)
3. Copy both values

### Step 4: Add to `.env.local`
Replace the placeholder values with your actual keys:

```env
RAZORPAY_KEY_ID=rzp_test_<your_key_id>
RAZORPAY_KEY_SECRET=<your_key_secret>
```

## File Location

The `.env.local` file should be in your project root:

```
Paithani_ecom_Kasa/
├── .env.local          ← Create this file here
├── package.json
├── src/
├── app/
└── ...
```

## Important Notes

⚠️ **SECURITY:**
- Never commit `.env.local` to Git
- It's already in `.gitignore` - don't remove it
- Never share your key secret with anyone
- If you accidentally commit it, regenerate your keys immediately

✅ **DEVELOPMENT:**
- Use Test Mode keys for development
- Use test card: `4111 1111 1111 1111`
- No real money involved in test mode

🚀 **PRODUCTION:**
- Switch to Live Mode keys when deploying
- Update `.env` (not `.env.local`) on production server
- Test with real payment first
- Monitor transactions closely

## Verifying Setup

After adding the environment variables, restart your development server:

```bash
# Kill the current server (Ctrl + C)

# Restart it
npm run dev
```

You should see no errors about "Razorpay keys not configured".

## Testing Your Configuration

1. Navigate to a product page
2. Add item to cart
3. Click "Proceed to Checkout"
4. Place order
5. Go to checkout page
6. Click "Pay with Razorpay"
7. Modal should open without errors

If you get errors about missing keys:
1. Check `.env.local` exists
2. Verify key names are exactly: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
3. Restart development server
4. Clear browser cache

## Common Mistakes

❌ **Don't do this:**
```env
# Wrong - extra spaces
RAZORPAY_KEY_ID = rzp_test_your_key

# Wrong - missing key
RAZORPAY_KEY_SECRET=

# Wrong - using Live Mode keys in development
RAZORPAY_KEY_ID=rzp_live_your_key
```

✅ **Do this instead:**
```env
# Correct - no spaces around =
RAZORPAY_KEY_ID=rzp_test_your_key

# Correct - both keys present
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret_key_here

# Correct - use Test Mode for development
RAZORPAY_KEY_ID=rzp_test_your_key
```

## Switching Between Test and Live Modes

### For Development (Test Mode)
```env
RAZORPAY_KEY_ID=rzp_test_<your_test_key_id>
RAZORPAY_KEY_SECRET=<your_test_key_secret>
```

### For Production (Live Mode)
```env
RAZORPAY_KEY_ID=rzp_live_<your_live_key_id>
RAZORPAY_KEY_SECRET=<your_live_key_secret>
```

## Troubleshooting

### "Razorpay keys not configured"

**Solution:**
1. Check `.env.local` exists in project root
2. Check exact variable names:
   - `RAZORPAY_KEY_ID` (not `RAZORPAY_KEY` or `razorpay_key_id`)
   - `RAZORPAY_KEY_SECRET` (not `RAZORPAY_SECRET`)
3. Ensure no extra spaces: `KEY=value` (not `KEY = value`)
4. Restart development server after editing `.env.local`

### Keys work locally but not on server

**Solution:**
1. Verify environment variables are set on server
2. Use `rzp_test_` keys for staging, `rzp_live_` for production
3. Ensure keys are in correct environment file (`.env` for server, `.env.local` for local)

### "Invalid Key ID" Error

**Solution:**
1. Verify key starts with `rzp_test_` or `rzp_live_`
2. Check no extra spaces or characters
3. Regenerate keys in Razorpay Dashboard if needed
4. Restart server and clear browser cache

## Reference Variables

| Variable | Format | Example | Where Used |
|----------|--------|---------|-----------|
| `RAZORPAY_KEY_ID` | `rzp_test_<id>` or `rzp_live_<id>` | `rzp_test_your_key_here` | Frontend + Backend |
| `RAZORPAY_KEY_SECRET` | Long random string | `your_secret_key_here` | Backend only |
| `MONGODB_URI` | MongoDB connection string | See above | Backend only |
| `JWT_SECRET` | Any random string | `your-super-secret-jwt-key` | Backend only |
| `NEXT_PUBLIC_API_URL` | Full URL with protocol | `http://localhost:3000` | Frontend |
| `EMAIL_HOST` | SMTP server | `smtp.gmail.com` | Backend only |
| `EMAIL_USER` | Email address | `your-email@gmail.com` | Backend only |

## Example Complete `.env.local`

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Razorpay (Test Mode for Development)
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_test_secret_key

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Quick Checklist

- [ ] `.env.local` file created in project root
- [ ] `RAZORPAY_KEY_ID` added and correct format
- [ ] `RAZORPAY_KEY_SECRET` added and correct format
- [ ] No extra spaces or quotes around values
- [ ] Development server restarted
- [ ] No "keys not configured" errors
- [ ] Test payment works successfully

---

**Need Help?** Refer to the main [RAZORPAY_SETUP.md](RAZORPAY_SETUP.md) guide.
