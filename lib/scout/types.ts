export type SignalType = 'idle_seconds' | 'undo_ratio' | 'file_hop_rate' | 'save_gap' | 'error_class'

export interface FrictionPing {
  userId: string
  signalType: SignalType
  value: number | string // numeric for continuous signals, string for discrete (error classes)
  context?: any
}

export type WorkflowBoundary = 'post_commit' | 'post_test_run' | 'post_build' | 'post_save_after_gap'

export interface PersonalBaseline {
  userId: string
  signalType: SignalType
  mean: number
  stddev: number
  sampleCount: number
  updatedAt: Date
}

export interface QueuedFrictionEvent {
  userId: string
  signalType: SignalType
  detectedAt: Date
  expiresAt: Date
}

export const MIN_SAMPLES_FOR_BASELINE = 15
export const QUEUE_DECAY_MINUTES = 30
export const ANOMALY_Z_SCORE_THRESHOLD = 2.0
