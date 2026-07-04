# Shadow Shelf Project Architecture

## Overview

Shadow Shelf is a Next.js App Router project for building a personal cognitive clone. It combines:
- a training experience to capture personality and communication style,
- a clone experience for chatting with a personality-conditioned AI,
- backend API routes for chat, memory, transcription, speech synthesis, and auth-related flows.

## Full Folder Tree

```text
shadow-shelf/
├── .env
├── .env.example
├── .git/
├── .gitignore
├── .next/
├── AGENTS.md
├── CLAUDE.md
├── app/
│   ├── actions/
│   │   ├── auth.ts
│   │   └── user.ts
│   ├── api/
│   │   ├── account/
│   │   │   ├── delete/
│   │   │   │   └── route.ts
│   │   │   └── export/
│   │   │       └── route.ts
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── consent/
│   │   │   └── route.ts
│   │   ├── debug/
│   │   │   └── sentry/
│   │   │       └── route.ts
│   │   ├── feedback/
│   │   │   └── route.ts
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── memory/
│   │   │   └── route.ts
│   │   ├── personality/
│   │   │   └── route.ts
│   │   ├── synthesize/
│   │   │   └── route.ts
│   │   └── transcribe/
│   │       └── route.ts
│   ├── clone/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── train/
│   │   └── page.tsx
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ChatBubble.tsx
│   ├── CloneAvatar.tsx
│   ├── PersonalityStats.tsx
│   ├── SignOutButton.tsx
│   ├── UserMenu.tsx
│   └── VoiceInput.tsx
├── data/
│   └── personality.json
├── lib/
│   ├── api-balancer.ts
│   ├── auth.ts
│   ├── depth-rung.ts
│   ├── embeddings.ts
│   ├── llm.ts
│   ├── memory.ts
│   ├── ollama.ts
│   ├── personality.ts
│   ├── prisma.ts
│   ├── prompts.ts
│   ├── questions.ts
│   ├── rate-limit.ts
│   ├── turn-goal.ts
│   └── supabase/
│       ├── admin.ts
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260626051419_init/
│           └── migration.sql
├── public/
├── next-env.d.ts
├── next.config.ts
├── node_modules/
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── PROJECT_LOG.md
├── proxy.ts
├── README.md
├── sentry.client.config.ts
├── sentry.edge.config.ts
├── sentry.server.config.ts
├── ShadowShelf_MASTER_BUILD_SPEC.md
├── spec.json
├── spec_dump.txt
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## Main Architecture Areas

### 1. App Layer
The UI and routes live in the app directory.
- app/page.tsx → landing page
- app/train/page.tsx → training experience
- app/clone/page.tsx → clone chat experience
- app/layout.tsx → app shell

### 2. UI Components
Reusable components are under components/.
- ChatBubble.tsx
- CloneAvatar.tsx
- PersonalityStats.tsx
- SignOutButton.tsx
- UserMenu.tsx
- VoiceInput.tsx

### 3. API Layer
Backend logic is handled by route handlers in app/api/.
- chat
- personality
- memory
- transcribe
- synthesize
- health
- account management
- feedback
- consent

### 4. Shared Logic
Core logic for AI, auth, memory, prompts, and Prisma is in lib/.
- llm.ts
- ollama.ts
- personality.ts
- memory.ts
- prisma.ts
- prompts.ts

### 5. Data Layer
Persistent storage and schema live in prisma/ and data/.
- prisma/schema.prisma
- data/personality.json

### 6. Tooling and Config
Project setup and tooling live at the root.
- package.json
- next.config.ts
- tsconfig.json
- sentry configs

## Summary

This project follows a typical Next.js full-stack structure:
- frontend pages in app/
- reusable UI in components/
- backend endpoints in app/api/
- shared business logic in lib/
- database schema in prisma/
