import { prisma as db } from '@/lib/prisma'
import { FrictionPing, MIN_SAMPLES_FOR_BASELINE, ANOMALY_Z_SCORE_THRESHOLD } from './types'

export async function processFrictionPing(ping: FrictionPing): Promise<boolean> {
  // We only do anomaly detection for numeric signals
  if (typeof ping.value !== 'number') {
    return false // discrete signals like error_class handle logic differently, or just pass through to pipeline
  }

  const baseline = await db.personalBaseline.findUnique({
    where: {
      userId_signalType: {
        userId: ping.userId,
        signalType: ping.signalType,
      },
    },
  })

  // Update the baseline with the new reading (Welford's online algorithm could be used, or just simple recalculation for MVP)
  await updateBaseline(ping.userId, ping.signalType, ping.value, baseline)

  if (!baseline || baseline.sampleCount < MIN_SAMPLES_FOR_BASELINE) {
    return false // Cold start - not enough data yet
  }

  // Calculate Z-Score
  const stddev = baseline.stddev || 1 // prevent division by zero
  const zScore = Math.abs(ping.value - baseline.mean) / stddev

  return zScore > ANOMALY_Z_SCORE_THRESHOLD
}

async function updateBaseline(userId: string, signalType: string, newValue: number, currentBaseline: any) {
  if (!currentBaseline) {
    await db.personalBaseline.create({
      data: {
        userId,
        signalType,
        mean: newValue,
        stddev: 0,
        sampleCount: 1,
      },
    })
    return
  }

  // Welford's online algorithm for variance
  const n = currentBaseline.sampleCount + 1
  const delta = newValue - currentBaseline.mean
  const newMean = currentBaseline.mean + delta / n
  
  // To update stddev, we need the M2 (sum of squares of differences from the current mean). 
  // We can approximate or store variance. For now, a simple approximation.
  const variance = Math.pow(currentBaseline.stddev, 2)
  const oldM2 = variance * currentBaseline.sampleCount
  const delta2 = newValue - newMean
  const newM2 = oldM2 + delta * delta2
  const newVariance = newM2 / n
  const newStddev = Math.sqrt(newVariance)

  await db.personalBaseline.update({
    where: {
      userId_signalType: {
        userId,
        signalType,
      },
    },
    data: {
      mean: newMean,
      stddev: newStddev,
      sampleCount: n,
    },
  })
}
