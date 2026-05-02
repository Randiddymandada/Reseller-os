import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TopBarProps {
  systemStatus: 'online' | 'offline' | 'error'
}

export function TopBar({ systemStatus }: TopBarProps): React.JSX.Element {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase()

  const handleMinimize = () => window.jarvis?.minimize()
  const handleMaximize = () => window.jarvis?.maximize()
  const handleClose = () => window.jarvis?.close()

  const statusColor =
    systemStatus === 'online' ? '#00ff88' : systemStatus === 'error' ? '#ff3b3b' : '#ffaa00'

  return (
    <div className="top-bar">
      {/* Draggable region — covers most of the bar */}
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
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
            {systemStatus.toUpperCase()}
          </span>
        </div>
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
          <button className="win-btn win-btn-min" onClick={handleMinimize} title="Minimize" />
          <button className="win-btn win-btn-max" onClick={handleMaximize} title="Maximize" />
          <button className="win-btn win-btn-close" onClick={handleClose} title="Close" />
        </div>
      </div>
    </div>
  )
}
