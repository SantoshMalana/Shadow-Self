'use client'
import { useState, useRef } from 'react'

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

  const startRecording = async () => {
    if (disabled || recording) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try to use a format Groq Whisper is more likely to accept
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
          // Groq Whisper sometimes rejects "recording.webm", but accepts it if we just name it .wav or .m4a so ffmpeg handles it
          const fileExtension = mimeType.includes('mp4') ? 'm4a' : 'wav'
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

      mediaRecorder.current.start(200) // Collect data every 200ms
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
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: recording ? 'rgba(239,68,68,0.15)' : 'transparent',
          color: recording ? '#ef4444' : '#666',
          cursor: disabled || transcribing ? 'not-allowed' : 'pointer',
          opacity: disabled || transcribing ? 0.5 : 1,
          fontSize: '20px',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={recording ? 'Listening… release to send' : transcribing ? 'Transcribing…' : 'Hold to speak'}
      >
        {transcribing ? '⟳' : recording ? '⏹' : '🎙'}
      </button>
      {error && (
        <div style={{
          position: 'absolute', bottom: '100%', marginBottom: '8px',
          whiteSpace: 'nowrap', padding: '4px 8px',
          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
          fontSize: '11px', borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
