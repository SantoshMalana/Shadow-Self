<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:shadow-shelf-context -->
# Shadow Shelf — Persistent Project Context

## Key Documents (read these at session start)
- **Master Build Spec:** `ShadowShelf_MASTER_BUILD_SPEC.md` — the complete architecture, backlog, and loop
- **Project Log:** `PROJECT_LOG.md` — running record of all changes, append-only
- **Schema:** `prisma/schema.prisma` — production database schema

## Current Phase
Stage 0 — personal companion MVP targeting YC application (July 27, 2026).

## Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase PostgreSQL + pgvector (embeddings) + pgcrypto (UUIDs)
- Supabase Auth (signup/login/session management)
- OpenRouter for LLM inference (model via env var, never hardcoded)
- ElevenLabs (TTS) + Groq Whisper (STT)
- Prisma ORM

## Non-Negotiable Rules
1. No hardcoded secrets — everything through env vars matching `.env.example`
2. Every external API call wrapped in real error handling with graceful degradation
3. Every task gets a Walkthrough Artifact before being marked done
4. PROJECT_LOG.md updated every loop, no exceptions
5. Do NOT build Stage 1/2 features (biometrics, enterprise pipeline, data licensing)
<!-- END:shadow-shelf-context -->
