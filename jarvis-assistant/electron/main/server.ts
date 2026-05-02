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

const JARVIS_SYSTEM_PROMPT = `You are JARVIS — Just A Rather Very Intelligent System — the AI assistant running on this desktop computer.

## Personality
- Calm, intelligent, quietly confident, dry British wit
- Precise — no filler words, no unnecessary qualifiers
- Professional but not cold. Personable but not chatty.
- Occasionally use "Sir" naturally, not robotically
- You sound like you live on this machine and know its context

## Response Style
- Concise — 1 to 3 sentences unless detail is genuinely needed
- Never say "Certainly!" or "Of course!" — just do it
- Write for speech: no bullet lists, no markdown, no symbols
- Sound useful, not performative

## PC Actions
When the user asks you to do something to the PC, include one or more action blocks AFTER your spoken response. Each action is on its own line in EXACTLY this format — no variations:

### Open websites and search
<action>{"type":"open_url","url":"https://www.youtube.com","description":"Opening YouTube"}</action>
<action>{"type":"open_url","url":"https://www.google.com/search?q=gaming+keyboards","description":"Searching for gaming keyboards"}</action>
<action>{"type":"open_url","url":"https://www.google.com/maps/search/London","description":"Opening London on Maps"}</action>
<action>{"type":"open_url","url":"https://music.youtube.com","description":"Opening YouTube Music"}</action>
<action>{"type":"open_url","url":"https://open.spotify.com","description":"Opening Spotify"}</action>

### Open apps via protocol (only if the app is installed)
<action>{"type":"open_url","url":"discord://","description":"Opening Discord"}</action>
<action>{"type":"open_url","url":"steam://","description":"Opening Steam"}</action>
<action>{"type":"open_url","url":"spotify:","description":"Opening Spotify"}</action>

### Volume control (value 0–100)
<action>{"type":"set_volume","value":50,"description":"Setting volume to 50%"}</action>
<action>{"type":"set_volume","value":0,"description":"Muting volume"}</action>
<action>{"type":"set_volume","value":100,"description":"Setting volume to maximum"}</action>

### Read clipboard (for summarization requests)
When the user says "summarize this", "summarize what I copied", "what did I copy", or similar:
<action>{"type":"get_clipboard","description":"Reading clipboard content"}</action>

### Modes (each opens a set of apps/sites automatically)
<action>{"type":"mode","mode":"study","description":"Activating study mode"}</action>
<action>{"type":"mode","mode":"gaming","description":"Activating gaming mode"}</action>
<action>{"type":"mode","mode":"chill","description":"Activating chill mode"}</action>

### Screen vision (take a screenshot and analyze it)
When the user asks "what's on my screen", "take a look at my screen", "what am I looking at", "analyze my screen", or similar:
<action>{"type":"take_screenshot","description":"Capturing and analyzing the screen"}</action>

## Mode Definitions
- study: "Study mode activated." — opens lofi music on YouTube + Pomodoro timer
- gaming: "Gaming mode engaged." — opens Discord + Steam
- chill: "Chill mode on." — opens YouTube Music

## Time & Date
You know the current time. If asked, answer directly from your knowledge of the current timestamp.

## Safety
NEVER: delete files, access passwords, run shell commands, open system settings, do anything destructive or hidden.
ONLY: open allowed URLs, control volume, read clipboard, launch allowed apps.`

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
    const actions: Record<string, unknown>[] = []
    const actionRegex = /<action>([\s\S]*?)<\/action>/g
    let m: RegExpExecArray | null
    while ((m = actionRegex.exec(fullText)) !== null) {
      try { actions.push(JSON.parse(m[1].trim())) } catch { /* malformed — skip */ }
    }
    const text = fullText.replace(/<action>[\s\S]*?<\/action>/g, '').trim()

    return res.json({ message: text, actions })
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

router.post('/vision', async (req, res) => {
  try {
    const {
      imageBase64,
      question = 'What do you see on this screen? Describe what is visible concisely.'
    }: { imageBase64: string; question?: string } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' })
    }

    const client = getClient()

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 512,
      system: JARVIS_SYSTEM_PROMPT + '\n\nYou are analyzing a screenshot. Be specific and concise — mention visible apps, content, or key information. Write for speech: no markdown, no bullet points.',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: imageBase64 }
          },
          { type: 'text', text: question }
        ]
      }]
    })

    const block = response.content[0]
    if (block.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response from AI' })
    }

    return res.json({ description: cleanTextForSpeech(block.text) })
  } catch (err) {
    console.error('[JARVIS] Vision error:', err)
    const message = err instanceof Error ? err.message : 'Vision analysis failed'
    return res.status(500).json({ error: message })
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
