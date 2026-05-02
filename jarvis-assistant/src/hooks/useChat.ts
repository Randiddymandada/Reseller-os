import { useState, useCallback, useRef } from 'react'
import type { OrbState } from '../App'

const API_BASE = 'http://127.0.0.1:3001/api'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isError?: boolean
}

interface Action {
  type: 'open_url' | 'search'
  url?: string
  query?: string
  description?: string
}

interface UseChatOptions {
  onOrbStateChange: (state: OrbState) => void
  onSubtitleChange: (text: string) => void
}

interface UseChatReturn {
  messages: Message[]
  sendMessage: (text: string) => Promise<void>
  isLoading: boolean
  clearMessages: () => void
}

async function executeAction(action: Action): Promise<void> {
  let url: string | null = null

  if (action.type === 'open_url' && action.url) {
    url = action.url
  } else if (action.type === 'search' && action.query) {
    url = `https://www.google.com/search?q=${encodeURIComponent(action.query)}`
  }

  if (url && window.jarvis?.openUrl) {
    const result = await window.jarvis.openUrl(url)
    if (!result.success) {
      console.warn('[JARVIS] URL blocked:', url, result.reason)
    }
  }
}

export function useChat({ onOrbStateChange, onSubtitleChange }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])

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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      // Add user message
      addMessage('user', text)
      historyRef.current.push({ role: 'user', content: text })

      setIsLoading(true)
      onOrbStateChange('thinking')

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyRef.current })
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(err.error || `HTTP ${res.status}`)
        }

        const data: { message: string; action: Action | null } = await res.json()
        const reply = data.message

        // Add assistant message
        addMessage('assistant', reply)
        historyRef.current.push({ role: 'assistant', content: reply })

        // Show subtitle and set speaking state
        onSubtitleChange(reply)
        onOrbStateChange('speaking')

        // Clear subtitle after 6 seconds
        setTimeout(() => {
          onSubtitleChange('')
          onOrbStateChange('idle')
        }, 6000)

        // Execute PC action if present
        if (data.action) {
          setTimeout(() => executeAction(data.action!), 500)
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : 'Connection failed. Is the backend running?'

        onOrbStateChange('error')
        onSubtitleChange('System error. Check console for details.')
        addMessage('assistant', `⚠ ${errMsg}`, true)

        setTimeout(() => {
          onOrbStateChange('idle')
          onSubtitleChange('')
        }, 4000)

        console.error('[JARVIS] sendMessage error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage, onOrbStateChange, onSubtitleChange]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, sendMessage, isLoading, clearMessages }
}
