export type SignalType = 'idle_seconds' | 'file_hop_rate' | 'save_gap' | 'error_class'

export type WorkflowBoundary = 'post_save_after_gap' | 'post_build' | 'post_test_run' | 'post_commit'

export interface FrictionPing {
  userId?: string    // resolved via API key server-side
  signalType: SignalType
  value: number | string
  context?: Record<string, unknown>
}

export interface ScoutApiResponse {
  success: boolean
  queued?: boolean
  error?: string
}
