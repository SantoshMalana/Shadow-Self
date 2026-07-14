import { FrictionPing, SignalType, WorkflowBoundary } from './types'
import { processFrictionPing } from './baseline'
import { queueFrictionEvent, checkQueueAtBoundary } from './boundary'
import { scoreConfidence } from './confidence'
import { critiqueIntervention } from './critique'
import { determineAffordanceTier } from './affordance'
import { logPipelineAudit } from './audit'

export async function handleFrictionPing(ping: FrictionPing) {
  // STAGE 1: Collection
  const isAnomalous = await processFrictionPing(ping)

  // STAGE 2: Personal Anomaly Filter
  if (!isAnomalous) {
    await logPipelineAudit({
      userId: ping.userId,
      signalType: ping.signalType,
      stage1Raw: ping,
      finalOutcome: 'suppressed', // Fails anomaly check
    })
    return
  }

  // STAGE 3: Queue until Workflow Boundary
  await queueFrictionEvent(ping.userId, ping.signalType)
  
  await logPipelineAudit({
    userId: ping.userId,
    signalType: ping.signalType,
    stage1Raw: ping,
    stage2AnomalyScore: 2.1, // Mock score for tracking
    finalOutcome: 'queued',
  })
}

export async function processWorkflowBoundary(userId: string, boundary: WorkflowBoundary) {
  const queuedEvents = await checkQueueAtBoundary(userId, boundary)
  
  for (const event of queuedEvents) {
    const pingStub: FrictionPing = { userId, signalType: event.signalType, value: 0 } // Rehydrate ping

    // STAGE 4: Content Confidence Scoring
    const scores = await scoreConfidence(userId, pingStub, true)
    
    if (scores.stuckConfidence < 0.6 || scores.contentConfidence < 0.5) {
      await logPipelineAudit({
        userId, signalType: event.signalType, stage1Raw: {}, stage3BoundaryReached: boundary,
        stage4StuckConfidence: scores.stuckConfidence,
        stage4ContentConfidence: scores.contentConfidence,
        finalOutcome: 'suppressed'
      })
      continue
    }

    // Candidate message generation (mocked)
    const candidateText = `I noticed you're stuck on ${event.signalType}. Last time this happened...`

    // STAGE 5: LLM Self-Critique
    const verdict = await critiqueIntervention(candidateText, event.signalType, scores.memorySnippet || '', 10)
    
    if (verdict === 'HOLD' || verdict === 'DISCARD') {
      await logPipelineAudit({
        userId, signalType: event.signalType, stage1Raw: {}, stage3BoundaryReached: boundary,
        stage4StuckConfidence: scores.stuckConfidence, stage4ContentConfidence: scores.contentConfidence,
        stage5Verdict: verdict, finalOutcome: 'suppressed'
      })
      continue
    }

    // STAGE 6: Tiered Affordance
    const tier = await determineAffordanceTier(userId, event.signalType)
    
    const outcomeMap = {
      0: 'shown_tier0',
      1: 'shown_tier1',
      2: 'shown_tier2'
    } as const

    await logPipelineAudit({
      userId, signalType: event.signalType, stage1Raw: {}, stage3BoundaryReached: boundary,
      stage4StuckConfidence: scores.stuckConfidence, stage4ContentConfidence: scores.contentConfidence,
      stage5Verdict: verdict, finalOutcome: outcomeMap[tier]
    })

    // EXECUTE INTERVENTION (trigger UI or TTS)
    // console.log(`Triggering intervention at Tier ${tier}: ${candidateText}`)
  }
}
