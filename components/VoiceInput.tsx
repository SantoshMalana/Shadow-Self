'use client'
import { useState, useRef } from 'react'

interface VoiceInputProps {
  onTranscription: (text: string) => void
  mode?: 'train' | 'clone'
  disabled?: boolean
}

export default function VoiceInput({ onTranscription, mode = 'train', disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    if (disabled || recording) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        setTranscribing(true)
        try {
          const blob = new Blob(chunks.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')

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

      mediaRecorder.current.start()
      setRecording(true)
    } catch (err: any) {
      setError('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (!recording) return
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled || transcribing}
        className={`
          p-2 rounded-lg transition-all
          ${recording ? 'bg-red-500/20 text-red-500' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={recording ? 'Listening… release to send' : transcribing ? 'Transcribing…' : 'Hold to speak'}
      >
        <span className="text-xl">
          {transcribing ? '⟳' : recording ? '⏹' : '🎙'}
        </span>
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  )
}
