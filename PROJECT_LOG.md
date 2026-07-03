# Shadow Shelf — Project Log

Running log of all changes, updated every task loop per §7 of the Master Build Spec.

---

## Task 1: Infrastructure Foundation
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Set up Supabase PostgreSQL with pgvector + pgcrypto
- Rewrote Prisma schema for production multi-user (6 models)
- Created Supabase client helpers (`client.ts`, `server.ts`, `middleware.ts`) and root `proxy.ts` (Next.js 16 breaking change from `middleware.ts`)
- Created foundational project docs (`.env.example`, `AGENTS.md`)
- Migrated database schema successfully via `prisma db push`

## Task 2: Auth (Signup/Login)
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created Next.js Server Actions for Supabase Auth (signUp, signIn, signOut)
- Built sleek `/login` and `/signup` UI pages
- Added automatic DB provisioning in `getDbUser()` for new Supabase signups
- Implemented route protection in middleware (redirecting unauthenticated users to `/login`)
- Added global sign-out button to root layout

## Task 3: Onboarding Conversation
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `getUserState` and `updateUserName` Server Actions
- Redesigned `app/train/page.tsx` into a multi-user "Onboarding & Calibration" page
- Built visual Trust Depth (Level 1-5) indicator in the sidebar
- Updated Name Gate to modify the new `User` table directly
- Added subtle `turn_goal` developer badges to ChatBubble UI

## Task 4: Cognitive Processing
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `lib/llm.ts` to seamlessly route to OpenRouter (or fallback to Ollama)
- Created `lib/embeddings.ts` with safe fallback vectors
- Rewrote `lib/memory.ts` to use Prisma raw SQL queries for pgvector `<=>` similarity search
- Refactored `lib/personality.ts` to use new multi-user versioning schema
- Re-architected `/api/chat` to pull Trust Depth, calculate Turn Goals, and perform RAG retrieval

### Unblocked
- Tasks 5, 6, 7, 9, 10, 11, 13

## Task 5+7: Trust-Signal Estimator + pgvector Memory
**Status:** Completed (merged into Task 4)
**Completed:** 2026-07-03

### What Changed
- Trust Depth, `determine_turn_goal`, and pgvector memory recall all implemented as part of the Task 4 rewrite.

## Task 6: Personality Profile Capture Flow
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `/profile` route with a premium glassmorphic dashboard
- Displays Trust Depth, Communication Style, Thinking Patterns, Emotional Profile, Knowledge Domains
- Shows Clone Completeness score (0-100%)
- Added global navigation bar (Onboarding | Clone Chat | Profile | Settings | Sign Out)

## Task 9: Feedback UI
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Added thumbs up/down + correction text UI to `ChatBubble.tsx`
- Created `/api/feedback` route to persist feedback to the `Feedback` table
- Validates message ownership before storing

## Task 10: Account Export & Delete
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `/api/account/export` — full JSON export of all user data (GDPR-compliant)
- Created `/api/account/delete` — hard deletion of all data including vector rows, then signs out
- Explicit dependency-ordered deletion (Feedback → Consent → Memory → Messages → Personality → User)

## Task 11: Consent Ledger UI
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `/api/consent` (GET for current state, POST for immutable ledger append)
- Created `/settings` page with per-stream toggle switches (voice, text, memory, personality)
- Added export + account deletion to the Settings page
- IP address captured for audit trail

## Task 13: Rate Limiting
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Created `lib/rate-limit.ts` — sliding window rate limiter (20 req/60s per user)
- Integrated into `/api/chat` route with 429 responses
- Automatic memory cleanup via `setInterval` to prevent leaks

## Task 8: Voice Infrastructure
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Confirmed Whisper STT (via Groq) is integrated directly into `VoiceInput.tsx`
- Confirmed ElevenLabs TTS is integrated into `speakText` function in clone mode

## Task 12: Sentry Observability
**Status:** Completed
**Completed:** 2026-07-03

### What Changed
- Installed `@sentry/nextjs`
- Created `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Wrapped `next.config.ts` with `withSentryConfig`
- Created `/api/debug/sentry` to deliberately trigger an error for testing

## Code Fixes (Final Verified Record)
**Status:** Completed
**Completed:** 2026-07-03

### Summary of Fixes
| # | Issue | Status |
|---|---|---|
| 1 | Clone mode instructed to deny being an AI, even if asked directly | ✅ Fixed |
| 2 | Onboarding prompt dug into reasoning on day one | ✅ Fixed |
| 3 | `turn_goal` was a free LLM call | ✅ Fixed |
| 4 | `depthRung` set to 1 on signup, never advanced anywhere | ✅ Fixed |
| 5 | Account deletion signs out the session but never removes the Supabase `auth.users` record | ✅ Fixed |
| 6 | Embedding fallback silently returned a mock vector | ✅ Fixed |
| 7 | Default OpenRouter model diverged from the cost-efficient default | ✅ Fixed |

**Crisis-detection boundary:** re-checked on post-fix code. Zero matches for crisis/suicide/self-harm/wellbeing logic anywhere in the repo. Task 15's checkpoint has held.

### Remaining
- Task 14: Deploy to Vercel
