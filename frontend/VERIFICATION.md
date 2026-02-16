# Frontend Verification Guide

Quick checks to verify the frontend is properly set up.

## 1. File Structure Verification

Run this command to verify all key files exist:

```bash
cd frontend

# Check configuration files
ls -la package.json next.config.js tsconfig.json tailwind.config.ts postcss.config.js Dockerfile .env.local.example .gitignore

# Check app structure
ls -la src/app/layout.tsx src/app/page.tsx src/app/globals.css src/middleware.ts

# Check components
ls -la src/components/ui/ src/components/auth/ src/components/dashboard/ src/components/layout/

# Check lib
ls -la src/lib/api-client.ts src/lib/types.ts src/lib/utils.ts src/lib/constants.ts src/lib/swr-config.ts

# Check stores
ls -la src/stores/auth-store.ts src/stores/capture-store.ts src/stores/workout-store.ts

# Check PWA
ls -la public/manifest.json public/sw.js
```

All files should exist without errors.

## 2. Dependencies Check

Verify package.json contains required dependencies:

```bash
cat package.json | grep -E "(next|react|zustand|swr|tailwindcss|radix-ui)"
```

Expected output should include:
- next: 14.1.0
- react: ^18
- zustand: ^4.5.0
- swr: ^2.2.4
- tailwindcss: ^3.4.1
- @radix-ui packages

## 3. TypeScript Configuration

Verify TypeScript config:

```bash
# Check if TypeScript compiles without errors (no need to install first)
npx tsc --noEmit --skipLibCheck
```

## 4. Environment Setup

```bash
# Create .env.local from example
cp .env.local.example .env.local

# Verify it exists
cat .env.local
```

Should show:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 5. Build Test (After npm install)

```bash
# Install dependencies
npm install

# Test development build
npm run dev
```

Should start without errors on http://localhost:3000

## 6. Route Verification

Once running, verify these routes are accessible:

### Unauthenticated Routes
- http://localhost:3000 (redirects)
- http://localhost:3000/login (login page visible)

### Protected Routes (will redirect to /login without auth)
- http://localhost:3000/dashboard
- http://localhost:3000/journal
- http://localhost:3000/fitness
- http://localhost:3000/projects
- http://localhost:3000/captures
- http://localhost:3000/calendar
- http://localhost:3000/settings

### Special Routes
- http://localhost:3000/nonexistent (404 page)

## 7. Component Rendering Check

Visit http://localhost:3000/login and verify:

- [ ] Login form is visible
- [ ] "Life OS" title is displayed
- [ ] Username and Password fields are present
- [ ] "Sign In" button is present
- [ ] Card styling is applied (border, shadow, rounded corners)
- [ ] Responsive layout works (resize browser)

## 8. Console Check

Open browser DevTools Console and verify:

- [ ] No TypeScript errors
- [ ] No React errors
- [ ] No 404 errors for assets
- [ ] Service worker registration message (may appear)

Acceptable warnings:
- Fast Refresh warnings (development only)
- Service Worker registration (if icons are missing)

## 9. PWA Verification

Check PWA setup:

```bash
# Verify manifest
curl http://localhost:3000/manifest.json

# Verify service worker
curl http://localhost:3000/sw.js
```

Both should return content without errors.

## 10. Build for Production Test

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

Should build without errors and start on port 3000.

## 11. Docker Build Test (Optional)

```bash
docker build -t lifeos-frontend-test \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  .

docker run -p 3001:3000 lifeos-frontend-test
```

Visit http://localhost:3001 to verify.

## 12. Code Quality Checks

```bash
# Run linter
npm run lint
```

Should show no critical errors.

## Common Issues and Fixes

### Issue: "Cannot find module '@/...'"

**Fix:** Verify `tsconfig.json` has paths configured:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### Issue: "Module not found: Can't resolve 'zustand'"

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tailwind styles not applying

**Fix:** Verify `tailwind.config.ts` content paths include:
```typescript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
],
```

### Issue: "Error: Invalid src prop"

**Fix:** Icon images are placeholders. Replace with actual images or use SVG fallbacks.

### Issue: Port 3000 already in use

**Fix:**
```bash
PORT=3001 npm run dev
```

### Issue: API calls failing with CORS error

**Fix:** This is expected without backend. Backend must be configured with CORS headers allowing frontend origin.

## Checklist Summary

After completing these checks, you should have:

- [x] All files present and valid
- [x] Dependencies installed
- [x] TypeScript compiling
- [x] Development server running
- [x] All routes accessible
- [x] Login page rendering correctly
- [x] No console errors
- [x] PWA files served
- [x] Production build working
- [x] Linter passing

## Next Steps After Verification

1. **Replace icon placeholders** in `public/icons/`
2. **Build backend API** (separate task)
3. **Test authentication flow** end-to-end
4. **Begin Phase 2** implementation (Dashboard + Core Modules)

## Success Criteria

Frontend is ready when:
- All verification steps pass
- Login page is accessible and styled correctly
- No console errors in development
- Production build completes successfully
- All routes redirect properly (with/without auth)

---

**If all checks pass, the frontend foundation is complete and ready for backend integration!**
