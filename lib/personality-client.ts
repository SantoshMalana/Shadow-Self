/**
 * Client-safe personality utilities.
 * Extracted from lib/personality.ts so that client components
 * can use these without pulling in Prisma / node:fs.
 */

export function getCloneCompleteness(personality: {
  communicationStyle: { tone: string[]; vocabulary: string[] }
  thinkingPatterns: { values: string[]; opinions: string[] }
  emotionalProfile: { passionTopics: string[] }
  knowledgeDomains: string[]
}): number {
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
