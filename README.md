# Shadow Shelf

**Cognitive Legacy Platform**

> *The people who shape us shouldn't have to disappear.*

Personal project (2026). Shadow Shelf is a full-stack AI app that builds a **personal cognitive clone** by learning how someone communicates, decides, and shows personality—through ongoing **voice, text, and coding** sessions.

**Architecture:** a **training phase** (structured dialogue and background activity extraction) and a **clone phase** (personality-conditioned chat with **ElevenLabs** speech synthesis so the clone can sound like you).

---

## Features

- **Training mode** — Daily-style questions; the system refines tone, values, opinions, vocabulary, and thinking style. Profile feedback in the UI.
- **Jarvis Mode (VS Code Extension)** — A background Scout that securely monitors your coding workflow (active tabs, file saves, terminal errors, and idle time) to map your developer cognitive profile.
- **Clone mode** — Visitors chat with the clone in your style; optional voice input (Whisper) and voice output (ElevenLabs).
- **Premium Dashboards** — View your cognitive profiles and raw data assets via specialized, glassmorphism-themed dashboards.
- **Privacy Controls** — Full data export and hard-deletion capabilities, per-stream consent toggles, and secure OAuth-style Magic Link authentication for the VS Code extension.

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
| IDE Integration | **VS Code Extension API** (TypeScript) |

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- Supabase Project (with `pgvector` and `pgcrypto` extensions enabled)
- Visual Studio Code (for Jarvis Mode)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env` in the project root (this file is gitignored):

```env
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
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
| `/data-asset` | Data Asset Dashboard — view raw extracted data tables |
| `/settings` | Settings & Consent Ledger — manage privacy, voice, data export, API keys |
| `/vscode-auth` | Magic Link dispatcher for secure VS Code Extension authentication |

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
│   ├── data-asset/page.tsx
│   ├── settings/page.tsx
│   ├── vscode-auth/page.tsx
│   └── api/
│       ├── chat/           # RAG retrieval & OpenRouter streaming chat
│       ├── personality/    # Profile CRUD
│       ├── memory/         # Long-term memory pgvector snippets
│       ├── transcribe/     # Groq Whisper STT
│       ├── synthesize/     # ElevenLabs TTS
│       ├── account/        # Export & Delete logic
│       ├── consent/        # Consent Ledger
│       ├── user/           # User settings (API keys)
│       ├── scout/          # VS Code extension signal receivers
│       └── health/
├── components/             # Reusable UI components (Glass cards, ChatBubbles, etc.)
├── lib/                    # OpenRouter, Embeddings, Prisma, Rate Limit
├── prisma/
│   ├── schema.prisma       # Full multi-user PostgreSQL schema
│   └── migrations/
├── public/
│   └── shadow-shelf-0.1.0.vsix  # Compiled VS Code Extension
├── vscode-extension/       # Jarvis Mode (VS Code Extension) source code
└── data/                   # Initial project reference docs
```
