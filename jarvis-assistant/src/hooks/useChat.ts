import { useState, useCallback, useRef } from 'react'
import type { OrbState } from '../App'

const API_BASE = 'http://127.0.0.1:3001/api'

export type Personality = 'calm' | 'funny' | 'serious' | 'hype' | 'professional'
export type ActiveMode  = 'study' | 'gaming' | 'chill' | null

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isError?: boolean
  imagePreview?: string  // data URL for screenshot thumbnail
}

// ── Action types understood by the router ─────────────────────────────────────

interface OpenUrlAction        { type: 'open_url';        url: string;    description?: string }
interface SetVolumeAction      { type: 'set_volume';      value: number;  description?: string }
interface GetClipboard         { type: 'get_clipboard';                   description?: string }
interface ModeAction           { type: 'mode';            mode: string;   description?: string }
interface TakeScreenshotAction { type: 'take_screenshot';                 description?: string }

type Action = OpenUrlAction | SetVolumeAction | GetClipboard | ModeAction | TakeScreenshotAction

// ── Mode URL definitions ──────────────────────────────────────────────────────

const MODE_URLS: Record<string, string[]> = {
  study: [
    'https://www.youtube.com/results?search_query=lofi+hip+hop+beats+study',
    'https://pomofocus.io'
  ],
  gaming: [
    'discord://',
    'steam://'
  ],
  chill: [
    'https://music.youtube.com'
  ]
}

const MODE_PERSONALITIES: Record<string, Personality> = {
  study: 'serious',
  gaming: 'hype',
  chill:  'calm'
}

// ─────────────────────────────────────────────────────────────────────────────

interface UseChatOptions {
  onOrbStateChange:   (state: OrbState) => void
  onSubtitleChange:   (text: string) => void
  onSpeak?:           (text: string) => void
  onModeChange?:      (mode: ActiveMode, personality: Personality) => void
  onActionFeedback?:  (msg: string) => void
  onScreenFlash?:     () => void
}

interface UseChatReturn {
  messages:      Message[]
  sendMessage:   (text: string, personality?: Personality) => Promise<void>
  analyzeScreen: (personality?: Personality) => Promise<void>
  isLoading:     boolean
  isAnalyzing:   boolean
  clearMessages: () => void
}

// ── Action executor ───────────────────────────────────────────────────────────

async function openUrl(url: string): Promise<void> {
  const result = await window.jarvis?.openUrl(url)
  if (result && !result.success) {
    console.warn('[JARVIS] URL blocked or failed:', url, result.reason)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useChat({
  onOrbStateChange,
  onSubtitleChange,
  onSpeak,
  onModeChange,
  onActionFeedback,
  onScreenFlash
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages]     = useState<Message[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  const sendMessageRef = useRef<(text: string, personality?: Personality) => Promise<void>>(async () => {})

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, isError = false, imagePreview?: string): Message => {
      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: Date.now(),
        isError,
        imagePreview
      }
      setMessages((prev) => [...prev, msg])
      return msg
    },
    []
  )

  // ── Vision helper — capture, analyze, speak ───────────────────────────────────
  const captureAndAnalyze = useCallback(
    async (personality: Personality): Promise<void> => {
      onScreenFlash?.()

      const shot = await window.jarvis?.takeScreenshot()
      if (!shot) throw new Error('Screenshot capture returned nothing')

      const res = await fetch(`${API_BASE}/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: shot.base64 })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }

      const { description } = await res.json() as { description: string }
      const dataUrl = `data:image/png;base64,${shot.base64}`

      addMessage('assistant', description, false, dataUrl)

      onSubtitleChange(description)
      onOrbStateChange('speaking')
      if (onSpeak) {
        onSpeak(description)
      } else {
        setTimeout(() => { onSubtitleChange(''); onOrbStateChange('idle') }, 6000)
      }
    },
    [addMessage, onSubtitleChange, onOrbStateChange, onSpeak, onScreenFlash]
  )

  // ── Execute a single action ──────────────────────────────────────────────────
  const executeAction = useCallback(
    async (action: Action, personality: Personality): Promise<void> => {
      switch (action.type) {

        case 'open_url': {
          await openUrl(action.url)
          break
        }

        case 'set_volume': {
          const level = Math.max(0, Math.min(100, Number(action.value) || 50))
          const result = await window.jarvis?.setVolume(level)
          if (result && !result.success) {
            onActionFeedback?.(`Volume control unavailable: ${result.error ?? 'unknown error'}`)
          }
          break
        }

        case 'get_clipboard': {
          const text = await window.jarvis?.getClipboard()
          if (!text?.trim()) {
            onActionFeedback?.('Clipboard is empty.')
            break
          }
          const truncated = text.length > 3000 ? text.slice(0, 3000) + ' …(truncated)' : text
          setTimeout(() => {
            sendMessageRef.current(
              `The user wants a summary of this clipboard text. Summarize it concisely in plain speech:\n\n${truncated}`,
              personality
            )
          }, 800)
          break
        }

        case 'mode': {
          const modeName = action.mode as keyof typeof MODE_URLS
          const urls = MODE_URLS[modeName] ?? []
          const modePersonality = MODE_PERSONALITIES[modeName] ?? personality

          for (let i = 0; i < urls.length; i++) {
            setTimeout(() => openUrl(urls[i]), i * 600)
          }

          onModeChange?.(modeName as ActiveMode, modePersonality)
          break
        }

        case 'take_screenshot': {
          try {
            await captureAndAnalyze(personality)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Screen capture failed.'
            onActionFeedback?.(`Vision error: ${msg}`)
          }
          break
        }
      }
    },
    [onActionFeedback, onModeChange, captureAndAnalyze]
  )

  // ── Send a message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, personality: Personality = 'calm') => {
      if (!text.trim() || isLoading) return

      addMessage('user', text)
      historyRef.current.push({ role: 'user', content: text })

      setIsLoading(true)
      onOrbStateChange('thinking')

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyRef.current, personality })
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
        }

        const data = await res.json() as { message: string; action: Action | null }
        const reply = data.message

        addMessage('assistant', reply)
        historyRef.current.push({ role: 'assistant', content: reply })

        onSubtitleChange(reply)
        onOrbStateChange('speaking')

        if (onSpeak) {
          onSpeak(reply)
        } else {
          setTimeout(() => { onSubtitleChange(''); onOrbStateChange('idle') }, 6000)
        }

        if (data.action) {
          setTimeout(() => executeAction(data.action!, personality), 700)
        }

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Connection failed. Is the backend running?'

        onOrbStateChange('error')
        onSubtitleChange('System error. Check the console.')
        addMessage('assistant', `⚠ ${errMsg}`, true)

        setTimeout(() => { onOrbStateChange('idle'); onSubtitleChange('') }, 4000)
        console.error('[JARVIS] sendMessage error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage, onOrbStateChange, onSubtitleChange, onSpeak, executeAction]
  )

  sendMessageRef.current = sendMessage

  // ── Analyze screen (toolbar button / direct trigger) ──────────────────────────
  const analyzeScreen = useCallback(
    async (personality: Personality = 'calm') => {
      if (isAnalyzing || isLoading) return

      setIsAnalyzing(true)
      onOrbStateChange('thinking')
      addMessage('user', 'Take a look at my screen.')

      try {
        await captureAndAnalyze(personality)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Screen analysis failed.'
        addMessage('assistant', `⚠ ${errMsg}`, true)
        onOrbStateChange('error')
        onSubtitleChange('Vision error.')
        setTimeout(() => { onOrbStateChange('idle'); onSubtitleChange('') }, 4000)
        console.error('[JARVIS] analyzeScreen error:', err)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [isAnalyzing, isLoading, addMessage, onOrbStateChange, onSubtitleChange, captureAndAnalyze]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, sendMessage, analyzeScreen, isLoading, isAnalyzing, clearMessages }
}
