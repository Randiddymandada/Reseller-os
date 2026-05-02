import React, { useState } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import type { OrbState } from '../App'

interface OrbProps {
  state: OrbState
  volume: number   // 0–1, real-time mic level
  onClick: () => void
}

const STATE_COLOR: Record<OrbState, string> = {
  idle:      '#00d4ff',
  listening: '#00ffcc',
  thinking:  '#00d4ff',
  speaking:  '#0099ff',
  error:     '#ff3b3b'
}

const STATE_LABEL: Record<OrbState, string> = {
  idle:      'STANDBY',
  listening: 'LISTENING',
  thinking:  'PROCESSING',
  speaking:  'RESPONDING',
  error:     'ERROR'
}

// Ring rotation speeds (seconds per revolution) — faster = more intense
const RING_SPEEDS: Record<OrbState, [number, number, number]> = {
  idle:      [14, 9, 6],
  listening: [6,  4, 3],
  thinking:  [2.5, 1.6, 1.2],
  speaking:  [5,  3, 2],
  error:     [1.5, 1, 0.7]
}

export function Orb({ state, volume, onClick }: OrbProps): React.JSX.Element {
  const [ripples, setRipples] = useState<number[]>([])
  const color = STATE_COLOR[state]
  const speeds = RING_SPEEDS[state]
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const isError = state === 'error'
  const isSpeaking = state === 'speaking'

  // Spring-smooth the raw volume so animations don't jitter
  const smoothVolume = useSpring(volume, { stiffness: 80, damping: 20 })

  // Map smoothed volume → ring scale multiplier (1.0 → 1.18 at max)
  const ringScale = useTransform(smoothVolume, [0, 1], isListening ? [1.0, 1.18] : [1.0, 1.0])

  // Map smoothed volume → extra glow opacity (0 → 0.5 at max)
  const glowExtra = useTransform(smoothVolume, [0, 1], isListening ? [0, 0.55] : [0, 0])

  const handleClick = () => {
    const id = Date.now()
    setRipples((p) => [...p, id])
    setTimeout(() => setRipples((p) => p.filter((r) => r !== id)), 900)
    onClick()
  }

  // Core pulse animation varies by state
  const coreAnim = isError
    ? {
        boxShadow: [
          `0 0 28px ${color}66, 0 0 56px ${color}33, inset 0 0 28px ${color}22`,
          `0 0 55px ${color}cc, 0 0 110px ${color}66, inset 0 0 55px ${color}44`,
          `0 0 28px ${color}66, 0 0 56px ${color}33, inset 0 0 28px ${color}22`
        ]
      }
    : isThinking
      ? {
          scale: [1, 1.04, 1],
          boxShadow: [
            `0 0 28px ${color}55, 0 0 55px ${color}22, inset 0 0 28px ${color}18`,
            `0 0 55px ${color}99, 0 0 110px ${color}44, inset 0 0 55px ${color}33`,
            `0 0 28px ${color}55, 0 0 55px ${color}22, inset 0 0 28px ${color}18`
          ]
        }
      : isSpeaking
        ? {
            scale: [1, 1.055, 0.99, 1.03, 1],
            boxShadow: [
              `0 0 28px ${color}55, 0 0 55px ${color}22, inset 0 0 28px ${color}18`,
              `0 0 65px ${color}bb, 0 0 130px ${color}55, inset 0 0 65px ${color}33`,
              `0 0 28px ${color}55, 0 0 55px ${color}22, inset 0 0 28px ${color}18`
            ]
          }
        : {
            scale: [1, 1.016, 1],
            boxShadow: [
              `0 0 28px ${color}44, 0 0 55px ${color}18, inset 0 0 28px ${color}12`,
              `0 0 40px ${color}66, 0 0 78px ${color}28, inset 0 0 40px ${color}1a`,
              `0 0 28px ${color}44, 0 0 55px ${color}18, inset 0 0 28px ${color}12`
            ]
          }

  const coreDuration = isError ? 0.45 : isThinking ? 0.75 : isSpeaking ? 0.55 : 3.2

  return (
    <div className="orb-wrapper">
      {/* State label */}
      <motion.div
        className="orb-state-label"
        key={state}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 0.65, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className="orb-state-dot"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={isListening ? { scale: [1, 1.6, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        {STATE_LABEL[state]}
      </motion.div>

      <div
        className="orb-container"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`JARVIS orb — ${STATE_LABEL[state]}`}
      >
        {/* Click ripples */}
        <AnimatePresence>
          {ripples.map((id) => (
            <motion.div
              key={id}
              className="orb-ripple"
              style={{ borderColor: color }}
              initial={{ width: 168, height: 168, opacity: 0.9 }}
              animate={{ width: 360, height: 360, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Volume-reactive listening rings — appear only while listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                className="orb-vol-ring orb-vol-ring-1"
                style={{ borderColor: `${color}44` }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: ringScale, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ scale: { duration: 0.06 } }}
              />
              <motion.div
                className="orb-vol-ring orb-vol-ring-2"
                style={{ borderColor: `${color}22` }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: ringScale, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ scale: { duration: 0.08 } }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Ring 1 — outermost */}
        <motion.div
          className="orb-ring orb-ring-1"
          style={{ borderColor: `${color}30` }}
          animate={{ rotate: 360 }}
          transition={{ duration: speeds[0], repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="orb-ring-dot"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
        </motion.div>

        {/* Ring 2 */}
        <motion.div
          className="orb-ring orb-ring-2"
          style={{ borderColor: `${color}50` }}
          animate={{ rotate: -360 }}
          transition={{ duration: speeds[1], repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="orb-ring-dot orb-ring-dot-sm"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
        </motion.div>

        {/* Ring 3 — inner */}
        <motion.div
          className="orb-ring orb-ring-3"
          style={{ borderColor: `${color}70` }}
          animate={{ rotate: 360 }}
          transition={{ duration: speeds[2], repeat: Infinity, ease: 'linear' }}
        />

        {/* Core sphere */}
        <motion.div
          className="orb-core"
          style={{
            borderColor: `${color}99`
          }}
          animate={coreAnim}
          transition={{ duration: coreDuration, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="orb-core-highlight" />

          {/* Volume-reactive inner glow */}
          <motion.div
            className="orb-core-inner-glow"
            style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Extra glow driven by voice volume */}
          {isListening && (
            <motion.div
              className="orb-core-vol-glow"
              style={{
                background: `radial-gradient(circle, ${color}cc, transparent 65%)`,
                opacity: glowExtra
              }}
            />
          )}

          {/* J label */}
          <span
            className="orb-label"
            style={{ color, textShadow: `0 0 20px ${color}, 0 0 40px ${color}88` }}
          >
            J
          </span>
        </motion.div>

        {/* Ambient outer disc */}
        <motion.div
          className="orb-ambient"
          style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="orb-hint">
        {isListening ? 'RELEASE SPACE OR CLICK MIC TO SEND' : 'HOLD SPACE OR CLICK MIC TO SPEAK • CLICK ORB FOR CHAT'}
      </div>
    </div>
  )
}
