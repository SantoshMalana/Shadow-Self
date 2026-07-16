'use client'
import { useState, useRef, useEffect } from 'react'

interface VoiceInputProps {
  onTranscription: (text: string) => void
  mode?: 'train' | 'clone' | 'onboarding' | 'jarvis'
  disabled?: boolean
}

export default function VoiceInput({ onTranscription, mode = 'train', disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const stopRecording = () => {
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return
    mediaRecorder.current.stop()
    setRecording(false)
  }

  const toggleRecording = async () => {
    if (disabled || transcribing) return
    setError(null)

    // If already recording, stop
    if (recording) {
      stopRecording()
      return
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }

      mediaRecorder.current = new MediaRecorder(stream, { mimeType })
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        setTranscribing(true)
        try {
          const blob = new Blob(chunks.current, { type: mimeType })
          if (blob.size === 0) {
            throw new Error('Recording too short — try holding longer')
          }
          const formData = new FormData()
          const fileExtension = mimeType.includes('mp4') ? 'm4a' : 'webm'
          formData.append('audio', blob, `recording.${fileExtension}`)

          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()

          if (data.error) throw new Error(data.error)
          if (data.text) onTranscription(data.text)
          else throw new Error('No transcription returned')
        } catch (err: any) {
          setError(err.message || 'Transcription failed')
          setTimeout(() => setError(null), 4000)
        } finally {
          setTranscribing(false)
          stream.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.current.start(200)
      setRecording(true)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied — check browser permissions')
      } else {
        setError(err.message || 'Could not access microphone')
      }
      setTimeout(() => setError(null), 4000)
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={toggleRecording}
        disabled={disabled || transcribing}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light ${
          recording 
            ? 'bg-red-500/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110 animate-pulse' 
            : 'bg-accent-soft text-text-faint hover:text-accent-light hover:bg-accent-soft/80'
        } ${disabled || transcribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={recording ? 'Click to stop recording' : transcribing ? 'Transcribing…' : 'Click to speak'}
        aria-label={recording ? 'Stop recording' : transcribing ? 'Transcribing audio' : 'Start voice input'}
      >
        <span className="relative z-10">
          {transcribing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : recording ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          )}
        </span>
      </button>
      {error && (
        <div className="absolute bottom-full mb-3 whitespace-nowrap px-3 py-1.5 bg-card border border-red-900/50 text-red-400 text-[11px] rounded-[var(--radius-md)] animate-[fadeIn_0.2s_ease-out]">
          {error}
        </div>
      )}
    </div>
  )
}
