import { generateChat } from '@/lib/llm'

export type CritiqueVerdict = 'SHOW' | 'HOLD' | 'DISCARD'

export async function critiqueIntervention(
  candidateText: string,
  signalSummary: string,
  memorySnippet: string,
  historicalAcceptanceRate: number
): Promise<CritiqueVerdict> {
  const prompt = `
You are reviewing a candidate proactive message before it is shown to a developer mid-work. You did not write this message. Be skeptical by default.

Candidate message: ${candidateText}
Friction signal that triggered it: ${signalSummary}
Relevant personal history cited: ${memorySnippet}
This user's Scout acceptance rate for this signal type so far: ${historicalAcceptanceRate}%

Answer, tersely:
1. Is this specific enough to feel like real insight, or generic enough to feel like noise?
2. Does it assume something about this user's state that the signals don't actually support?
3. Is the tone presumptuous, or appropriately tentative?
4. VERDICT: SHOW / HOLD / DISCARD

Default to HOLD or DISCARD unless this is clearly good. A missed intervention costs nothing. A bad one costs trust.
`
  
  try {
    // We send this to the model specifically for critique
    const critiqueResponse = await generateChat([{ role: 'user', content: prompt }])
    
    // Parse the verdict
    if (critiqueResponse.includes('VERDICT: SHOW')) return 'SHOW'
    if (critiqueResponse.includes('VERDICT: HOLD')) return 'HOLD'
    return 'DISCARD'
  } catch (err) {
    // If the LLM critique fails, default to SILENCE
    return 'HOLD'
  }
}
