import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Mic, Eye, Grid, Music, Settings } from 'lucide-react'
import type { OrbState } from '../App'

interface ToolbarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

interface ToolbarProps {
  activeTab: string | null
  onAction: (id: string) => void
  orbState: OrbState
}

export function Toolbar({ activeTab, onAction, orbState }: ToolbarProps): React.JSX.Element {
  const items: ToolbarItem[] = [
    { id: 'chat', label: 'CHAT', icon: <MessageSquare size={18} /> },
    { id: 'mic', label: 'MIC', icon: <Mic size={18} />, badge: orbState === 'listening' ? '●' : undefined },
    { id: 'vision', label: 'VISION', icon: <Eye size={18} /> },
    { id: 'apps', label: 'APPS', icon: <Grid size={18} /> },
    { id: 'music', label: 'MUSIC', icon: <Music size={18} /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} /> }
  ]

  return (
    <nav className="toolbar" aria-label="JARVIS toolbar">
      <div className="toolbar-inner">
        {items.map((item, idx) => {
          const isActive = activeTab === item.id
          const isMicActive = item.id === 'mic' && orbState === 'listening'

          return (
            <React.Fragment key={item.id}>
              {idx === items.length - 1 && <div className="toolbar-divider" />}
              <motion.button
                className={`toolbar-btn${isActive || isMicActive ? ' active' : ''}`}
                onClick={() => onAction(item.id)}
                whileTap={{ scale: 0.92 }}
                aria-label={item.label}
                aria-pressed={isActive}
                title={`Stage 2+: ${item.label}`}
              >
                <div className="toolbar-icon">{item.icon}</div>
                <span className="toolbar-label">{item.label}</span>
                {item.badge && (
                  <motion.span
                    className="toolbar-badge"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {item.badge}
                  </motion.span>
                )}
                {(isActive || isMicActive) && (
                  <motion.div
                    className="toolbar-active-line"
                    layoutId="toolbar-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Stage info */}
      <div className="toolbar-stage-info">
        <span className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
          STAGE 1 — MIC &amp; VISION AVAILABLE IN STAGE 2+
        </span>
      </div>
    </nav>
  )
}
