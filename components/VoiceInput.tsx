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
        className={`p-2.5 rounded-xl border flex items-center justify-center text-xl transition-all duration-300 relative ${
          recording 
            ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-110' 
            : 'bg-transparent border-transparent text-neutral-500 hover:text-white hover:bg-white/5 hover:border-white/10'
        } ${disabled || transcribing ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-neutral-500' : 'cursor-pointer'}`}
        title={recording ? 'Listening… release to send' : transcribing ? 'Transcribing…' : 'Hold to speak'}
      >
        {recording && (
          <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping pointer-events-none" />
        )}
        <span className="relative z-10">{transcribing ? '⟳' : recording ? '⏹' : '🎙'}</span>
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
