# Shadow Shelf

**Cognitive Legacy Platform**

> *The people who shape us shouldn't have to disappear.*

Personal project (2026). Shadow Shelf is a full-stack AI app that builds a **personal cognitive clone** by learning how someone communicates, decides, and shows personality—through ongoing **voice and text** sessions.

**Architecture:** a **training phase** (structured dialogue with continuous LLM-based personality extraction) and a **clone phase** (personality-conditioned chat with **ElevenLabs** speech synthesis so the clone can sound like you).

---

## Features

- **Training mode** — Daily-style questions; the system refines tone, values, opinions, vocabulary, and thinking style. Profile feedback in the UI.
- **Clone mode** — Visitors chat with the clone in your style; optional voice input (Whisper) and voice output (ElevenLabs).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| App | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4 |
| LLM | [Ollama](https://ollama.com) — **Phi-3 Mini** (`phi3:mini`), local inference |
| Speech-to-text | OpenAI **Whisper** API |
| Text-to-speech | **ElevenLabs** API |
| Data | **Prisma** 5 + **SQLite** (personality, messages, memories) |

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Ollama](https://ollama.com) installed and running

---

## Setup

### 1. Ollama and model

```bash
ollama pull phi3:mini
ollama serve
```

### 2. Install dependencies

```bash
cd shadow-shelf
npm install
```

### 3. Environment variables

Create `.env.local` in the project root (this file is gitignored):

```env
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

- **OpenAI** — used for Whisper transcription (voice → text).
- **ElevenLabs** — used for speech synthesis (clone voice output).

Core text chat with Ollama can run **without** API keys; voice features need the keys above.

### 4. Database

```bash
npx prisma migrate dev
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing |
| `/train` | Training — build / refine the profile |
| `/clone` | Clone — talk to the cognitive clone |

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
│   └── api/
│       ├── chat/           # Ollama streaming chat
│       ├── personality/    # Profile CRUD
│       ├── memory/         # Long-term memory snippets
│       ├── transcribe/     # Whisper STT
│       ├── synthesize/     # ElevenLabs TTS
│       └── health/
├── components/
├── lib/                    # ollama, personality, prompts, prisma, …
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── data/                   # seed / static assets as used by the app
```
