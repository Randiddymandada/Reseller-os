import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OrbState } from '../App'

interface OrbProps {
  state: OrbState
  onClick: () => void
}

const stateColors: Record<OrbState, string> = {
  idle: '#00d4ff',
  listening: '#00ffcc',
  thinking: '#00d4ff',
  speaking: '#0099ff',
  error: '#ff3b3b'
}

const stateLabels: Record<OrbState, string> = {
  idle: 'STANDBY',
  listening: 'LISTENING',
  thinking: 'PROCESSING',
  speaking: 'RESPONDING',
  error: 'ERROR'
}

export function Orb({ state, onClick }: OrbProps): React.JSX.Element {
  const [ripples, setRipples] = useState<number[]>([])
  const color = stateColors[state]

  const handleClick = () => {
    const id = Date.now()
    setRipples((prev) => [...prev, id])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r !== id)), 900)
    onClick()
  }

  const isThinking = state === 'thinking'
  const isSpeaking = state === 'speaking'
  const isError = state === 'error'
  const isListening = state === 'listening'

  return (
    <div className="orb-wrapper">
      {/* State label above orb */}
      <motion.div
        className="orb-state-label"
        key={state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="orb-state-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        {stateLabels[state]}
      </motion.div>

      <div
        className="orb-container"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`JARVIS orb — ${stateLabels[state]}`}
      >
        {/* Click ripples */}
        <AnimatePresence>
          {ripples.map((id) => (
            <motion.div
              key={id}
              className="orb-ripple"
              style={{ borderColor: color }}
              initial={{ width: 160, height: 160, opacity: 0.8 }}
              animate={{ width: 340, height: 340, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Ring 1 — outermost */}
        <motion.div
          className="orb-ring orb-ring-1"
          style={{ borderColor: `${color}33` }}
          animate={{ rotate: 360 }}
          transition={{ duration: isThinking ? 3 : 12, repeat: Infinity, ease: 'linear' }}
        >
          <div className="orb-ring-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        </motion.div>

        {/* Ring 2 */}
        <motion.div
          className="orb-ring orb-ring-2"
          style={{ borderColor: `${color}55` }}
          animate={{ rotate: -360 }}
          transition={{ duration: isThinking ? 2 : 8, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="orb-ring-dot orb-ring-dot-sm"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
        </motion.div>

        {/* Ring 3 — inner */}
        <motion.div
          className="orb-ring orb-ring-3"
          style={{ borderColor: `${color}77` }}
          animate={{ rotate: 360 }}
          transition={{ duration: isThinking ? 1.2 : 5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Core sphere */}
        <motion.div
          className="orb-core"
          style={{ borderColor: `${color}99` }}
          animate={
            isError
              ? {
                  boxShadow: [
                    `0 0 30px ${color}66, 0 0 60px ${color}33, inset 0 0 30px ${color}22`,
                    `0 0 50px ${color}cc, 0 0 100px ${color}66, inset 0 0 50px ${color}44`,
                    `0 0 30px ${color}66, 0 0 60px ${color}33, inset 0 0 30px ${color}22`
                  ]
                }
              : isThinking
                ? {
                    boxShadow: [
                      `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`,
                      `0 0 55px ${color}99, 0 0 110px ${color}44, inset 0 0 55px ${color}33`,
                      `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`
                    ],
                    scale: [1, 1.03, 1]
                  }
                : isSpeaking
                  ? {
                      scale: [1, 1.05, 1, 1.03, 1],
                      boxShadow: [
                        `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`,
                        `0 0 60px ${color}bb, 0 0 120px ${color}55, inset 0 0 60px ${color}33`,
                        `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`
                      ]
                    }
                  : isListening
                    ? {
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`,
                          `0 0 45px ${color}88, 0 0 90px ${color}44, inset 0 0 45px ${color}28`,
                          `0 0 30px ${color}55, 0 0 60px ${color}22, inset 0 0 30px ${color}18`
                        ]
                      }
                    : {
                        scale: [1, 1.015, 1],
                        boxShadow: [
                          `0 0 30px ${color}44, 0 0 60px ${color}18, inset 0 0 30px ${color}12`,
                          `0 0 40px ${color}66, 0 0 80px ${color}28, inset 0 0 40px ${color}1a`,
                          `0 0 30px ${color}44, 0 0 60px ${color}18, inset 0 0 30px ${color}12`
                        ]
                      }
          }
          transition={{
            duration: isError ? 0.5 : isThinking ? 0.8 : isSpeaking ? 0.6 : isListening ? 1.2 : 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Sphere highlight */}
          <div className="orb-core-highlight" />

          {/* Inner glow */}
          <motion.div
            className="orb-core-inner-glow"
            style={{ background: `radial-gradient(circle, ${color}33, transparent 70%)` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* J label */}
          <span className="orb-label" style={{ color, textShadow: `0 0 20px ${color}, 0 0 40px ${color}88` }}>
            J
          </span>
        </motion.div>

        {/* Outer ambient glow */}
        <motion.div
          className="orb-ambient"
          style={{ background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Click hint */}
      <div className="orb-hint">CLICK TO OPEN CHAT</div>
    </div>
  )
}
