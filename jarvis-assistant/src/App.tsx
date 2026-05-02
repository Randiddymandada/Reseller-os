import React, { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HUDBackground } from './components/HUDBackground'
import { TopBar } from './components/TopBar'
import { Orb } from './components/Orb'
import { ChatPanel } from './components/ChatPanel'
import { Toolbar } from './components/Toolbar'
import { SubtitleBar } from './components/SubtitleBar'
import { PersonalityBar } from './components/PersonalityBar'
import { useChat } from './hooks/useChat'
import { useMic } from './hooks/useMic'
import { useVoice } from './hooks/useVoice'
import type { Personality } from './hooks/useChat'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

type SystemStatus = 'online' | 'offline' | 'error'

export default function App(): React.JSX.Element {
  const [orbState, setOrbState]         = useState<OrbState>('idle')
  const [orbVolume, setOrbVolume]       = useState(0)   // drives orb ring animation
  const [chatOpen, setChatOpen]         = useState(false)
  const [activeTab, setActiveTab]       = useState<string | null>(null)
  const [subtitle, setSubtitle]         = useState('')
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('offline')
  const [personality, setPersonality]   = useState<Personality>('calm')
  const [ttsMode, setTtsMode]           = useState<'elevenlabs' | 'webspeech' | 'silent'>('silent')
  const spaceDownRef = useRef(false)

  // ── Backend health check ──────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res  = await fetch('http://127.0.0.1:3001/api/health')
        const data = await res.json() as { apiConfigured: boolean; ttsConfigured: boolean }
        setSystemStatus(data.apiConfigured ? 'online' : 'error')
        if (data.ttsConfigured) setTtsMode('elevenlabs')
      } catch {
        setSystemStatus('offline')
      }
    }
    check()
    const id = setInterval(check, 20000)
    return () => clearInterval(id)
  }, [])

  // ── Voice output (ElevenLabs / Web Speech) ────────────────────────────────
  const { speak, stop: stopSpeaking, isSpeaking, mode: activeVoiceMode } = useVoice({
    onSpeakStart: () => {
      setOrbState('speaking')
      setTtsMode(activeVoiceMode === 'elevenlabs' ? 'elevenlabs' : 'webspeech')
    },
    onSpeakEnd: () => {
      setOrbState('idle')
      setSubtitle('')
      setOrbVolume(0)
    },
    onVolumeChange: (v) => {
      // Only pipe to orb when JARVIS is speaking (not when mic is active)
      if (isSpeaking) setOrbVolume(v)
    }
  })

  // ── Chat ──────────────────────────────────────────────────────────────────
  const { messages, sendMessage, isLoading } = useChat({
    onOrbStateChange: setOrbState,
    onSubtitleChange: setSubtitle,
    onSpeak: (text) => speak(text, personality)
  })

  const handleSend = useCallback(
    async (text: string) => sendMessage(text, personality),
    [sendMessage, personality]
  )

  // ── Mic / STT ─────────────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    (text: string) => {
      if (!text.trim()) return
      setChatOpen(true)
      setActiveTab('chat')
      // Stop JARVIS speaking if interrupted by user
      if (isSpeaking) stopSpeaking()
      sendMessage(text, personality)
    },
    [sendMessage, personality, isSpeaking, stopSpeaking]
  )

  const {
    isListening,
    volume: micVolume,
    interim,
    error: micError,
    isSupported,
    startListening,
    stopAndSend,
    cancelListening
  } = useMic(handleTranscript)

  // Orb volume = mic when listening, TTS playback when speaking
  useEffect(() => {
    if (isListening) {
      setOrbVolume(micVolume)
      setOrbState('listening')
    } else if (orbState === 'listening' && !isSpeaking) {
      setOrbState('idle')
      setOrbVolume(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, micVolume])

  // Surface mic errors
  useEffect(() => {
    if (!micError) return
    setSubtitle(micError)
    setOrbState('error')
    const id = setTimeout(() => { setSubtitle(''); setOrbState('idle') }, 4000)
    return () => clearTimeout(id)
  }, [micError])

  // ── Mic toggle ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (isListening) { stopAndSend() }
    else             { if (isSpeaking) stopSpeaking(); startListening() }
  }, [isListening, startListening, stopAndSend, isSpeaking, stopSpeaking])

  // ── Space bar push-to-talk ────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.code === 'Space' && !spaceDownRef.current) {
        e.preventDefault()
        spaceDownRef.current = true
        if (!isListening) { if (isSpeaking) stopSpeaking(); startListening() }
      }
      if (e.code === 'Escape' && isListening) cancelListening()
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spaceDownRef.current) {
        e.preventDefault()
        spaceDownRef.current = false
        if (isListening) stopAndSend()
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [isListening, startListening, stopAndSend, cancelListening, isSpeaking, stopSpeaking])

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const handleToolbarAction = useCallback(
    (id: string) => {
      if (id === 'chat') {
        const next = !chatOpen
        setChatOpen(next)
        setActiveTab(next ? 'chat' : null)
      } else if (id === 'mic') {
        setActiveTab((p) => (p === 'mic' ? null : 'mic'))
        toggleMic()
      } else {
        setActiveTab((p) => (p === id ? null : id))
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

      {/* Personality bar — sits below top bar */}
      <PersonalityBar current={personality} onChange={setPersonality} />

      <main className="app-main">
        <Orb state={orbState} volume={orbVolume} onClick={handleOrbClick} />
      </main>

      {/* Voice mode badge */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="speaking-badge"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <motion.span
              className="speaking-badge-dot"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            {activeVoiceMode === 'elevenlabs' ? 'ELEVENLABS' : 'WEB SPEECH'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push-to-talk interim transcript overlay */}
      {isListening && (
        <div className="ptt-hint">
          {interim
            ? <span className="ptt-interim">{interim}</span>
            : <span className="ptt-waiting">Listening… release Space or click mic to send</span>
          }
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
            onClose={() => { setChatOpen(false); setActiveTab(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
