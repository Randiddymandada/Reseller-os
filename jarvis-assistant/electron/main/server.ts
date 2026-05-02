import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config({ path: join(process.cwd(), '.env') })

const router = express.Router()
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10)

// ─── Personality Presets ──────────────────────────────────────────────────────

export type Personality = 'calm' | 'funny' | 'serious' | 'hype' | 'professional'

const PERSONALITY_ADDENDUMS: Record<Personality, string> = {
  calm: '',
  funny: '\n\nToday let your dry British humour show a little more. Still sharp, still useful — just a touch more witty.',
  serious: '\n\nToday be strictly formal. No humour. Pure precision. Think military briefing officer.',
  hype: '\n\nToday be noticeably more energetic and enthusiastic — pumped up, motivating, big personality. Still smart.',
  professional: '\n\nToday be polished corporate-executive level: formal, measured, impeccably precise.'
}

const ELEVENLABS_VOICE_SETTINGS: Record<Personality, {
  stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean
}> = {
  calm:         { stability: 0.55, similarity_boost: 0.75, style: 0.00, use_speaker_boost: true },
  funny:        { stability: 0.40, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true },
  serious:      { stability: 0.80, similarity_boost: 0.70, style: 0.00, use_speaker_boost: true },
  hype:         { stability: 0.28, similarity_boost: 0.85, style: 0.60, use_speaker_boost: true },
  professional: { stability: 0.70, similarity_boost: 0.75, style: 0.10, use_speaker_boost: true }
}

// ─── JARVIS System Prompt ─────────────────────────────────────────────────────

const JARVIS_SYSTEM_PROMPT = `You are JARVIS — Just A Rather Very Intelligent System — the AI assistant running on this desktop computer. You were designed by Tony Stark, refined for this user.

## Personality
- Calm, intelligent, and quietly confident
- Dry British wit — not a comedian, but occasionally sharp
- Professional but never cold; personable but never chatty
- You speak with precision. No filler words, no unnecessary qualifiers
- Occasionally use "Sir" naturally — not robotically, just when it fits
- You sound like you actually live on this machine and know its context

## Response Style
- Concise by default — 1 to 3 sentences unless detail is genuinely needed
- Never say "Certainly!" or "Of course!" — just do the thing
- Never explain what you're about to do at length — just do it
- Use technical language naturally when appropriate
- Sound useful, not performative
- Responses will be spoken aloud — write for speech, not for a screen (no bullet lists, no markdown)

## PC Actions
When the user asks you to open a website, search something, or control the PC, include a JSON action block AFTER your response text. Use EXACTLY this format:

<action>{"type":"open_url","url":"https://...","description":"Opening YouTube"}</action>
<action>{"type":"open_url","url":"https://www.google.com/search?q=gaming+keyboards","description":"Searching for gaming keyboards"}</action>
<action>{"type":"open_url","url":"https://www.google.com/maps/search/London","description":"Pulling up London on Maps"}</action>

Safe URLs you can generate:
- Google Search: https://www.google.com/search?q=[query]
- YouTube: https://www.youtube.com/results?search_query=[query] or https://www.youtube.com
- Discord: https://discord.com
- Google Maps: https://www.google.com/maps/search/[location]
- Any major website by full URL

Always respond conversationally first, then append the action block if needed.

## Modes
- Study mode: open school/study tabs, suggest focus playlist
- Gaming mode: open Discord, suggest game launcher
- Chill mode: open YouTube music or Spotify

## Safety
Never delete files, access passwords, run hidden system commands, or do anything destructive. Only open URLs.`

// ─── Utilities ────────────────────────────────────────────────────────────────

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/<action>[\s\S]*?<\/action>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/⚠\s?/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim()
}

// ─── Anthropic client ─────────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY not configured. Add it to your .env file.')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ─── Routes ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

router.post('/chat', async (req, res) => {
  try {
    const { messages, personality = 'calm' }: { messages: ChatMessage[]; personality?: Personality } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array required' })
    }

    const client = getClient()
    const addendum = PERSONALITY_ADDENDUMS[personality as Personality] ?? ''
    const systemPrompt = JARVIS_SYSTEM_PROMPT + addendum

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    })

    const block = response.content[0]
    if (block.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response type from AI' })
    }

    const fullText = block.text
    const actionMatch = fullText.match(/<action>([\s\S]*?)<\/action>/)
    let action: { type: string; url?: string; description?: string } | null = null
    let text = fullText

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim())
        text = fullText.replace(/<action>[\s\S]*?<\/action>/g, '').trim()
      } catch {
        // malformed action block — ignore
      }
    }

    return res.json({ message: text, action })
  } catch (err) {
    console.error('[JARVIS] Chat error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('API key') ? 503 : 500
    return res.status(status).json({ error: message })
  }
})

router.post('/tts', async (req, res) => {
  const {
    text,
    personality = 'calm'
  }: { text: string; personality?: Personality } = req.body

  if (!text?.trim()) {
    return res.status(400).json({ error: 'text is required' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey || apiKey === 'your_elevenlabs_key_here') {
    // Signal to the frontend to use Web Speech fallback
    return res.status(503).json({ error: 'ElevenLabs not configured', fallback: true })
  }

  // Default: Daniel — British male, perfect JARVIS voice
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9'
  const voiceSettings = ELEVENLABS_VOICE_SETTINGS[personality as Personality] ?? ELEVENLABS_VOICE_SETTINGS.calm
  const cleanText = cleanTextForSpeech(text)

  if (!cleanText) {
    return res.status(400).json({ error: 'Empty text after cleaning' })
  }

  try {
    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceSettings
        })
      }
    )

    if (!elResponse.ok) {
      const errBody = await elResponse.json().catch(() => ({})) as { detail?: { message?: string } }
      const msg = errBody.detail?.message ?? `ElevenLabs HTTP ${elResponse.status}`
      console.error('[JARVIS TTS] ElevenLabs error:', msg)
      return res.status(elResponse.status).json({ error: msg, fallback: true })
    }

    const audioBuffer = await elResponse.arrayBuffer()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', String(audioBuffer.byteLength))
    res.end(Buffer.from(audioBuffer))
  } catch (err) {
    console.error('[JARVIS TTS] Fetch error:', err)
    const message = err instanceof Error ? err.message : 'TTS request failed'
    res.status(500).json({ error: message, fallback: true })
  }
})

router.get('/health', (_req, res) => {
  const hasAI =
    !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here'
  const hasTTS =
    !!process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_key_here'

  res.json({ status: 'online', version: '1.0.0', apiConfigured: hasAI, ttsConfigured: hasTTS })
})

// ─── Server bootstrap ─────────────────────────────────────────────────────────

export function startServer(): void {
  const app = express()
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || origin.startsWith('http://localhost') || origin === 'file://') {
          cb(null, true)
        } else {
          cb(new Error('Not allowed by CORS'))
        }
      }
    })
  )
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', router)

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[JARVIS] Backend listening on http://127.0.0.1:${PORT}`)
  })
}
