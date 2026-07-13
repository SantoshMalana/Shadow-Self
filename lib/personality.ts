import { prisma } from './prisma'
import { generateChat } from './llm'

// ─── Provenance Types ──────────────────────────────────────────────────────────
// Every extracted trait carries a sourceId (messageId) and timestamp so
// users can trace exactly which conversation produced each piece of data.

export interface ProvenancedTrait {
  value: string
  sourceId: string   // messageId that generated this trait
  timestamp: string  // ISO date string
}

export interface Journey {
  situation: string
  optionsConsidered: string[]
  actionTaken: string
  rationale: string
  sourceId: string
  timestamp: string
}

export interface PersonalityStore {
  id?: string
  userId?: string
  version?: number
  voiceId: string
  createdAt?: string
  updatedAt?: string
  sessions: number
  communicationStyle: {
    tone: (string | ProvenancedTrait)[]
    vocabulary: (string | ProvenancedTrait)[]
    sentencePatterns: string[]
    explanationStyle: string
  }
  thinkingPatterns: {
    decisionFramework: (string | Journey)[]
    values: (string | ProvenancedTrait)[]
    opinions: (string | ProvenancedTrait)[]
    contrarianPositions: string[]
  }
  emotionalProfile: {
    passionTopics: (string | ProvenancedTrait)[]
    frustrationTriggers: string[]
    humorStyle: string
    empathyMarkers: string[]
  }
  knowledgeDomains: (string | ProvenancedTrait)[]
  trainingExamples: { question: string; answer: string; traits: any }[]
}

const defaultPersonality: Omit<PersonalityStore, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'> = {
  voiceId: '',
  sessions: 0,
  communicationStyle: { tone: [], vocabulary: [], sentencePatterns: [], explanationStyle: '' },
  thinkingPatterns: { decisionFramework: [], values: [], opinions: [], contrarianPositions: [] },
  emotionalProfile: { passionTopics: [], frustrationTriggers: [], humorStyle: '', empathyMarkers: [] },
  knowledgeDomains: [],
  trainingExamples: []
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Extract the display value from a trait, whether it's a plain string or a ProvenancedTrait */
export function traitValue(t: string | ProvenancedTrait): string {
  return typeof t === 'string' ? t : t.value
}

/** Wrap a raw string into a ProvenancedTrait */
function provenanced(value: string, sourceId: string): ProvenancedTrait {
  return { value, sourceId, timestamp: new Date().toISOString() }
}

/** Deduplicate provenanced traits by their display value, keeping the latest */
function dedupeTraits(arr: (string | ProvenancedTrait)[], max: number): (string | ProvenancedTrait)[] {
  const seen = new Map<string, string | ProvenancedTrait>()
  for (const item of arr) {
    const v = traitValue(item)
    if (v) seen.set(v.toLowerCase(), item)
  }
  return [...seen.values()].slice(-max)
}

function deserialize(row: any): PersonalityStore {
  return {
    id: row.id,
    userId: row.userId,
    version: row.version,
    voiceId: row.voiceId ?? '',
    sessions: row.sessions ?? 0,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.createdAt?.toISOString(),
    communicationStyle: row.communicationStyle as any || defaultPersonality.communicationStyle,
    thinkingPatterns: row.thinkingPatterns as any || defaultPersonality.thinkingPatterns,
    emotionalProfile: row.emotionalProfile as any || defaultPersonality.emotionalProfile,
    knowledgeDomains: row.knowledgeDomains as any || defaultPersonality.knowledgeDomains,
    trainingExamples: row.trainingExamples as any || defaultPersonality.trainingExamples,
  }
}

export async function getPersonality(userId: string): Promise<PersonalityStore> {
  let row = await prisma.personalityProfile.findFirst({
    where: { userId, isActive: true },
    orderBy: { version: 'desc' }
  })

  if (!row) {
    row = await prisma.personalityProfile.create({
      data: {
        userId,
        version: 1,
        sessions: 0,
        voiceId: '',
        communicationStyle: defaultPersonality.communicationStyle as any,
        thinkingPatterns: defaultPersonality.thinkingPatterns as any,
        emotionalProfile: defaultPersonality.emotionalProfile as any,
        knowledgeDomains: defaultPersonality.knowledgeDomains as any,
        trainingExamples: defaultPersonality.trainingExamples as any
      }
    })
  }

  return deserialize(row)
}

export async function savePersonality(userId: string, data: PersonalityStore): Promise<void> {
  const current = await getPersonality(userId)
  const nextVersion = (current.version ?? 0) + 1

  const created = await prisma.personalityProfile.create({
    data: {
      userId,
      version: nextVersion,
      sessions: data.sessions,
      voiceId: data.voiceId,
      communicationStyle: data.communicationStyle as any,
      thinkingPatterns: data.thinkingPatterns as any,
      emotionalProfile: data.emotionalProfile as any,
      knowledgeDomains: data.knowledgeDomains as any,
      trainingExamples: data.trainingExamples as any
    }
  })

  await prisma.personalityProfile.updateMany({
    where: { userId, id: { not: created.id } },
    data: { isActive: false }
  })
}

// ─── Extraction ────────────────────────────────────────────────────────────────
// Now accepts a sourceId (messageId) so every extracted trait carries provenance.

export async function extractTraits(
  question: string,
  answer: string,
  existing: PersonalityStore,
  sourceId?: string
): Promise<PersonalityStore> {
  const extractionPrompt = `
You are a personality analysis system. Analyze the following Q&A and extract personality traits.
Return ONLY a valid JSON object — no markdown, no explanation, just the raw JSON.

{
  "tone": "one-word tone descriptor (e.g. analytical, warm, blunt, philosophical)",
  "values": ["array", "of", "values", "expressed"],
  "opinions": ["specific opinion stated if any"],
  "vocabulary": ["distinctive", "words", "or", "phrases", "used"],
  "thinking_style": "one sentence describing how they approached the answer",
  "passion_topics": ["topics", "they", "seem", "excited", "about"],
  "knowledge_domains": ["domains", "of", "expertise", "revealed"],
  "journey": {
    "detected": false,
    "situation": "brief description of the problem or scenario described (if any)",
    "options_considered": ["options", "they", "mentioned", "weighing"],
    "action_taken": "what they ultimately did",
    "rationale": "why they chose this path over alternatives"
  }
}

If the answer describes a decision, problem-solving process, or a choice between alternatives, set journey.detected to true and fill in the journey fields. Otherwise set detected to false and leave the other journey fields empty.

Question: ${question}
Answer: ${answer}

Return only valid JSON:`

  try {
    const result = await generateChat([], extractionPrompt)
    let jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return existing

    let jsonString = jsonMatch[0]
    // Clean trailing commas (common LLM hallucination)
    jsonString = jsonString.replace(/,\s*([\]}])/g, '$1')

    const traits = JSON.parse(jsonString)
    return mergeTraits(existing, traits, question, answer, sourceId)
  } catch (err) {
    console.error("Extract traits error:", err)
    return existing
  }
}

function mergeTraits(
  existing: PersonalityStore,
  newTraits: any,
  question: string,
  answer: string,
  sourceId?: string
): PersonalityStore {
  const sid = sourceId || 'unknown'

  // Build journey entry if the LLM detected a decision
  const journeys = [...(existing.thinkingPatterns.decisionFramework || [])]
  if (newTraits.journey?.detected && newTraits.journey?.situation) {
    journeys.push({
      situation: newTraits.journey.situation,
      optionsConsidered: newTraits.journey.options_considered || [],
      actionTaken: newTraits.journey.action_taken || '',
      rationale: newTraits.journey.rationale || '',
      sourceId: sid,
      timestamp: new Date().toISOString()
    } as Journey)
  }

  return {
    ...existing,
    sessions: existing.sessions + 1,
    communicationStyle: {
      ...existing.communicationStyle,
      tone: dedupeTraits(
        [...existing.communicationStyle.tone, ...(newTraits.tone ? [provenanced(newTraits.tone, sid)] : [])],
        10
      ),
      vocabulary: dedupeTraits(
        [...existing.communicationStyle.vocabulary, ...(newTraits.vocabulary || []).map((v: string) => provenanced(v, sid))],
        50
      ),
      explanationStyle: newTraits.thinking_style || existing.communicationStyle.explanationStyle
    },
    thinkingPatterns: {
      ...existing.thinkingPatterns,
      decisionFramework: journeys.slice(-30),
      values: dedupeTraits(
        [...existing.thinkingPatterns.values, ...(newTraits.values || []).map((v: string) => provenanced(v, sid))],
        30
      ),
      opinions: [
        ...existing.thinkingPatterns.opinions,
        ...(newTraits.opinions || []).map((o: string) => provenanced(o, sid))
      ].slice(-50)
    },
    emotionalProfile: {
      ...existing.emotionalProfile,
      passionTopics: dedupeTraits(
        [...existing.emotionalProfile.passionTopics, ...(newTraits.passion_topics || []).map((p: string) => provenanced(p, sid))],
        20
      )
    },
    knowledgeDomains: dedupeTraits(
      [...existing.knowledgeDomains, ...(newTraits.knowledge_domains || []).map((d: string) => provenanced(d, sid))],
      20
    ),
    trainingExamples: [...existing.trainingExamples, { question, answer, traits: newTraits }].slice(-100)
  }
}

export function getCloneCompleteness(personality: PersonalityStore): number {
  let score = 0
  const { communicationStyle, thinkingPatterns, emotionalProfile, knowledgeDomains } = personality

  score += Math.min(communicationStyle.tone.length * 5, 20)
  score += Math.min(communicationStyle.vocabulary.length * 1, 15)
  score += Math.min(thinkingPatterns.values.length * 3, 20)
  score += Math.min(thinkingPatterns.opinions.length * 1, 15)
  score += Math.min(emotionalProfile.passionTopics.length * 3, 15)
  score += Math.min(knowledgeDomains.length * 3, 15)

  return Math.min(score, 100)
}
