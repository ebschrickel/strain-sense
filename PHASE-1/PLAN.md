# StrainSense — Phase 1 Plan

**Phase:** 1 — Vercel Backend + Web Deploy  
**Status:** COMPLETE ✅ (code); BLOCKED on VITE_API_URL for device testing  
**Phase 2:** AWS Lambda — BLOCKED on AWS credentials

---

## Phase 1 Tasks

### Done ✅
- [x] React SPA built (src/StrainSense.jsx, ~1,500 LOC)
- [x] OCR backend: api/ocr.js (Vercel serverless → OCR.space)
- [x] Vision backend: api/analyze-image.js (Vercel serverless → Claude)
- [x] Capacitor configured — iOS + Android scaffolded
- [x] App icons: iOS 1024×1024 + Android full mipmap set
- [x] npm run build passes clean (266 KB / 81 KB gzipped)
- [x] Ship plan written: strainsense-ship-plan.md

### Blocked / Pending ⚠️
- [ ] VITE_API_URL set in .env.production → image scanning works on device
- [ ] Vercel deployment with ANTHROPIC_API_KEY + OCR_SPACE_API_KEY set in Vercel env vars

---

## Phase 1 Completion Criteria

Phase 1 is DONE when:
1. `npm run build` passes ✅ (already done)
2. Vercel deployment live with correct env vars
3. Image scanning works end-to-end on a real device or simulator

---

## Phase 2 Plan — AWS Lambda Backend

**Trigger:** AWS IAM credentials available  
**Estimated time:** 2-3 hours  

### Tasks
1. Create IAM user with Lambda + API Gateway + SSM Parameter Store permissions
2. Store ANTHROPIC_API_KEY and OCR_SPACE_API_KEY in SSM Parameter Store (SecureString)
3. Create Lambda: strainsense-ocr (port api/ocr.js)
4. Create Lambda: strainsense-analyze (port api/analyze-image.js)
5. Create API Gateway HTTP API, wire to both Lambdas, enable CORS
6. Test both endpoints end-to-end
7. Set VITE_API_URL → API Gateway endpoint in .env.production
8. npm run build → npx cap sync ios + android
9. Test on simulator/device

---

## Pre-App-Store Checklist (Phase 3)

### iOS
- [ ] Add Info.plist: NSCameraUsageDescription + NSPhotoLibraryUsageDescription
- [ ] Verify bundle ID: com.resonantlabs.strainsense in App Store Connect
- [ ] App Store screenshots: iPhone 14 Pro Max + iPad 12.9" (3+ each)
- [ ] Privacy policy at resonantlab.ai/privacy
- [ ] Age rating: 17+
- [ ] Apple Developer enrollment confirmed active

### Android
- [ ] AndroidManifest.xml: CAMERA + READ_MEDIA_IMAGES permissions
- [ ] Google Play Developer account
- [ ] Build signed AAB
- [ ] Content rating: Drugs → 18+
