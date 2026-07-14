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
Updates: Fix UI layout, remove duplicate name gates, implement ultra-low latency TTS streaming, and fix loading indicator latency
Updates: Redesigned landing page with glassmorphism aesthetics, CSS keyframe animations, hover states, and structural layout polish
Updates: Implemented live looping animation sequence for the landing page chat mockup
Updates: Implemented Light Mode architecture with full glassmorphism support and updated README.md

## Phase 1-5 Final Updates (Y-Combinator MVP Polish)
**Status:** Completed
**Completed:** 2026-07-13

### What Changed
- **Phase 1 (Critical Fixes):** Fixed TTS auto-play bug, added voice response toggle button, added mobile responsive navigation, fixed chat spacing, confirmed 303 redirect is expected Next.js behavior.
- **Phase 2 (CSS Foundation):** Consolidated all styling to Tailwind, removed all `.module.css` files, completely unified design system around CSS variables.
- **Phase 3 (Landing Page & UX):** Redesigned the landing page for Senior Engineers. Added privacy/data handling info, explained learning over time. Merged `/clone` and `/train` pages into a single ChatInterface component. Added keyboard accessibility for voice and form aria-labels.
- **Phase 4 (Intelligence):** Implemented topic-breadth tracking to prevent infinite loops, output composer tagging (`[GROUNDED]`, `[INFERRED]`, `[REFUSED]`), multi-model routing cascade, and Escalation-Tier model integration (fast model vs smart model based on keywords).
- **Phase 5 (CUDA / Strategic Pillars):**
  - **Cognitive Provenance Chain:** Refactored `personality.ts` to `ProvenancedTrait` with strict `sourceId` tracking for every derived trait back to the exact user message.
  - **Structured Decision Capture:** Added `Journey` format extraction to capture decision-making rationale natively.
  - **Data Asset Dashboard:** Created `/api/data-asset` and `/data-asset` dashboard UI to visualize provenance, decisions, and consent as an immutable ledger, proving the "Data as an Asset" value proposition.

All 23 tasks on the master fix list are now successfully integrated and the build is completely type-clean.

## Stage 1: Zero Knowledge Distillation
**Status:** Completed
**Completed:** 2026-07-14

### What Changed
- Added `AnonymousCognitiveModel` table to `prisma/schema.prisma` — completely anonymous, NO foreign key to `User`.
- Created `lib/zero-knowledge.ts` — full sanitization → extraction → embedding → anonymous storage pipeline.
- Wired into `app/api/chat/route.ts` as a background task alongside `storeMemory` and `extractTraits`.
- Updated `PROJECT_ARCHITECTURE.md` file tree.

### Design Decisions
- The `AnonymousCognitiveModel` table has zero traceability by design — no `userId` column, no relation, no cascade.
- The pipeline runs two sequential LLM passes: first a "shredder" pass strips all PII/company/tech names, then an "extractor" pass distills the cognitive framework.
- Domain tagging (e.g., `debugging`, `systems_architecture`, `security`) is extracted alongside each insight for future clustering.
- Embedding failures are non-fatal — insights are stored without vectors if the embedding API is unavailable.
- The pipeline is fire-and-forget: it never blocks the user's chat response.

### July 14, 2026 - Scout Architecture Implemented
- **Zero-Knowledge Pivot:** Removed Camera/Facial Capture and Biometrics from the roadmap due to privacy concerns.
- **Jarvis Mode (The Scout):** Implemented the 6-stage verification pipeline for proactive developer interventions.
- **Stages Built:** Signal Collection, Personal Anomaly Filter, Workflow Boundary Gate, Content Confidence Scoring, LLM Self-Critique, Tiered Affordance Selection.
- **Audit:** Fully integrated end-to-end PipelineAuditLog for monitoring funnel drop-off and model calibration.

### July 14, 2026 - Codebase Audit & Hardening
- **Type Safety:** Full typecheck passed (0 errors) across the entire Next.js project.
- **pgvector Integration:** Replaced Scout mock memory with actual pgvector raw SQL similarity search against both personal memories and the AnonymousCognitiveModel abstract layer.
- **Final Verification:** Next.js production build succeeded with no warnings.
