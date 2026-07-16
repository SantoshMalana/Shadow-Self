/**
 * Zero Knowledge Distillation Pipeline
 * 
 * Stage 1 Architecture: Extracts anonymous cognitive metadata from user conversations
 * without retaining any personally identifiable information.
 * 
 * Pipeline:
 *   1. sanitizeText()  — Strips PII, company names, proprietary code, specific tech
 *   2. extractInsight() — Distills the underlying problem-solving framework
 *   3. processAndStoreZeroKnowledge() — Orchestrates pipeline, embeds, and stores anonymously
 * 
 * The resulting insights are stored in the `AnonymousCognitiveModel` table,
 * which has NO foreign key to the User table — zero traceability by design.
 */

import { generateChat } from './llm'
import { getEmbedding } from './embeddings'
import { prisma } from './prisma'

// ─── System Prompts ────────────────────────────────────────────────────────────

const SANITIZE_SYSTEM_PROMPT = `You are a strict PII sanitization engine. Your ONLY job is to rewrite the user's text with ALL of the following removed or replaced with generic placeholders:

MUST REMOVE:
- All personal names (people, usernames, handles)
- All company, organization, or team names
- All product or brand names
- All specific technology names (frameworks, libraries, databases, cloud providers)
- All code snippets, variable names, function names, API endpoints
- All URLs, IP addresses, email addresses
- All geographic locations (cities, countries, offices)
- All dates, timestamps, or time references that could identify an event
- All project names or internal codenames
- All monetary amounts or specific metrics

REPLACEMENT RULES:
- Replace specific tech with generic categories: "Redis" → "a caching layer", "PostgreSQL" → "a relational database"
- Replace names with "a colleague", "the team lead", etc.
- Replace companies with "the organization" or "the client"
- Keep the STRUCTURE of the problem-solving narrative intact

OUTPUT: Return ONLY the sanitized text. No explanations, no headers, no metadata. If the input contains no meaningful problem-solving content (e.g., greetings, small talk), respond with exactly: SKIP`

const EXTRACT_SYSTEM_PROMPT = `You are a cognitive pattern analyst. Given a sanitized description of how someone solved a problem, extract the ABSTRACT problem-solving framework or heuristic they used.

Focus on:
- The mental model or decision framework applied
- The diagnostic reasoning pattern (e.g., "narrowed down by eliminating X category first")
- The intuition or pattern recognition demonstrated
- The tradeoff evaluation approach
- The sequence of cognitive steps taken

OUTPUT FORMAT:
Return a single, concise insight statement (2-4 sentences) that captures the generalizable problem-solving approach. It should read like a transferable heuristic that could help someone facing a similar CLASS of problem — not the specific problem itself.

Also output a domain tag on a new line prefixed with "DOMAIN:" — one of: systems_architecture, debugging, performance, security, data_modeling, api_design, infrastructure, team_dynamics, product_thinking, general

Example output:
When facing cascading failures in distributed systems, first isolate the blast radius by identifying which upstream dependency changed most recently, then verify the hypothesis by checking if reverting that single change resolves the symptom before investigating deeper root causes.
DOMAIN: debugging

If the input is too vague or contains no real problem-solving content, respond with exactly: SKIP`

// ─── Pipeline Functions ────────────────────────────────────────────────────────

/**
 * Strip all PII and identifying information from raw user text.
 * Returns the sanitized text, or null if the content has no problem-solving value.
 */
export async function sanitizeText(content: string): Promise<string | null> {
  if (!content || content.trim().length < 30) return null

  try {
    const result = await generateChat(
      [{ role: 'user', content }],
      SANITIZE_SYSTEM_PROMPT
    )

    const trimmed = result.trim()
    if (trimmed === 'SKIP' || trimmed.length < 20) return null
    return trimmed
  } catch (err) {
    console.error('[ZeroKnowledge] Sanitization failed:', err)
    return null
  }
}

/**
 * Extract an abstract cognitive insight from sanitized text.
 * Returns the insight and domain tag, or null if extraction fails.
 */
export async function extractInsight(
  sanitizedContent: string
): Promise<{ insight: string; domain: string } | null> {
  try {
    const result = await generateChat(
      [{ role: 'user', content: sanitizedContent }],
      EXTRACT_SYSTEM_PROMPT
    )

    const trimmed = result.trim()
    if (trimmed === 'SKIP' || trimmed.length < 20) return null

    // Parse domain tag from the last line
    const lines = trimmed.split('\n')
    let domain = 'general'
    let insightText = trimmed

    const domainLine = lines.find(l => l.startsWith('DOMAIN:'))
    if (domainLine) {
      domain = domainLine.replace('DOMAIN:', '').trim().toLowerCase()
      insightText = lines.filter(l => !l.startsWith('DOMAIN:')).join('\n').trim()
    }

    if (insightText.length < 20) return null

    return { insight: insightText, domain }
  } catch (err) {
    console.error('[ZeroKnowledge] Extraction failed:', err)
    return null
  }
}

/**
 * Verify that the text does not contain capitalized proper nouns that might be PII.
 * Simple heuristic: Flags if it finds Capitalized words that aren't at the start of a sentence
 * or part of common generic terms (like "API", "UI", "DOM", etc).
 * Returns true if clean, false if potential PII detected.
 */
export function verifySanitization(text: string): boolean {
  // Common safe acronyms
  const safeList = ['API', 'UI', 'UX', 'DB', 'HTML', 'CSS', 'DOM', 'JSON', 'SQL', 'LLM', 'AI', 'AWS', 'GCP', 'PR']
  
  // Find words starting with a capital letter
  const words = text.split(/\s+/)
  
  for (let i = 1; i < words.length; i++) { // Skip first word (often capitalized start of sentence)
    const word = words[i].replace(/[^a-zA-Z]/g, '')
    if (word.length > 1 && word[0] === word[0].toUpperCase() && word[1] === word[1].toLowerCase()) {
      // It's a capitalized word (e.g., "John", "Google", "React")
      // Check if it's the start of a new sentence (previous word ended in . ! ?)
      const prevWord = words[i-1]
      if (!prevWord.match(/[.!?]["']?$/)) {
        if (!safeList.includes(word.toUpperCase())) {
          return false // Potential leaked proper noun
        }
      }
    }
  }
  return true
}

/**
 * Full pipeline: sanitize → verify → extract → embed → store anonymously.
 * Designed to run as a fire-and-forget background task.
 * 
 * Returns true if an insight was successfully stored, false otherwise.
 */
export async function processAndStoreZeroKnowledge(rawContent: string): Promise<boolean> {
  try {
    // Step 1: Strip all PII
    const sanitized = await sanitizeText(rawContent)
    if (!sanitized) return false

    // Step 2: Verify sanitization via second-pass heuristic
    if (!verifySanitization(sanitized)) {
      console.warn('[ZeroKnowledge] Sanitization verification failed, dropping text.')
      return false
    }

    // Step 2: Extract the cognitive framework
    const extracted = await extractInsight(sanitized)
    if (!extracted) return false

    // Step 3: Generate embedding for semantic grouping
    let embeddingVector: number[] | null = null
    try {
      embeddingVector = await getEmbedding(extracted.insight)
    } catch (err) {
      // Embedding failure is non-fatal — store the insight without it
      console.error('[ZeroKnowledge] Embedding failed, storing without vector:', err)
    }

    // Step 4: Store anonymously — NO userId, NO foreign key
    if (embeddingVector) {
      const vectorStr = `[${embeddingVector.join(',')}]`
      await prisma.$executeRaw`
        INSERT INTO anonymous_cognitive_model (id, insight, embedding, domain, created_at)
        VALUES (gen_random_uuid(), ${extracted.insight}, ${vectorStr}::vector, ${extracted.domain}, NOW())
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO anonymous_cognitive_model (id, insight, domain, created_at)
        VALUES (gen_random_uuid(), ${extracted.insight}, ${extracted.domain}, NOW())
      `
    }

    return true
  } catch (err) {
    console.error('[ZeroKnowledge] Pipeline error:', err)
    return false
  }
}
