import React, { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HUDBackground } from './components/HUDBackground'
import { TopBar } from './components/TopBar'
import { Orb } from './components/Orb'
import { ChatPanel } from './components/ChatPanel'
import { Toolbar } from './components/Toolbar'
import { SubtitleBar } from './components/SubtitleBar'
import { useChat } from './hooks/useChat'
import { useMic } from './hooks/useMic'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

type SystemStatus = 'online' | 'offline' | 'error'

export default function App(): React.JSX.Element {
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [chatOpen, setChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [subtitle, setSubtitle] = useState('')
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('offline')
  const spaceDownRef = useRef(false)

  // ── Backend health check ──────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3001/api/health')
        if (res.ok) {
          const data = await res.json()
          setSystemStatus(data.apiConfigured ? 'online' : 'error')
        } else {
          setSystemStatus('error')
        }
      } catch {
        setSystemStatus('offline')
      }
    }
    check()
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [])

  // ── Chat ──────────────────────────────────────────────────────────────────
  const { messages, sendMessage, isLoading } = useChat({
    onOrbStateChange: setOrbState,
    onSubtitleChange: setSubtitle
  })

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(text)
    },
    [sendMessage]
  )

  // ── Mic / STT ─────────────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    (text: string) => {
      if (!text.trim()) return
      // Open chat so user can see the recognized text + response
      setChatOpen(true)
      setActiveTab('chat')
      sendMessage(text)
    },
    [sendMessage]
  )

  const { isListening, volume, interim, error: micError, isSupported, startListening, stopAndSend, cancelListening } =
    useMic(handleTranscript)

  // Mirror listening state to orb
  useEffect(() => {
    if (isListening) {
      setOrbState('listening')
    } else if (orbState === 'listening') {
      // Only revert if nothing else took over
      setOrbState('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening])

  // Show mic error in subtitle
  useEffect(() => {
    if (micError) {
      setSubtitle(micError)
      setOrbState('error')
      const id = setTimeout(() => {
        setSubtitle('')
        setOrbState('idle')
      }, 4000)
      return () => clearTimeout(id)
    }
  }, [micError])

  // ── Toolbar mic toggle ────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (isListening) {
      stopAndSend()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopAndSend])

  // ── Space bar push-to-talk ────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in a text input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.code === 'Space' && !spaceDownRef.current) {
        e.preventDefault()
        spaceDownRef.current = true
        if (!isListening) startListening()
      }
      // Escape cancels
      if (e.code === 'Escape' && isListening) {
        cancelListening()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spaceDownRef.current) {
        e.preventDefault()
        spaceDownRef.current = false
        if (isListening) stopAndSend()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isListening, startListening, stopAndSend, cancelListening])

  // ── Toolbar / chat ────────────────────────────────────────────────────────
  const handleToolbarAction = useCallback(
    (id: string) => {
      if (id === 'chat') {
        const next = !chatOpen
        setChatOpen(next)
        setActiveTab(next ? 'chat' : null)
      } else if (id === 'mic') {
        setActiveTab((prev) => (prev === 'mic' ? null : 'mic'))
        toggleMic()
      } else {
        setActiveTab((prev) => (prev === id ? null : id))
      }
    },
    [chatOpen, toggleMic]
  )

  const handleOrbClick = useCallback(() => {
    const next = !chatOpen
    setChatOpen(next)
    setActiveTab(next ? 'chat' : null)
  }, [chatOpen])

  return (
    <div className="app">
      <HUDBackground />

      <TopBar systemStatus={systemStatus} />

      <main className="app-main">
        <Orb state={orbState} volume={volume} onClick={handleOrbClick} />
      </main>

      {/* Listening indicator */}
      {isListening && (
        <div className="ptt-hint">
          {interim ? (
            <span className="ptt-interim">{interim}</span>
          ) : (
            <span className="ptt-waiting">Listening… release Space or click mic to send</span>
          )}
        </div>
      )}

      <div className="app-bottom">
        <SubtitleBar text={subtitle} isVisible={!!subtitle} isListening={isListening} interim={interim} />
        <Toolbar
          activeTab={isListening ? 'mic' : activeTab}
          onAction={handleToolbarAction}
          orbState={orbState}
          isListening={isListening}
          isSupported={isSupported}
        />
      </div>

      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
            onClose={() => {
              setChatOpen(false)
              setActiveTab(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
