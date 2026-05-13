# ◈ Shadow Shelf

**Cognitive Legacy Platform — MVP**

> *"The people who shape us shouldn't have to disappear."*

Shadow Shelf is a full-stack AI application that creates a personal cognitive clone by learning an individual's communication style, decision patterns, and personality through daily voice and text interactions.

---

## What It Does

**Two-phase architecture:**

1. **Training Mode** — You answer daily questions. The AI extracts your tone, values, opinions, vocabulary, and thinking style. Your personality profile builds visually in real-time.

2. **Clone Mode** — Anyone can now talk to your clone — text or voice — and it responds in your exact style, with your actual opinions, as you.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| LLM Inference | Ollama (Phi-3 Mini) — runs locally |
| Voice Input | OpenAI Whisper API |
| Voice Output | ElevenLabs Voice Cloning API |
| Personality Store | JSON flat file (upgradeable to DB) |

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Ollama](https://ollama.com) installed and running locally

### 1. Install Ollama & Pull Model

```bash
# Install Ollama from https://ollama.com
# Then pull the model:
ollama pull phi3:mini

# Start Ollama server
ollama serve
```

### 2. Clone & Install

```bash
cd shadow-shelf
npm install
```

### 3. Set Environment Variables

```bash
cp .env.local .env.local
```

Edit `.env.local`:
```env
ELEVENLABS_API_KEY=your_key_here   # For voice output
OPENAI_API_KEY=your_key_here       # For voice transcription (Whisper)
```

- Get ElevenLabs key: https://elevenlabs.io
- Get OpenAI key: https://platform.openai.com

> **Note:** Voice features (mic → text, text → speech) require API keys. The core chat works with just Ollama running locally — no keys needed.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/train` | Training mode — build the clone |
| `/clone` | Clone mode — talk to the clone |

---

## Voice Clone Setup (Optional)

For the full demo experience:
1. Record 3 minutes of yourself speaking naturally
2. Upload to [ElevenLabs Voice Cloning](https://elevenlabs.io/voice-lab)
3. Copy your Voice ID
4. In Training Mode, update `personality.json` → set `voice_id` to your ElevenLabs voice ID
5. Enable voice in Clone Mode — the clone will speak in your actual voice

---

## Project Structure

```
shadow-shelf/
├── app/
│   ├── page.tsx              # Landing page
│   ├── train/page.tsx        # Training mode
│   ├── clone/page.tsx        # Clone mode
│   └── api/
│       ├── chat/route.ts     # Ollama inference
│       ├── transcribe/       # Whisper STT
│       ├── synthesize/       # ElevenLabs TTS
│       └── personality/      # Personality CRUD
├── components/
│   ├── ChatBubble.tsx
│   ├── VoiceInput.tsx
│   ├── PersonalityStats.tsx
│   └── CloneAvatar.tsx
├── lib/
│   ├── ollama.ts
│   ├── personality.ts
│   ├── prompts.ts
│   └── questions.ts
└── data/
    └── personality.json      # Persisted personality store
```

---

## CV Description

**Shadow Shelf** — Cognitive Legacy Platform | *Personal Project · 2025*

Built a full-stack AI application that creates a personal cognitive clone by learning an individual's communication style, decision patterns, and personality through daily voice and text interactions. Two-phase architecture: a living training phase (continuous LLM-based personality extraction from structured conversation) and a clone phase (personality-injected inference with ElevenLabs voice synthesis).

**Stack:** Next.js 15 · TypeScript · Ollama · Phi-3 Mini · Whisper API · ElevenLabs · Tailwind CSS

---

*Built by Santosh*
