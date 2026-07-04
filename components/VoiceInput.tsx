'use client'
import { useState, useRef, useEffect } from 'react'

interface VoiceInputProps {
  onTranscription: (text: string) => void
  mode?: 'train' | 'clone' | 'onboarding'
  disabled?: boolean
}

export default function VoiceInput({ onTranscription, mode = 'train', disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const recordingRef = useRef(false)

  const stopRecording = () => {
    if (!recordingRef.current) return
    mediaRecorder.current?.stop()
    setRecording(false)
    recordingRef.current = false
  }

  useEffect(() => {
    const handleWindowMouseUp = () => stopRecording()
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => window.removeEventListener('mouseup', handleWindowMouseUp)
  }, [])

  const startRecording = async () => {
    if (disabled || recordingRef.current) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
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
            throw new Error('Recording too short')
          }
          const formData = new FormData()
          const fileExtension = mimeType.includes('mp4') ? 'm4a' : 'webm'
          formData.append('audio', blob, `recording.${fileExtension}`)

          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()

          if (data.error) throw new Error(data.error)
          if (data.text) onTranscription(data.text)
        } catch (err: any) {
          setError(err.message || 'Transcription failed')
        } finally {
          setTranscribing(false)
          stream.getTracks().forEach(t => t.stop())
        }
      }

      mediaRecorder.current.start(200)
      setRecording(true)
      recordingRef.current = true
    } catch (err: any) {
      setError('Microphone access denied')
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        onMouseDown={startRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        onTouchCancel={stopRecording}
        disabled={disabled || transcribing}
        className={`w-10 h-10 rounded-sm border flex items-center justify-center text-lg transition-colors duration-200 relative ${
          recording 
            ? 'bg-accent-brass border-accent-brass text-[#17161B]' 
            : 'bg-surface border-[#2A2630] text-text-muted hover:text-text-primary hover:border-text-muted'
        } ${disabled || transcribing ? 'opacity-50 cursor-not-allowed hover:bg-surface hover:border-[#2A2630] hover:text-text-muted' : 'cursor-pointer'}`}
        title={recording ? 'Listening… release to send' : transcribing ? 'Transcribing…' : 'Hold to speak'}
      >
        <span className="relative z-10 font-mono">{transcribing ? '⟳' : recording ? '⏹' : '🎙'}</span>
      </button>
      {error && (
        <div className="absolute bottom-full mb-3 whitespace-nowrap px-3 py-1.5 bg-[#1C1A21] border border-red-900/50 text-red-400 font-mono text-[10px] uppercase tracking-widest rounded-sm">
          [ERROR: {error}]
        </div>
      )}
    </div>
  )
}
