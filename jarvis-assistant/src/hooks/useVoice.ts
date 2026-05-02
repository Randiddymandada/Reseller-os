/**
 * useVoice — Stage 3
 *
 * Realistic voice output via ElevenLabs (primary) with Web Speech API fallback.
 *
 * When ElevenLabs plays, the audio is routed through AudioContext so we can
 * sample the playback volume in real time — the orb then pulses with JARVIS's
 * actual voice amplitude.
 *
 * If ELEVENLABS_API_KEY is not configured, falls back to Web Speech synthesis
 * automatically (no error shown to user).
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { Personality } from './useChat'

const API_BASE = 'http://127.0.0.1:3001/api'

interface UseVoiceOptions {
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
  onVolumeChange?: (volume: number) => void
}

export type VoiceMode = 'elevenlabs' | 'webspeech' | 'silent'

export interface UseVoiceReturn {
  speak: (text: string, personality?: Personality) => Promise<void>
  stop: () => void
  isSpeaking: boolean
  mode: VoiceMode
}

export function useVoice({
  onSpeakStart,
  onSpeakEnd,
  onVolumeChange
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [mode, setMode] = useState<VoiceMode>('silent')

  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef     = useRef<Uint8Array | null>(null)
  const rafRef      = useRef<number | null>(null)
  const blobUrlRef  = useRef<string | null>(null)

  // ── Volume analyser for ElevenLabs playback ────────────────────────────────
  const startPlaybackAnalyser = useCallback(
    (audio: HTMLAudioElement) => {
      try {
        // AudioContext must be created/resumed after a user gesture in Chromium
        const ctx = new AudioContext()
        audioCtxRef.current = ctx

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.82
        analyserRef.current = analyser
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)

        // Must connect source → analyser → destination for audio to play
        const source = ctx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(ctx.destination)

        const tick = () => {
          if (!analyserRef.current || !dataRef.current) return
          analyserRef.current.getByteFrequencyData(dataRef.current)
          // Focus on voice frequency range (first ~32 buckets at 256 fftSize)
          const slice = dataRef.current.slice(0, 32)
          const avg = slice.reduce((a, b) => a + b, 0) / slice.length
          onVolumeChange?.(Math.min(1, avg / 65))
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (err) {
        console.warn('[JARVIS Voice] Playback analyser failed (non-fatal):', err)
      }
    },
    [onVolumeChange]
  )

  const stopPlaybackAnalyser = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    analyserRef.current = null
    dataRef.current = null
    onVolumeChange?.(0)
  }, [onVolumeChange])

  const releaseBlobUrl = useCallback(() => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
  }, [])

  // ── Stop all audio ─────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    // ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    releaseBlobUrl()
    stopPlaybackAnalyser()
    // Web Speech
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    onSpeakEnd?.()
  }, [stopPlaybackAnalyser, releaseBlobUrl, onSpeakEnd])

  // ── Web Speech API fallback ────────────────────────────────────────────────
  const speakWebSpeech = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) {
        setMode('silent')
        onSpeakEnd?.()
        return
      }

      setMode('webspeech')
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      const go = () => {
        const voices = window.speechSynthesis.getVoices()
        // Prefer a British male voice — closest to JARVIS feel
        const voice =
          voices.find((v) => v.name === 'Google UK English Male') ||
          voices.find((v) => v.name === 'Daniel' && v.lang.startsWith('en')) ||
          voices.find((v) => v.lang === 'en-GB') ||
          voices.find((v) => v.lang.startsWith('en-') && !v.localService) ||
          voices.find((v) => v.lang.startsWith('en-'))

        if (voice) utterance.voice = voice
        utterance.rate   = 0.88
        utterance.pitch  = 0.82
        utterance.volume = 0.95

        utterance.onstart = () => { setIsSpeaking(true); onSpeakStart?.() }
        utterance.onend   = () => { setIsSpeaking(false); onSpeakEnd?.() }
        utterance.onerror = () => { setIsSpeaking(false); onSpeakEnd?.() }

        window.speechSynthesis.speak(utterance)
      }

      // Voices might not be loaded yet on first call
      if (window.speechSynthesis.getVoices().length > 0) {
        go()
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
      }
    },
    [onSpeakStart, onSpeakEnd]
  )

  // ── ElevenLabs TTS ─────────────────────────────────────────────────────────
  const speak = useCallback(
    async (text: string, personality: Personality = 'calm') => {
      if (!text.trim()) return
      stop() // cancel any currently playing audio first

      try {
        const res = await fetch(`${API_BASE}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, personality })
        })

        // 503 = not configured → fall back silently
        if (res.status === 503) {
          const body = await res.json().catch(() => ({})) as { fallback?: boolean }
          if (body.fallback) { speakWebSpeech(text); return }
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { fallback?: boolean; error?: string }
          if (body.fallback) { speakWebSpeech(text); return }
          throw new Error(body.error ?? `TTS HTTP ${res.status}`)
        }

        const blob = await res.blob()
        if (blob.size === 0) throw new Error('Empty audio buffer from ElevenLabs')

        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url

        const audio = new Audio()
        audioRef.current = audio
        setMode('elevenlabs')

        audio.oncanplaythrough = () => {
          startPlaybackAnalyser(audio)
          setIsSpeaking(true)
          onSpeakStart?.()
          audio.play().catch((err) => {
            console.error('[JARVIS Voice] Playback error:', err)
            stopPlaybackAnalyser()
            releaseBlobUrl()
            setIsSpeaking(false)
            onSpeakEnd?.()
          })
        }

        audio.onended = () => {
          stopPlaybackAnalyser()
          releaseBlobUrl()
          setIsSpeaking(false)
          audioRef.current = null
          onSpeakEnd?.()
        }

        audio.onerror = () => {
          console.error('[JARVIS Voice] Audio element error — falling back to Web Speech')
          stopPlaybackAnalyser()
          releaseBlobUrl()
          audioRef.current = null
          speakWebSpeech(text)
        }

        audio.src = url
        audio.load()
      } catch (err) {
        console.error('[JARVIS Voice] ElevenLabs error:', err)
        speakWebSpeech(text)
      }
    },
    [stop, startPlaybackAnalyser, stopPlaybackAnalyser, releaseBlobUrl, speakWebSpeech, onSpeakStart, onSpeakEnd]
  )

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop])

  return { speak, stop, isSpeaking, mode }
}
