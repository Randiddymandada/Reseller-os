import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Send, ChevronRight, Trash2 } from 'lucide-react'
import type { Message } from '../hooks/useChat'

interface ChatPanelProps {
  messages: Message[]
  onSend: (text: string) => void
  isLoading: boolean
  onClose: () => void
  onClear?: () => void
}

export function ChatPanel({ messages, onSend, isLoading, onClose, onClear }: ChatPanelProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200)
  }, [])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue('')
    onSend(text)
  }, [inputValue, isLoading, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const adjustHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <motion.div
      className="chat-panel"
      initial={{ x: 440, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 440, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <ChevronRight size={14} color="var(--primary)" />
          <span className="chat-title">JARVIS INTERFACE</span>
        </div>
        <div className="chat-header-right">
          {onClear && messages.length > 0 && (
            <button
              className="chat-clear-btn"
              onClick={onClear}
              title="Clear conversation"
              aria-label="Clear chat"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button className="chat-close" onClick={onClose} aria-label="Close chat">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-orb">J</div>
            <p className="chat-empty-line">JARVIS ONLINE</p>
            <p className="chat-empty-sub">Type a message or ask me to do something.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`chat-message chat-message-${msg.role}${msg.isError ? ' chat-message-err' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="chat-message-sender">
                {msg.role === 'user' ? 'YOU' : 'JARVIS'}
              </div>
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview}
                  alt="Screen capture"
                  className="chat-img-preview"
                />
              )}
              <div className="chat-message-text">{msg.content}</div>
              <div className="chat-message-time">
                {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </div>
            </motion.div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            className="chat-typing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chat-message-sender">JARVIS</div>
            <div className="typing-dots">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="typing-dot"
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            adjustHeight(e.target)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask JARVIS anything..."
          rows={1}
          disabled={isLoading}
          aria-label="Message input"
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  )
}
