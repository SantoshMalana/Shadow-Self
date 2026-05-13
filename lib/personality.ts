import { prisma } from './prisma'
import { chat } from './ollama'

// Singleton personality ID — one user for now, easy to extend later
const DEFAULT_NAME = ''

export interface PersonalityStore {
  id?: string
  name: string
  voice_id: string
  created_at: string
  updated_at?: string
  sessions: number
  communication_style: {
    tone: string[]
    vocabulary: string[]
    sentence_patterns: string[]
    explanation_style: string
  }
  thinking_patterns: {
    decision_framework: string[]
    values: string[]
    opinions: string[]
    contrarian_positions: string[]
  }
  emotional_profile: {
    passion_topics: string[]
    frustration_triggers: string[]
    humor_style: string
    empathy_markers: string[]
  }
  knowledge_domains: string[]
  conversation_history: { role: string; content: string; timestamp: string }[]
  training_examples: { question: string; answer: string; traits: any }[]
}

export const defaultPersonality: Omit<PersonalityStore, 'id' | 'created_at' | 'updated_at'> = {
  name: DEFAULT_NAME,
  voice_id: '',
  sessions: 0,
  communication_style: {
    tone: [],
    vocabulary: [],
    sentence_patterns: [],
    explanation_style: ''
  },
  thinking_patterns: {
    decision_framework: [],
    values: [],
    opinions: [],
    contrarian_positions: []
  },
  emotional_profile: {
    passion_topics: [],
    frustration_triggers: [],
    humor_style: '',
    empathy_markers: []
  },
  knowledge_domains: [],
  conversation_history: [],
  training_examples: []
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function deserialize(row: any): PersonalityStore {
  return {
    id: row.id,
    name: row.name ?? '',
    voice_id: row.voice_id ?? '',
    sessions: row.sessions ?? 0,
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
    updated_at: row.updated_at?.toISOString() ?? new Date().toISOString(),
    communication_style: JSON.parse(row.communication_style),
    thinking_patterns: JSON.parse(row.thinking_patterns),
    emotional_profile: JSON.parse(row.emotional_profile),
    knowledge_domains: JSON.parse(row.knowledge_domains),
    training_examples: JSON.parse(row.training_examples),
    // conversation_history lives in Message table — return empty here;
    // callers that need messages fetch them from /api/chat directly
    conversation_history: []
  }
}

// ─── Core CRUD ─────────────────────────────────────────────────────────────

export async function getPersonality(): Promise<PersonalityStore> {
  let row = await prisma.personality.findFirst({
    orderBy: { created_at: 'asc' }
  })

  if (!row) {
    // Seed default personality on first run
    row = await prisma.personality.create({
      data: {
        name: DEFAULT_NAME,
        voice_id: '',
        sessions: 0,
        communication_style: JSON.stringify(defaultPersonality.communication_style),
        thinking_patterns: JSON.stringify(defaultPersonality.thinking_patterns),
        emotional_profile: JSON.stringify(defaultPersonality.emotional_profile),
        knowledge_domains: JSON.stringify(defaultPersonality.knowledge_domains),
        training_examples: JSON.stringify(defaultPersonality.training_examples)
      }
    })
  }

  return deserialize(row)
}

export async function savePersonality(data: PersonalityStore): Promise<void> {
  const id = data.id ?? (await getPersonality()).id!

  await prisma.personality.update({
    where: { id },
    data: {
      name: data.name,
      voice_id: data.voice_id,
      sessions: data.sessions,
      communication_style: JSON.stringify(data.communication_style),
      thinking_patterns: JSON.stringify(data.thinking_patterns),
      emotional_profile: JSON.stringify(data.emotional_profile),
      knowledge_domains: JSON.stringify(data.knowledge_domains),
      training_examples: JSON.stringify(data.training_examples)
    }
  })
}

// ─── Trait Extraction ──────────────────────────────────────────────────────

export async function extractTraits(
  question: string,
  answer: string,
  existing: PersonalityStore
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
  "knowledge_domains": ["domains", "of", "expertise", "revealed"]
}

Question: ${question}
Answer: ${answer}

Return only valid JSON:`

  try {
    const result = await chat([], extractionPrompt)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return existing

    const traits = JSON.parse(jsonMatch[0])
    return mergeTraits(existing, traits, question, answer)
  } catch {
    return existing
  }
}

function mergeTraits(
  existing: PersonalityStore,
  newTraits: any,
  question: string,
  answer: string
): PersonalityStore {
  return {
    ...existing,
    sessions: existing.sessions + 1,
    updated_at: new Date().toISOString(),
    communication_style: {
      ...existing.communication_style,
      tone: [...new Set([
        ...existing.communication_style.tone,
        newTraits.tone
      ].filter(Boolean))].slice(-10),
      vocabulary: [...new Set([
        ...existing.communication_style.vocabulary,
        ...(newTraits.vocabulary || [])
      ])].slice(-50),
      explanation_style: newTraits.thinking_style || existing.communication_style.explanation_style
    },
    thinking_patterns: {
      ...existing.thinking_patterns,
      values: [...new Set([
        ...existing.thinking_patterns.values,
        ...(newTraits.values || [])
      ])].slice(-30),
      opinions: [
        ...existing.thinking_patterns.opinions,
        ...(newTraits.opinions || [])
      ].slice(-50)
    },
    emotional_profile: {
      ...existing.emotional_profile,
      passion_topics: [...new Set([
        ...existing.emotional_profile.passion_topics,
        ...(newTraits.passion_topics || [])
      ])].slice(-20)
    },
    knowledge_domains: [...new Set([
      ...existing.knowledge_domains,
      ...(newTraits.knowledge_domains || [])
    ])].slice(-20),
    training_examples: [
      ...existing.training_examples,
      { question, answer, traits: newTraits }
    ].slice(-100)
  }
}

// ─── Completeness Score ────────────────────────────────────────────────────

export function getCloneCompleteness(personality: PersonalityStore): number {
  let score = 0
  const { communication_style, thinking_patterns, emotional_profile, knowledge_domains } = personality

  score += Math.min(communication_style.tone.length * 5, 20)
  score += Math.min(communication_style.vocabulary.length * 1, 15)
  score += Math.min(thinking_patterns.values.length * 3, 20)
  score += Math.min(thinking_patterns.opinions.length * 1, 15)
  score += Math.min(emotional_profile.passion_topics.length * 3, 15)
  score += Math.min(knowledge_domains.length * 3, 15)

  return Math.min(score, 100)
}
