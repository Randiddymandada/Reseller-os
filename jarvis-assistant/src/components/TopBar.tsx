import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ActiveMode } from '../hooks/useChat'

const MODE_COLORS: Record<NonNullable<ActiveMode>, string> = {
  study:  '#00ffcc',
  gaming: '#ff6b35',
  chill:  '#00d4ff'
}

const MODE_LABELS: Record<NonNullable<ActiveMode>, string> = {
  study:  'STUDY MODE',
  gaming: 'GAMING MODE',
  chill:  'CHILL MODE'
}

interface TopBarProps {
  systemStatus: 'online' | 'offline' | 'error'
  activeMode: ActiveMode
}

export function TopBar({ systemStatus, activeMode }: TopBarProps): React.JSX.Element {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }).toUpperCase()

  const statusColor =
    systemStatus === 'online' ? '#00ff88'
    : systemStatus === 'error' ? '#ffaa00'
    : '#ff3b3b'

  return (
    <div className="top-bar">
      <div className="top-bar-drag" />

      <div className="top-bar-left">
        <span className="top-bar-logo">JARVIS</span>
        <div className="top-bar-status">
          <motion.div
            className="status-dot"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
            {systemStatus.toUpperCase()}
          </span>
        </div>

        {/* Active mode badge */}
        <AnimatePresence>
          {activeMode && (
            <motion.div
              className="mode-badge"
              style={{
                borderColor: `${MODE_COLORS[activeMode]}55`,
                color: MODE_COLORS[activeMode],
                boxShadow: `0 0 10px ${MODE_COLORS[activeMode]}33`
              }}
              initial={{ opacity: 0, scale: 0.85, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <motion.span
                className="mode-badge-dot"
                style={{ background: MODE_COLORS[activeMode] }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {MODE_LABELS[activeMode]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="top-bar-center">
        <span className="mono top-bar-date">{dateStr}</span>
        <span className="top-bar-sep">|</span>
        <span className="mono top-bar-stat">CPU NOMINAL</span>
        <span className="top-bar-sep">|</span>
        <span className="mono top-bar-stat">SYSTEMS READY</span>
      </div>

      <div className="top-bar-right">
        <span className="top-bar-time">{timeStr}</span>
        <div className="win-controls">
          <button className="win-btn win-btn-min"   onClick={() => window.jarvis?.minimize()} title="Minimize" />
          <button className="win-btn win-btn-max"   onClick={() => window.jarvis?.maximize()} title="Maximize" />
          <button className="win-btn win-btn-close" onClick={() => window.jarvis?.close()}    title="Close"    />
        </div>
      </div>
    </div>
  )
}
