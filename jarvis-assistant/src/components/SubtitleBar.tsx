import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubtitleBarProps {
  text: string
  isVisible: boolean
}

export function SubtitleBar({ text, isVisible }: SubtitleBarProps): React.JSX.Element {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!text) {
      setDisplayed('')
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    setDisplayed('')
    indexRef.current = 0

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const typeNext = () => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
        timeoutRef.current = setTimeout(typeNext, 18)
      } else {
        setIsTyping(false)
      }
    }

    timeoutRef.current = setTimeout(typeNext, 100)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [text])

  return (
    <div className="subtitle-bar">
      <AnimatePresence>
        {isVisible && text && (
          <motion.div
            className="subtitle-content"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
          >
            <span className="subtitle-prefix">JARVIS</span>
            <span className="subtitle-text">
              {displayed}
              {isTyping && <span className="subtitle-cursor">|</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
