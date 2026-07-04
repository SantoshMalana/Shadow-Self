import { prisma } from './prisma'
import { generateChat } from './llm'

export interface PersonalityStore {
  id?: string
  userId?: string
  version?: number
  voiceId: string
  createdAt?: string
  updatedAt?: string
  sessions: number
  communicationStyle: {
    tone: string[]
    vocabulary: string[]
    sentencePatterns: string[]
    explanationStyle: string
  }
  thinkingPatterns: {
    decisionFramework: string[]
    values: string[]
    opinions: string[]
    contrarianPositions: string[]
  }
  emotionalProfile: {
    passionTopics: string[]
    frustrationTriggers: string[]
    humorStyle: string
    empathyMarkers: string[]
  }
  knowledgeDomains: string[]
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
    const result = await generateChat([], extractionPrompt)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return existing

    const traits = JSON.parse(jsonMatch[0])
    return mergeTraits(existing, traits, question, answer)
  } catch (err) {
    console.error("Extract traits error:", err)
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
    communicationStyle: {
      ...existing.communicationStyle,
      tone: [...new Set([...existing.communicationStyle.tone, newTraits.tone].filter(Boolean))].slice(-10),
      vocabulary: [...new Set([...existing.communicationStyle.vocabulary, ...(newTraits.vocabulary || [])])].slice(-50),
      explanationStyle: newTraits.thinking_style || existing.communicationStyle.explanationStyle
    },
    thinkingPatterns: {
      ...existing.thinkingPatterns,
      values: [...new Set([...existing.thinkingPatterns.values, ...(newTraits.values || [])])].slice(-30),
      opinions: [...existing.thinkingPatterns.opinions, ...(newTraits.opinions || [])].slice(-50)
    },
    emotionalProfile: {
      ...existing.emotionalProfile,
      passionTopics: [...new Set([...existing.emotionalProfile.passionTopics, ...(newTraits.passionTopics || [])])].slice(-20)
    },
    knowledgeDomains: [...new Set([...existing.knowledgeDomains, ...(newTraits.knowledgeDomains || [])])].slice(-20),
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
