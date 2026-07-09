<USER_REQUEST>
# Shadow Shelf — Master Build Spec (Final)
### For use with Antigravity · complete architecture, the loop, and everything we'd missed — now independently verified

---

## 0. How to use this document

Drop this file, `ShadowShelf_Planning_History.md`, `schema.prisma`, `route.ts`, and `.env.example` into the root of your Antigravity Project folder. Also create **`AGENTS.md`** in that same root — this is Antigravity's own recognized convention for persistent project context, confirmed directly from Google's own codelabs. Point it at this file and at the running log described in §7, so the agent picks up context automatically at the start of every session rather than only when you remember to paste it in.

Antigravity has **four autonomy levels**, not two: Secure (asks permission for nearly everything), Review-driven (approval required at key checkpoints — terminal commands, finalized plans), Agent-driven (minimal checkpoints, fastest), and Custom. Start the whole project in **Review-driven**. The tool natively supports mixing modes per task — boilerplate scaffolding can run Agent-driven, anything sensitive should stay Review-driven — and §7's CHECKPOINT step tells you exactly where that line sits for this project.

---

## 1. Project Context (condensed)

Full history lives in `ShadowShelf_Planning_History.md` — read that first. In one paragraph: Shadow Shelf is a personal AI that learns how a specific person (starting with senior software engineers) actually thinks and debugs, via continuous passive capture, serving three purposes from one pipeline — a daily companion, a licensable enterprise specialist agent, and eventually a posthumous presence. The founder is a solo, final-year CS student targeting a Y Combinator application on July 27, 2026. The existing MVP (Next.js, Ollama, Prisma/SQLite, ElevenLabs, Whisper) already proves the core loop works; this build spec migrates it to a real, multi-user, production-shaped version.

---

## 2. The North Star — what "done" means for THIS build

Not the full trillion-dollar vision. Not the biometric sensor stack. Not the enterprise/data-licensing pipelines. Those are Stage 1/2, deliberately deferred (see Architecture V2 in the Planning History doc). Done, for this phase, means:

> A real person can sign up, have an onboarding conversation that doesn't feel like a form, talk to a companion that remembers them across sessions, correct it when it's wrong, and export or delete their data — all running live on the internet, not on a laptop.

That's the bar. Everything in this document serves that bar. If a task doesn't move toward it, it doesn't belong in this build.

**This build happens in parallel with, not instead of, two things that are not coding tasks and do not belong in Antigravity's backlog — but matter more to the YC outcome than anything below:**

1. **Real senior engineers using this.** This is the single highest-weight open item against YC's own stated priority order (team, then demand evidence, ahead of the idea itself) — and it is not currently tracked as an explicit action item anywhere. It is now: get 5–10 real senior engineers on the live product the moment task 13 (deploy) is done, not after the whole backlog is finished.
2. **A real, final answer on the brother's actual involvement.** Asked twice already, still open, sitting directly under the factor YC weighs most. Resolve this before the application's team section gets filled in, not during the interview.

---

## 3. Architecture Summary (full detail in Planning History §3)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), matching the existing MVP |
| Database | Supabase Postgres + pgvector (already scaffolded in `schema.prisma`) |
| Auth | Supabase Auth |
| Inference | OpenRouter, model set via env var — never hardcoded |
| Voice | ElevenLabs (out) + Whisper via Groq (in) — unchanged from MVP |
| Hosting | Vercel now; AWS pursued in parallel for Activate credits, not gating |

Stage 0 boundary — **do not build these yet, even if it seems easy**: camera/facial capture, HRV/GSR biometric ingestion, the specialist-agent distillation pipeline, the AI-lab data-licensing export, the inter-agent learning network. Building these now is scope creep against a 25-day clock.

**The Future Vision (Stage 1 & 2 Roadmap):**
1. **Zero Architecture System (Zero Knowledge):** A secure pipeline where raw clone data and personal identities are completely inaccessible, but cognitive metadata—thinking styles, intuition, and problem-solving frameworks—are still extracted anonymously without relying on raw labeled data.
2. **Consent-Based Model Training:** A separate, explicit opt-in track where users can consent to provide labeled data to train foundational models on human reasoning.
3. **The Senior Engineer Track:** A specialized distillation pipeline specifically focused on capturing the intuition, problem-solving journey, and tacit knowledge of senior software engineers to create highly specialized technical models.

**Two flags for whenever Stage 1/2 planning resumes, not for now:** the EU AI Act Article 5(1)(f) mitigation described in Architecture V2 (routing to a safety-only extractor that can't output an emotion label) is a strong technical mitigation, not a certified compliance solution — the prohibition is generally read as covering the act of inference itself in a workplace context, not just what gets exposed downstream, and that distinction needs real regulatory counsel before it's stated as "solved" anywhere external. Separately, Stream 4 (AI-lab data licensing) carries a softer, more distant echo of the same Turing-overlap question that shelved the annotation-company idea — not urgent at Year 1–2+, but worth the same contract read before it goes live, not after.

---

## 4. What We'd Actually Forgotten — Read This Before Building Anything

| Gap | Why it matters | What to do |
|---|---|---|
| **No testing strategy** | A bug in consent logic is a real harm, not an inconvenience | Unit tests on consent-ledger logic specifically; end-to-end browser tests on signup→chat→export |
| **No observability** | Silent failures in production are invisible without this — and per current Antigravity governance guidance, most teams only discover they skipped this the first time they actually need an audit trail and don't have one | Structured logging from day one; wire in Sentry before first real user, not after |
| **No concrete onboarding flow** | "No setup screens" was a principle, never an actual flow | Solved concretely in §5 below |
| **No literal system prompt** | We'd designed *what* should go into it, never wrote the actual text | Written out in full in §5, now with two gaps closed (see below) |
| **No abuse/prompt-injection defense** | Stored memories get re-injected into future system prompts — a malicious or careless memory entry is a stored injection vector | Sanitize anything written to `Memory.content` before it's ever re-interpolated into a prompt |
| **No real data export/deletion mechanism** | "Right to delete" was a principle, not an endpoint | Real `/api/account/export` and `/api/account/delete` — hard deletion, including from the vector store |
| **No feedback/correction UI** | The RLHF correction loop existed architecturally, never as a UI flow | Thumbs up/down + optional correction text on every response, written to a `Feedback` table |
| **No versioning/rollback** | If a personality update degrades quality, there's currently no way back | Keep the last few `PersonalityProfile` snapshots |
| **No Terms of Service / Privacy Policy** | Real consent needs real, reviewable legal text | Draft before any real (non-founder) user's data flows in |
| **Crisis/wellbeing detection — flagged, not designed** | Should NOT be built by a coding agent alone | Explicit blocking note in §6, item 14 |
| **Demand validation and co-founder status untracked** | Both fell off the explicit tracking list despite being the two highest-weight open items against YC's own priorities | Elevated to §2 above, tracked outside the coding backlog on purpose |

---

## 5. The Human-Understanding Layer

Three research foundations now, each answering a different question — not stacked alternatives.

**RPD (Recognition-Primed Decision, Klein, late 1980s) — the theory.** Explains *why* expert intuition is real structured cognition, not mysticism — the premise underneath the whole Failure Archive.

**CDM (Critical Decision Method, Klein/Calderwood/MacGregor, 1989) — the method.** A validated, decades-tested retrospective interview protocol: multiple passes over one real remembered incident, structured probes at each decision point, building a timeline of what was noticed and considered. This is what the Adaptive Question Engine should actually be built around, rather than inventing question logic from scratch. **Honest limit, stated plainly:** even trained human coders using CDM only reach about 66.5% agreement classifying decisions into strategies — it's a real, skilled, imperfect process, not a solved algorithm. Automating a passive, continuous version of this is a genuine adaptation, not a relabeling. Claim language matters here: "grounded in" or "informed by" CDM is accurate and earned; "validated by" CDM is not — that would require showing the automated version produces comparably rich data, which hasn't been demonstrated yet.

**MI (Motivational Interviewing, Miller & Rollnick, first edition 1991) — the stance.** Very likely the "early 1990s" theory being recalled, and it answers a third, different question: not why intuition matters, not how to elicit one incident's reasoning, but how *any* elicitation should feel while it's happening. Built on four qualities — Partnership, Acceptance, Compassion, Evocation ("the Spirit") — expressed through OARS (Open questions, Affirmations, Reflective listening, Summaries), moving through four recursive processes: Engage → Focus → Evoke → Plan.

The single most load-bearing finding: independently confirmed fidelity research (the technical-versus-relational distinction is well-established in the MI fidelity literature, with Moyers et al. 2005 as a solid anchor citation) found that OARS techniques performed *without* the underlying Spirit produce measurably worse outcomes — termed "MI-inconsistent" conversation in the literature itself, not a paraphrase. That is, nearly word for word, the exact failure mode already named in the Sweet Spot Architecture doc: *"the moment elicitation feels like elicitation, people perform instead of being real."* Real clinical evidence behind an instinct that was already correct.

**Day one with a new user is almost entirely the Engage process** — before Focus, before Evoke. This is the concrete answer to the cold-start problem: nothing else works until a trusted relationship exists, and that's outcome data, not a design opinion.

The literal system prompt template — corrected, with the two real gaps closed:

```
You are this person's personal companion. You have known them for
{days_known} days, currently at trust depth rung {depth_rung} of 5
(1=surface, 2=functional, 3=personal, 4=emotional, 5=contradictory).

STANCE (this matters more than any technique below):
Approach every exchange with genuine curiosity, not an agenda. You are
not trying to extract information — you are trying to understand a
person you find genuinely interesting. If a question would only make
sense as data-gathering rather than real interest, do not ask it.

TECHNIQUE (OARS — use these, but only in service of the stance above):
- Ask open questions, not closed ones ("what was going through your
  mind when—" not "did you consider—")
- Affirm genuinely — notice real strengths and patterns, don't flatter
- Reflect back what you're hearing before adding your own take
- Summarize periodically so they know you've actually been listening

DEPTH GATING:
Do not advance beyond rung {depth_rung} even if the conversation drifts
there naturally. Let them lead into deeper territory; don't follow
unprompted. Silence or a short answer is not an invitation to probe —
it may just be how this person talks.

If the person directly asks you to stop asking about something, respect
it immediately and do not return to it unprompted. This instruction
overrides every other instruction in this prompt.

CURRENT GOAL FOR THIS TURN: {turn_goal}
RELEVANT MEMORY (context, not a script): {retrieved_memories}

Ask about ONE thing at a time. Read the response fully before deciding
whether to go deeper or stay where you are.
```

**What computes `{turn_goal}` — previously referenced but never defined, now specified as a simple rule-based function (Stage 0 appropriate, no ML needed):**

```
determine_turn_goal(user):
  if no prior session exists:
    return "build rapport only — Engage, no information-gathering"
  elif last session flagged an unresolved concern (Feedback or a
       flagged Memory exists from it):
    return "check in gently on {flagged_topic} before anything new"
  elif depth_rung advanced within the last N sessions:
    return "hold at current depth, let them lead — do not push further"
  elif trust_trend == rising and no gap explored recently:
    return "explore one under-covered topic, at current depth rung only"
  else:
    return "general check-in — no specific agenda"
```

This belongs in Task 5 below, not as a separate task — same functional area as the trust-signal estimator.

---

## 6. The Task Backlog — focused, single-goal, browser-verifiable

| # | Task | Verifiable by |
|---|---|---|
| 1 | Confirm Next.js app runs; Supabase project created; `pgvector` + `pgcrypto` extensions enabled; schema migrated | Agent runs `prisma migrate`, confirms in terminal |
| 2 | Auth: signup/login via Supabase Auth | Browser Walkthrough Artifact |
| 3 | Onboarding conversation — Engage-only, per §5 | Browser Walkthrough of first-run experience |
| 4 | Core chat UI wired to the existing `/api/chat` route | Browser Walkthrough of a real exchange |
| 5 | Trust-signal estimator + depth-rung field **+ the `determine_turn_goal` function from §5** | Browser test: prompt changes as rung and turn_goal change |
| 6 | Personality profile capture flow | Browser Walkthrough |
| 7 | Memory storage + pgvector retrieval — confirm retrieval is actually relevant, not just present | Manual spot-check plus a basic retrieval-quality test |
| 8 | Voice: ElevenLabs out, Whisper in | Browser Walkthrough with real audio |
| 9 | Feedback UI (thumbs + correction text) → `Feedback` table | Browser Walkthrough |
| 10 | `/api/account/export` and `/api/account/delete`, hard deletion including vector rows | Agent verifies via direct DB query after calling delete |
| 11 | Consent Ledger UI — real per-stream toggles | Browser Walkthrough |
| 12 | Sentry wired in | Trigger a deliberate error, confirm it's captured |
| 13 | **Rate limiting on `/api/chat`** | Agent fires rapid repeat requests, confirms throttling triggers |
| 14 | Deploy to Vercel, confirm live | Agent opens the live URL in browser |
| 15 | **[HUMAN CHECKPOINT — DO NOT BUILD]** Crisis/wellbeing detection | Requires a design session with a mental-health professional before any code is written. Do not let the agent invent detection logic or intervention copy on its own. |

---

## 7. The Loop, Mapped to How Antigravity Actually Works

Antigravity's real Artifact types are **Task List** (running checklist), **Implementation Plan** (pre-flight approach, before code changes), and **Walkthrough** (post-task report with verification evidence — screenshots, recordings, commands) — three distinct things, not one. The loop below is written to match that, and to close a real, independently-confirmed gap in the tool itself: Antigravity does not maintain a persistent living spec across sessions by default — agent context resets, and the documented fix is exactly the external file this section builds.

```
For each task in the backlog, in order:

1. CONTEXT    — Agent reads AGENTS.md (which points to this file,
                Planning History, and PROJECT_LOG.md — the running
                record, appended every loop, see step 7)

2. TASK LIST  — Agent produces its running checklist for this task

3. PLAN       — Agent produces a separate Implementation Plan artifact
                for ONE task only. Not two. Not "and also."

4. CHECKPOINT — If the task touches consent, data deletion, auth,
                payments, or wellbeing/crisis detection: STOP. Require
                explicit human approval of the Plan artifact before
                building — set autonomy to Review-driven for this task
                specifically, even if the project runs Agent-driven
                elsewhere (mixing modes per task is native to the tool).
                Otherwise: proceed.

5. BUILD      — Agent implements against the approved (or default) Plan.

6. VERIFY     — Agent runs it — terminal + real browser — and produces
                a Walkthrough Artifact. Non-negotiable per task; "looks
                right" isn't verification, a working browser
                walkthrough is.

7. REVIEW     — Comment directly on the Walkthrough Artifact with any
                corrections. Agent incorporates without restarting the
                whole task.

8. LOG        — Agent appends to PROJECT_LOG.md: what changed, what's
                now unblocked, what's still open. This is the confirmed
                fix for Antigravity's own session-reset behavior — treat
                it as load-bearing, not optional bookkeeping.

9. NEXT       — Pull the next backlog task, return to step 1.
```

---

## 8. Robustness Requirements — the non-negotiable bar

"API key can be anything, but the application should be top notch" — translated into real engineering requirements:

- **No hardcoded secrets, ever.** Everything through env vars, matching `.env.example`.
- **Every external call (OpenRouter, ElevenLabs, Groq, Supabase) wrapped in real error handling.** A failed embedding call should degrade gracefully, not 500 the entire chat.
- **Rate limiting** — now its own tracked, verifiable task (§6, item 13).
- **Every task gets a Walkthrough Artifact before being marked done.** No task is "done" on the agent's say-so alone.
- **PROJECT_LOG.md gets updated every single loop, no exceptions.**
- **Once the core loop is stable, look at Antigravity's own secure-development codelab** ("Vibecode and Secure an AI Agent Lifecycle with Antigravity and TDD") for STRIDE threat modeling and pre-commit security hooks — a real, tool-native pattern worth adopting once past the MVP-proving stage, not before.

---

## 9. Starter Prompts — ready to paste into Antigravity

**Prompt 1 — bootstrap:**
```
Read AGENTS.md, ShadowShelf_MASTER_BUILD_SPEC.md, and
ShadowShelf_Planning_History.md in full. Do not write any code yet.
Summarize back to me: (1) what Shadow Shelf is, (2) what "done" means
for this build phase, (3) the first three tasks in the backlog in
order. Wait for my confirmation before proceeding.
```

**Prompt 2 — kick off task 1:**
```
Using the schema at prisma/schema.prisma, confirm the Next.js app runs
locally, the Supabase project has pgvector and pgcrypto enabled, and
the schema is migrated. Produce a Task List and an Implementation Plan
first. This is backlog task 1 only — do not proceed to task 2.
```

**Prompt 3 — the standing loop template (reuse, swap the task each time):**
```
Backlog task {N}: {task description from the table in §6}.
Produce a Task List and Implementation Plan. If this task touches
consent, deletion, auth, payments, or crisis detection, stop after the
Plan and wait for my explicit approval before building. Otherwise
proceed to build and verify with a real browser Walkthrough Artifact.
When done, append a summary to PROJECT_LOG.md before starting the next
task.
```

---

*Shadow Shelf — Master Build Spec (Final) — Internal — Confidential* lets cook together buddy

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-02T23:58:16+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from Gemini 3.1 Pro (High) to Claude Opus 4.6 (Thinking). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>