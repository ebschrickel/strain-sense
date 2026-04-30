# StrainSense — Project

**Owner:** Resonant Labs LLC  
**Repo:** ~/projects/strain-sense/  
**Bundle ID:** com.resonantlabs.strainsense (confirm in App Store Connect)  
**Status:** MVP complete — submission-ready with 3-5 days of logistics  
**Last updated:** 2026-04-03

---

## What This Is

An AI-powered cannabis strain identification and logging app for dispensary professionals and serious enthusiasts. Camera → scan a label or flower → instant terpene profile, effects, use-case match. Native iOS + Android via React/Capacitor.

## The Market Gap

No mobile-first, professional-grade strain logging tool exists. Leafly and Weedmaps are consumer-facing and ad-driven. Budtenders use memory and handwritten notes. StrainSense is the structured, AI-powered alternative — fast enough for the counter, smart enough for professionals.

## Revenue Model

- Free: basic text analysis (client-side, no API calls)
- Premium ($0.99/month or $1.99/3 months): image scanning (OCR + Claude Vision)
- Future B2B: $9.99/month per dispensary license (unlimited scans, staff accounts)

**Stripe is connected.** IAP implementation queued for Phase 2.

---

## Phases

### Phase 1 — Vercel Backend + Web Deploy (COMPLETE ✅)
- ✅ React SPA built (src/StrainSense.jsx ~1,500 LOC)
- ✅ OCR via api/ocr.js (Vercel serverless → OCR.space)
- ✅ Claude Vision via api/analyze-image.js (Vercel serverless)
- ✅ Capacitor configured (iOS + Android scaffolded)
- ✅ App icons: iOS 1024×1024 + full Android mipmap set
- ✅ npm run build passes clean (266 KB JS / 81 KB gzipped)
- ⚠️ VITE_API_URL not set for production → image scanning silent-fails on device

### Phase 2 — AWS Lambda Backend (BLOCKED — Awaiting AWS Credentials)
**Purpose:** Replace Vercel serverless with Lambda + API Gateway for better scalability, lower cost, and AWS Marketplace path  
**Architecture:**
- Lambda: strainsense-ocr (port api/ocr.js)
- Lambda: strainsense-analyze (port api/analyze-image.js)
- API keys in AWS SSM Parameter Store (not env vars)
- API Gateway HTTP API → both Lambdas
- VITE_API_URL → API Gateway endpoint

**Blocker:** AWS IAM user credentials (ACCESS_KEY_ID + SECRET_ACCESS_KEY) not present. Brooke to provide.  
**Estimated build time when unblocked:** 2-3 hours  
**Reference:** ~/Obsidian/Ben/Scurry/agent-output/engineering/strainsense-lambda-2026-04-01.md

### Phase 3 — iOS App Store Submission
**Trigger:** Lambda backend deployed + VITE_API_URL set  
**Pre-submission checklist:**
- [ ] Add NSCameraUsageDescription + NSPhotoLibraryUsageDescription to Info.plist
- [ ] Verify bundle ID registered in App Store Connect (com.resonantlabs.strainsense)
- [ ] Set VITE_API_URL in .env.production
- [ ] npm run build → npx cap sync ios → archive in Xcode
- [ ] Screenshots: iPhone 14 Pro Max (6.7") + iPad 12.9" — minimum 3 each
- [ ] Privacy policy at resonantlab.ai/privacy (required by Apple)
- [ ] App category: Health & Fitness
- [ ] Age rating: 17+ (cannabis content)
- [ ] Apple Developer enrollment ($99/year) — submitted 2026-04-02, awaiting confirmation

### Phase 4 — Android Google Play Submission
**Trigger:** iOS approved or parallel with Phase 3  
**Pre-submission checklist:**
- [ ] Add CAMERA + READ_MEDIA_IMAGES to AndroidManifest.xml
- [ ] Google Play Developer account ($25 one-time)
- [ ] Build signed AAB
- [ ] Content rating: Drugs category → 18+

### Phase 5 — Monetization (Premium Scans + IAP)
**Trigger:** Both stores live  
**Scope:** Implement Stripe/IAP purchase flow for scan credits

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + Capacitor | Cross-platform from one codebase; already built |
| Backend | Vercel (Phase 1) → AWS Lambda (Phase 2) | Start fast, migrate to infra we control |
| API Keys | Serverless env vars → AWS SSM | SSM is more secure, required for AWS Marketplace |
| App ID | com.resonantlabs.strainsense | Aligns with Resonant Labs branding |
| Age rating | 17+ iOS / 18+ Android | Cannabis content — required |

---

## Open Questions

1. **AWS credentials**: when does Brooke add them? Unblocks Lambda backend.
2. **Bundle ID**: LOCKED to com.resonantlabs.strainsense (Apple Dev portal registered 2026-04-17, Xcode + capacitor + Android all updated 2026-04-18)
3. **Privacy policy**: needs to exist at resonantlab.ai/privacy before submission

---

## Files & References

- Ship plan: ~/Obsidian/Ben/Scurry/agent-output/engineering/strainsense-ship-plan.md
- Lambda design: ~/Obsidian/Ben/Scurry/agent-output/engineering/strainsense-lambda-2026-04-01.md
- Marketing positioning: ~/Obsidian/Ben/Scurry/agent-output/marketing/creative-2026-04-02.md
