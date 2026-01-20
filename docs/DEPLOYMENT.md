# Vercel Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- GitHub account connected to Vercel
- All environment variables ready (see `.env.example`)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: day2 - Vercel ready with admin auth and OTP email"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository `swaraj404/Paithani_ecom`
4. Framework Preset: **Next.js** (auto-detected)
5. Root Directory: `./` (default)

### Step 3: Configure Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

**Required Variables:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=paithani
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete (~2-3 minutes)
- Your app will be live at `https://your-app.vercel.app`

## Post-Deployment Checklist

### Verify Core Features
- [ ] Home page loads
- [ ] Products page displays items
- [ ] User registration with OTP email delivery
- [ ] User login works
- [ ] Admin login at `/admin/login` works for admin users
- [ ] Cart operations (add/update/remove)
- [ ] Order placement
- [ ] Razorpay checkout modal opens
- [ ] Admin dashboard accessible (admin users only)
- [ ] Admin order management works
- [ ] Product image uploads via Cloudinary

### Security Checks
- [ ] `.env.local` not in git history
- [ ] All API keys in Vercel environment variables
- [ ] Admin routes protected (non-admins redirected)
- [ ] Middleware blocks unauthenticated access to protected routes
- [ ] OTP emails sending successfully
- [ ] JWT tokens secure and httpOnly

### Performance
- [ ] Static pages prerendered
- [ ] API routes responding quickly
- [ ] Images optimized via Cloudinary
- [ ] No console errors in browser

## Common Issues

### Build Fails
- Check all environment variables are set
- Ensure `@types/jsonwebtoken` is in devDependencies
- Verify MongoDB connection string is correct

### OTP Emails Not Sending
- Verify EMAIL_* variables in Vercel
- For Gmail: Use App Password, not regular password
- Check email user has 2FA enabled

### Razorpay Not Working
- Use test keys (`rzp_test_*`) for testing
- Verify keys are correctly copied (no extra spaces)
- Check Razorpay Dashboard for any restrictions

### Admin Access Issues
- Ensure user has `role: 'admin'` in MongoDB
- Check `/admin/login` route is accessible
- Verify middleware allows `/admin/login` as public

## Updating Deployment

After code changes:
```bash
git add .
git commit -m "your commit message"
git push origin main
```

Vercel auto-deploys on every push to main branch.

## Rollback

If deployment breaks:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
