# Shadow Shelf

**Cognitive Legacy Platform**

> *The people who shape us shouldn't have to disappear.*

Personal project (2026). Shadow Shelf is a full-stack AI app that builds a **personal cognitive clone** by learning how someone communicates, decides, and shows personality—through ongoing **voice and text** sessions.

**Architecture:** a **training phase** (structured dialogue with continuous LLM-based personality extraction) and a **clone phase** (personality-conditioned chat with **ElevenLabs** speech synthesis so the clone can sound like you).

---

## Features

- **Training mode** — Daily-style questions; the system refines tone, values, opinions, vocabulary, and thinking style. Profile feedback in the UI.
- **Clone mode** — Visitors chat with the clone in your style; optional voice input (Whisper) and voice output (ElevenLabs).
- **Dashboard** — Premium glassmorphism dashboard to view cognitive profiles.
- **Privacy Controls** — Full data export and hard-deletion capabilities, per-stream consent toggles.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| App | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| UI | Custom CSS Modules (Glassmorphism & Theming) |
| LLM | OpenRouter API (model agnostic) |
| Speech-to-text | **Whisper** API via Groq |
| Text-to-speech | **ElevenLabs** API |
| Data | **Supabase** (PostgreSQL + pgvector for embeddings) |
| Auth | **Supabase Auth** |
| ORM | **Prisma** 5 |

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- Supabase Project (with `pgvector` and `pgcrypto` extensions enabled)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root (this file is gitignored):

```env
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

GROQ_API_KEY="your_groq_key"
ELEVENLABS_API_KEY="your_elevenlabs_key"
OPENROUTER_API_KEY="your_openrouter_key"
OPENROUTER_MODEL="anthropic/claude-3-haiku"
```

### 3. Database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing |
| `/login` / `/signup` | Authentication |
| `/train` | Training — build / refine the profile (Onboarding) |
| `/clone` | Clone — talk to the cognitive clone |
| `/profile` | Profile Dashboard — view the extracted cognitive model |
| `/settings` | Settings & Consent Ledger — manage privacy, voice, data export |

---

## Voice clone (optional)

1. Record a few minutes of natural speech.
2. Create a voice in [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab).
3. Save the **Voice ID** on your personality record (via the app / API as implemented).
4. Use voice controls in Clone mode for TTS in that voice.

---

## Project layout

```
shadow-shelf/
├── app/
│   ├── page.tsx
│   ├── train/page.tsx
│   ├── clone/page.tsx
│   ├── profile/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── chat/           # RAG retrieval & OpenRouter streaming chat
│       ├── personality/    # Profile CRUD
│       ├── memory/         # Long-term memory pgvector snippets
│       ├── transcribe/     # Groq Whisper STT
│       ├── synthesize/     # ElevenLabs TTS
│       ├── account/        # Export & Delete logic
│       ├── consent/        # Consent Ledger
│       └── health/
├── components/             # Reusable UI components (Glass cards, ThemeToggle)
├── lib/                    # OpenRouter, Embeddings, Prisma, Rate Limit
├── prisma/
│   ├── schema.prisma       # Full multi-user PostgreSQL schema
│   └── migrations/
└── data/
```
