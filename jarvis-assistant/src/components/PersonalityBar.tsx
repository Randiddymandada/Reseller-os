import React from 'react'
import { motion } from 'framer-motion'
import type { Personality } from '../hooks/useChat'

interface Preset {
  id: Personality
  label: string
  hint: string
}

const PRESETS: Preset[] = [
  { id: 'calm',         label: 'CALM',    hint: 'Default JARVIS — measured and precise'  },
  { id: 'funny',        label: 'WITTY',   hint: 'Dry British humour turned up a notch'   },
  { id: 'serious',      label: 'SERIOUS', hint: 'Strictly professional, zero humour'     },
  { id: 'hype',         label: 'HYPE',    hint: 'Energetic, pumped-up personality'        },
  { id: 'professional', label: 'PRO',     hint: 'Corporate-executive polish'              }
]

interface PersonalityBarProps {
  current: Personality
  onChange: (p: Personality) => void
}

export function PersonalityBar({ current, onChange }: PersonalityBarProps): React.JSX.Element {
  return (
    <div className="personality-bar" role="group" aria-label="JARVIS personality preset">
      <span className="personality-label">MODE</span>
      <div className="personality-pills">
        {PRESETS.map((p) => (
          <motion.button
            key={p.id}
            className={`personality-pill${current === p.id ? ' active' : ''}`}
            onClick={() => onChange(p.id)}
            whileTap={{ scale: 0.9 }}
            title={p.hint}
            aria-pressed={current === p.id}
          >
            {p.label}
            {current === p.id && (
              <motion.div
                className="personality-pill-bg"
                layoutId="personality-active"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
