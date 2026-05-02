import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config({ path: join(process.cwd(), '.env') })

const router = express.Router()
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10)

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

## PC Actions
When the user asks you to open a website, search something, or control the PC, include a JSON action block AFTER your response text. Use EXACTLY this format:

<action>{"type":"open_url","url":"https://...","description":"Opening YouTube"}</action>
<action>{"type":"open_url","url":"https://www.google.com/search?q=gaming+keyboards","description":"Searching for gaming keyboards"}</action>
<action>{"type":"open_url","url":"https://www.google.com/maps/search/London","description":"Pulling up London on Maps"}</action>

Action types:
- open_url: opens a URL in the default browser
- search: web search (generates a Google search URL)

Safe URLs you can generate:
- Google Search: https://www.google.com/search?q=[query]
- YouTube: https://www.youtube.com/results?search_query=[query] or https://www.youtube.com
- Discord: https://discord.com
- Google Maps: https://www.google.com/maps/search/[location]
- Any major website by full URL

Always respond conversationally first, then append the action block if one is needed.

## Modes
- Study mode: "Activating study mode. Opening your focus environment." — open school/study tabs
- Gaming mode: "Gaming mode engaged." — open Discord + game launcher suggestion
- Chill mode: "Switching to chill mode." — open YouTube music

## Safety
Never delete files, access passwords, run hidden system commands, or do anything destructive. Only open URLs.`

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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

router.post('/chat', async (req, res) => {
  try {
    const { messages }: { messages: ChatMessage[] } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array required' })
    }

    const client = getClient()

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: JARVIS_SYSTEM_PROMPT,
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
        // malformed action — just return the raw text
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

router.get('/health', (_req, res) => {
  const hasKey =
    !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here'
  res.json({ status: 'online', version: '1.0.0', apiConfigured: hasKey })
})

export function startServer(): void {
  const app = express()
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow Electron renderer (file://) and Vite dev server
        if (!origin || origin.startsWith('http://localhost') || origin === 'file://') {
          cb(null, true)
        } else {
          cb(new Error('Not allowed by CORS'))
        }
      }
    })
  )
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', router)

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[JARVIS] Backend listening on http://127.0.0.1:${PORT}`)
  })
}
