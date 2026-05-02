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
}

// ── Action types understood by the router ─────────────────────────────────────

interface OpenUrlAction  { type: 'open_url';     url: string;         description?: string }
interface SetVolumeAction{ type: 'set_volume';   value: number;       description?: string }
interface GetClipboard   { type: 'get_clipboard';                     description?: string }
interface ModeAction     { type: 'mode';         mode: string;        description?: string }

type Action = OpenUrlAction | SetVolumeAction | GetClipboard | ModeAction

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
}

interface UseChatReturn {
  messages:      Message[]
  sendMessage:   (text: string, personality?: Personality) => Promise<void>
  isLoading:     boolean
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
  onActionFeedback
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  // Keep a stable ref to sendMessage so clipboard handler can call it
  const sendMessageRef = useRef<(text: string, personality?: Personality) => Promise<void>>(async () => {})

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, isError = false): Message => {
      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: Date.now(),
        isError
      }
      setMessages((prev) => [...prev, msg])
      return msg
    },
    []
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
          // Truncate very long clipboard content
          const truncated = text.length > 3000 ? text.slice(0, 3000) + ' …(truncated)' : text
          // Brief pause so JARVIS finishes speaking before sending follow-up
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

          // Open each URL with a short stagger so the OS doesn't block them as popups
          for (let i = 0; i < urls.length; i++) {
            setTimeout(() => openUrl(urls[i]), i * 600)
          }

          onModeChange?.(modeName as ActiveMode, modePersonality)
          break
        }
      }
    },
    [onActionFeedback, onModeChange]
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

        // Execute the action after a short delay so JARVIS can start speaking first
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

  // Keep the ref in sync so the clipboard handler always has the latest version
  sendMessageRef.current = sendMessage

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, sendMessage, isLoading, clearMessages }
}
