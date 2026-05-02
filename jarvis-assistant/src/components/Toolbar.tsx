import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Mic, MicOff, Eye, Grid, Music, Settings } from 'lucide-react'
import type { OrbState } from '../App'

interface ToolbarProps {
  activeTab: string | null
  onAction: (id: string) => void
  orbState: OrbState
  isListening: boolean
  isSupported: boolean
  isAnalyzing?: boolean
}

export function Toolbar({
  activeTab,
  onAction,
  orbState,
  isListening,
  isSupported,
  isAnalyzing = false
}: ToolbarProps): React.JSX.Element {
  const items = [
    {
      id: 'chat',
      label: 'CHAT',
      icon: <MessageSquare size={18} />,
      always: true
    },
    {
      id: 'mic',
      label: isListening ? 'STOP' : 'MIC',
      icon: isListening ? <MicOff size={18} /> : <Mic size={18} />,
      always: true,
      disabled: !isSupported
    },
    {
      id: 'vision',
      label: isAnalyzing ? 'SCANNING' : 'VISION',
      icon: <Eye size={18} />,
      always: true,
      analyzing: isAnalyzing
    },
    { id: 'apps',     label: 'APPS',     icon: <Grid size={18} />,      always: false },
    { id: 'music',    label: 'MUSIC',    icon: <Music size={18} />,     always: false },
    { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} />, always: false }
  ]

  return (
    <nav className="toolbar" aria-label="JARVIS toolbar">
      <div className="toolbar-inner">
        {items.map((item, idx) => {
          const isActive = activeTab === item.id || (item.id === 'mic' && isListening)
          const showDivider = idx === items.length - 1
          const disabled = item.disabled || (item.id === 'vision' && isAnalyzing)

          return (
            <React.Fragment key={item.id}>
              {showDivider && <div className="toolbar-divider" />}

              <motion.button
                className={`toolbar-btn${isActive ? ' active' : ''}${item.id === 'mic' && isListening ? ' mic-live' : ''}${'analyzing' in item && item.analyzing ? ' vision-scanning' : ''}`}
                onClick={() => !disabled && onAction(item.id)}
                whileTap={disabled ? {} : { scale: 0.9 }}
                disabled={disabled}
                aria-label={item.label}
                aria-pressed={isActive}
                title={
                  item.disabled
                    ? 'Speech recognition not supported in this environment'
                    : item.always
                      ? item.label
                      : `${item.label} — coming soon`
                }
              >
                {/* Mic live pulse ring */}
                {item.id === 'mic' && isListening && (
                  <motion.div
                    className="mic-live-ring"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}

                {/* Vision scanning pulse ring */}
                {'analyzing' in item && item.analyzing && (
                  <motion.div
                    className="vision-scan-ring"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}

                <div className="toolbar-icon">{item.icon}</div>
                <span className="toolbar-label">{item.label}</span>

                {isActive && (
                  <motion.div
                    className="toolbar-active-line"
                    layoutId={`tbar-active-${item.id}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            </React.Fragment>
          )
        })}
      </div>

      <div className="toolbar-stage-info">
        <span className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
          {isListening
            ? 'HOLD SPACE TO TALK  •  RELEASE TO SEND  •  ESC TO CANCEL'
            : isAnalyzing
              ? 'CAPTURING SCREEN  •  ANALYZING WITH VISION AI…'
              : 'HOLD SPACE OR CLICK MIC TO TALK  •  CLICK VISION TO ANALYZE SCREEN'}
        </span>
      </div>
    </nav>
  )
}
