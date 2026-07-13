/**
 * Escalation-tier classifier.
 *
 * Determines whether the current user message should be routed to a
 * higher-capability "escalation" model (e.g. Claude Sonnet, GPT-4o)
 * instead of the default fast/cheap model.
 *
 * Triggers:
 * 1. Emotional intensity — crisis keywords, distress signals
 * 2. Technical complexity — architecture, system design, debugging
 * 3. Contradiction/challenge — user pushing back on the clone's response
 *
 * This is a fast, zero-latency keyword classifier — no LLM call required.
 */

const EMOTIONAL_SIGNALS = [
  'suicide', 'kill myself', 'end it', 'self-harm', 'cutting',
  'hopeless', 'worthless', 'can\'t go on', 'want to die',
  'panic attack', 'breaking down', 'crying', 'devastated',
  'terrified', 'deeply hurt', 'betrayed', 'abused',
  'depressed', 'anxiety', 'trauma', 'ptsd',
]

const TECHNICAL_COMPLEXITY = [
  'architecture', 'distributed system', 'microservice', 'kubernetes',
  'race condition', 'deadlock', 'memory leak', 'segfault',
  'system design', 'trade-off', 'tradeoff', 'scaling',
  'concurrency', 'consistency model', 'cap theorem',
  'production outage', 'postmortem', 'root cause',
  'migration strategy', 'backwards compatible',
]

const CONTRADICTION_SIGNALS = [
  'that\'s wrong', 'you\'re wrong', 'that\'s not what i said',
  'i disagree', 'no that\'s not', 'you misunderstood',
  'that doesn\'t sound like me', 'i would never say that',
  'that\'s not accurate', 'completely off',
]

export type EscalationResult = {
  shouldEscalate: boolean
  reason?: 'emotional' | 'technical' | 'contradiction'
}

export function classifyEscalation(userMessage: string): EscalationResult {
  const lower = userMessage.toLowerCase()

  // Check emotional intensity first (highest priority)
  if (EMOTIONAL_SIGNALS.some(signal => lower.includes(signal))) {
    return { shouldEscalate: true, reason: 'emotional' }
  }

  // Check technical complexity
  if (TECHNICAL_COMPLEXITY.some(signal => lower.includes(signal))) {
    return { shouldEscalate: true, reason: 'technical' }
  }

  // Check contradiction/challenge
  if (CONTRADICTION_SIGNALS.some(signal => lower.includes(signal))) {
    return { shouldEscalate: true, reason: 'contradiction' }
  }

  return { shouldEscalate: false }
}
