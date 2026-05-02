import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HUDBackground } from './components/HUDBackground'
import { TopBar } from './components/TopBar'
import { Orb } from './components/Orb'
import { ChatPanel } from './components/ChatPanel'
import { Toolbar } from './components/Toolbar'
import { SubtitleBar } from './components/SubtitleBar'
import { useChat } from './hooks/useChat'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

type SystemStatus = 'online' | 'offline' | 'error'

export default function App(): React.JSX.Element {
  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [chatOpen, setChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [subtitle, setSubtitle] = useState('')
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('offline')

  // Check backend health on mount
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
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  const { messages, sendMessage, isLoading, clearMessages } = useChat({
    onOrbStateChange: setOrbState,
    onSubtitleChange: setSubtitle
  })

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(text)
    },
    [sendMessage]
  )

  const handleToolbarAction = useCallback(
    (id: string) => {
      if (id === 'chat') {
        const next = !chatOpen
        setChatOpen(next)
        setActiveTab(next ? 'chat' : null)
      } else {
        // Stage 2+ features — show a polite orb hint for now
        setActiveTab((prev) => (prev === id ? null : id))
      }
    },
    [chatOpen]
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
        <Orb state={orbState} onClick={handleOrbClick} />
      </main>

      <div className="app-bottom">
        <SubtitleBar text={subtitle} isVisible={!!subtitle} />
        <Toolbar activeTab={activeTab} onAction={handleToolbarAction} orbState={orbState} />
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
