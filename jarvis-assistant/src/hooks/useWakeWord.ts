import { useEffect, useRef, useCallback } from 'react'

// These phrases anywhere in the transcript trigger the wake word
const WAKE_PHRASES = ['jarvis', 'hey jarvis', 'okay jarvis', 'ok jarvis']

function containsWakeWord(transcript: string): boolean {
  const lower = transcript.toLowerCase()
  return WAKE_PHRASES.some((p) => lower.includes(p))
}

function getSpeechRecognition(): typeof SpeechRecognition | null {
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ??
    null
  )
}

interface UseWakeWordOptions {
  enabled: boolean
  paused:  boolean   // pause while main mic is recording
  onWakeWord: () => void
}

export function useWakeWord({ enabled, paused, onWakeWord }: UseWakeWordOptions): void {
  const recRef        = useRef<SpeechRecognition | null>(null)
  const shouldRunRef  = useRef(false)
  const pausedRef     = useRef(paused)
  const onWakeWordRef = useRef(onWakeWord)

  // Keep refs in sync without restarting the recognition
  useEffect(() => { pausedRef.current  = paused      }, [paused])
  useEffect(() => { onWakeWordRef.current = onWakeWord }, [onWakeWord])

  const stop = useCallback(() => {
    shouldRunRef.current = false
    try { recRef.current?.abort() } catch { /* ignore */ }
    recRef.current = null
  }, [])

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR || recRef.current) return

    const rec = new SR()
    rec.continuous      = true
    rec.interimResults  = false
    rec.lang            = 'en-US'
    rec.maxAlternatives = 3

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue
        for (let j = 0; j < e.results[i].length; j++) {
          if (containsWakeWord(e.results[i][j].transcript) && !pausedRef.current) {
            onWakeWordRef.current()
            return
          }
        }
      }
    }

    rec.onend = () => {
      recRef.current = null
      if (shouldRunRef.current && !pausedRef.current) {
        setTimeout(() => {
          if (shouldRunRef.current && !pausedRef.current) start()
        }, 400)
      }
    }

    rec.onerror = (e) => {
      // no-speech and aborted are expected; log anything else
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[JARVIS] Wake word error:', e.error)
      }
    }

    recRef.current = rec
    try { rec.start() } catch { recRef.current = null }
  }, [])

  useEffect(() => {
    if (enabled && !paused) {
      shouldRunRef.current = true
      start()
    } else {
      stop()
      // When un-paused while still enabled, restart
      if (enabled && !paused) {
        shouldRunRef.current = true
        start()
      }
    }
    return stop
  }, [enabled, paused, start, stop])
}
