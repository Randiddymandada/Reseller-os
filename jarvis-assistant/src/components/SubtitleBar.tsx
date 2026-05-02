import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubtitleBarProps {
  text: string
  isVisible: boolean
  isListening: boolean
  interim: string
}

export function SubtitleBar({ text, isVisible, isListening, interim }: SubtitleBarProps): React.JSX.Element {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  // Typewriter for JARVIS responses
  useEffect(() => {
    if (isListening) return // don't type while listening

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
        // Slight variation in typing speed for naturalness
        const delay = text[indexRef.current - 1] === ' ' ? 12 : 16
        timeoutRef.current = setTimeout(typeNext, delay)
      } else {
        setIsTyping(false)
      }
    }

    timeoutRef.current = setTimeout(typeNext, 80)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [text, isListening])

  const showInterim = isListening && interim
  const showJarvisText = !isListening && isVisible && text

  return (
    <div className="subtitle-bar">
      <AnimatePresence mode="wait">
        {showInterim ? (
          // Live speech-to-text preview
          <motion.div
            key="interim"
            className="subtitle-content subtitle-interim"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <span className="subtitle-prefix subtitle-prefix-you">YOU</span>
            <span className="subtitle-text-interim">{interim}</span>
            <span className="subtitle-cursor-interim">|</span>
          </motion.div>
        ) : isListening ? (
          // Listening but no interim text yet
          <motion.div
            key="listening"
            className="subtitle-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="subtitle-prefix subtitle-prefix-you">MIC</span>
            <motion.span
              className="subtitle-listening-text"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              Listening…
            </motion.span>
          </motion.div>
        ) : showJarvisText ? (
          // JARVIS response
          <motion.div
            key={`jarvis-${text.slice(0, 20)}`}
            className="subtitle-content"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22 }}
          >
            <span className="subtitle-prefix">JARVIS</span>
            <span className="subtitle-text">
              {displayed}
              {isTyping && <span className="subtitle-cursor">|</span>}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
