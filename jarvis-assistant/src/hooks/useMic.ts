/**
 * useMic — Stage 2
 *
 * Combines Web Speech API (STT) with an AudioContext volume analyser so the
 * orb can react to the user's voice in real time.
 *
 * Web Speech API in Electron (Chromium) sends audio to Google's speech
 * servers. An internet connection is required for recognition.
 *
 * Usage:
 *   const { isListening, volume, interim, startListening, stopAndSend } = useMic(onTranscript)
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Web Speech API type shims ───────────────────────────────────────────────
interface SpeechRecognitionResultItem {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionResultItem
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseMicReturn {
  isListening: boolean
  volume: number         // 0–1 real-time mic level
  interim: string        // live partial transcript
  transcript: string     // confirmed final transcript
  error: string | null
  isSupported: boolean
  startListening: () => Promise<void>
  stopAndSend: () => string  // stops, returns full transcript, resets
  cancelListening: () => void
}

export function useMic(onTranscript?: (text: string) => void): UseMicReturn {
  const [isListening, setIsListening] = useState(false)
  const [volume, setVolume] = useState(0)
  const [interim, setInterim] = useState('')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Refs — survive re-renders without triggering effects
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTextRef = useRef('')              // accumulated confirmed words
  const shouldRestartRef = useRef(false)       // restart after auto-pause
  const isListeningRef = useRef(false)         // sync ref for callbacks

  // AudioContext volume analyser
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  const isSupported = !!getSpeechRecognition()

  // ── Volume analyser ────────────────────────────────────────────────────────

  const startVolumeAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      const tick = () => {
        if (!analyserRef.current || !dataArrayRef.current) return
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        // Average the lower-frequency buckets (voice range) for a better signal
        const slice = dataArrayRef.current.slice(0, 32)
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length
        // Normalize to 0–1 with some headroom
        setVolume(Math.min(1, avg / 70))
        animFrameRef.current = requestAnimationFrame(tick)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.warn('[JARVIS] Volume analyser error (non-fatal):', err)
      // Volume won't work but STT can still function
    }
  }, [])

  const stopVolumeAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    dataArrayRef.current = null
    setVolume(0)
  }, [])

  // ── Speech recognition ─────────────────────────────────────────────────────

  const buildRecognition = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return null

    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    r.maxAlternatives = 1

    r.onstart = () => {
      console.log('[JARVIS] Recognition started')
    }

    r.onresult = (e: SpeechRecognitionEvent) => {
      let newFinal = ''
      let newInterim = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          newFinal += text
        } else {
          newInterim += text
        }
      }

      if (newFinal) {
        finalTextRef.current += (finalTextRef.current ? ' ' : '') + newFinal.trim()
        setTranscript(finalTextRef.current)
      }
      setInterim(newInterim)
    }

    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return // expected
      console.error('[JARVIS] Recognition error:', e.error)
      setError(`Mic error: ${e.error}`)
    }

    r.onend = () => {
      // If we're still supposed to be listening, restart (handles auto-pause)
      if (shouldRestartRef.current && isListeningRef.current) {
        try {
          r.start()
        } catch {
          // Already started — ignore
        }
      }
    }

    return r
  }, [])

  // ── Public API ─────────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (isListeningRef.current) return
    if (!isSupported) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    setError(null)
    finalTextRef.current = ''
    setTranscript('')
    setInterim('')
    isListeningRef.current = true
    shouldRestartRef.current = true
    setIsListening(true)

    const recognition = buildRecognition()
    if (!recognition) return
    recognitionRef.current = recognition

    await startVolumeAnalyser()

    try {
      recognition.start()
    } catch (err) {
      console.error('[JARVIS] Recognition start error:', err)
      setError('Could not start microphone. Check permissions.')
      setIsListening(false)
      isListeningRef.current = false
    }
  }, [isSupported, buildRecognition, startVolumeAnalyser])

  const stopAndSend = useCallback((): string => {
    shouldRestartRef.current = false
    isListeningRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    stopVolumeAnalyser()
    setInterim('')
    setIsListening(false)

    const result = finalTextRef.current.trim()
    finalTextRef.current = ''
    setTranscript('')

    if (result && onTranscript) {
      onTranscript(result)
    }

    return result
  }, [stopVolumeAnalyser, onTranscript])

  const cancelListening = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    stopVolumeAnalyser()
    finalTextRef.current = ''
    setTranscript('')
    setInterim('')
    setIsListening(false)
  }, [stopVolumeAnalyser])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      isListeningRef.current = false
      recognitionRef.current?.abort()
      stopVolumeAnalyser()
    }
  }, [stopVolumeAnalyser])

  return {
    isListening,
    volume,
    interim,
    transcript,
    error,
    isSupported,
    startListening,
    stopAndSend,
    cancelListening
  }
}
