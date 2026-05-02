# JARVIS Desktop Assistant — Stage 2

Iron Man HUD-style AI desktop assistant built with Electron + React + TypeScript.

## Stage 2 — What's new

- **Working speech-to-text** via Web Speech API (Chromium built-in, no extra API key)
- **Push-to-talk**: hold `Space` anywhere in the app to record, release to send
- **Mic button** in toolbar toggles listening — click once to start, click again to send
- **Real-time volume analyzer** using Web AudioContext — orb rings react to your voice
- **Orb listening state**: rings speed up, turn teal, scale dynamically with volume
- **Live subtitle preview**: your speech appears as you talk (interim transcription)
- **ESC to cancel** — escape key aborts a recording session without sending
- **Electron mic permissions** auto-granted (no system prompt needed)

## Stage 1 — What's included

- Full-screen dark HUD interface with animated grid background
- Glowing JARVIS orb with 5 animated states (idle, listening, thinking, speaking, error)
- Working AI chat panel (Claude API via Anthropic)
- Typing effect subtitle bar
- Sci-fi toolbar (mic, vision, apps, music, and settings wired in Stage 2+)
- Frameless Electron window with custom window controls
- Action router: JARVIS can open URLs and search the web when asked

## Requirements

- Node.js 18+
- An Anthropic API key → https://console.anthropic.com

## Setup

```bash
cd jarvis-assistant
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
```

## Environment Variables

| Variable           | Required | Description                          |
|--------------------|----------|--------------------------------------|
| ANTHROPIC_API_KEY  | Yes      | Your Anthropic API key               |
| BACKEND_PORT       | No       | Backend port (default: 3001)         |

## Project Structure

```
jarvis-assistant/
├── electron/
│   ├── main/
│   │   ├── index.ts      ← Electron main process + window
│   │   └── server.ts     ← Express backend (AI + action router)
│   └── preload/
│       └── index.ts      ← Safe IPC bridge
├── src/                  ← React renderer
│   ├── components/
│   │   ├── HUDBackground.tsx
│   │   ├── TopBar.tsx
│   │   ├── Orb.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── Toolbar.tsx
│   │   └── SubtitleBar.tsx
│   ├── hooks/
│   │   └── useChat.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── electron.vite.config.ts
├── package.json
├── .env.example
└── README.md
```

## Orb States

| State     | Appearance                       | Trigger                         |
|-----------|----------------------------------|---------------------------------|
| idle      | Slow cyan pulse                  | Default / waiting               |
| listening | Faster green tint pulse          | Stage 2: mic active             |
| thinking  | Fast rotating rings              | Waiting for AI response         |
| speaking  | Strong pulsing glow              | AI response received            |
| error     | Red pulse                        | API error / connection failure  |

## PC Actions (Stage 1)

JARVIS understands natural language and executes safe browser actions:

- "Open YouTube"
- "Search for mechanical keyboards"
- "Open Google Maps of Tokyo"
- "Pull up Discord"
- "Search Reddit for best gaming monitors"
- "Open GitHub"

All actions open in your default browser. No file system access, no shell commands.

## Voice Usage (Stage 2)

| Action                          | How                              |
|---------------------------------|----------------------------------|
| Start listening (push-to-talk)  | Hold `Space` bar                 |
| Send speech                     | Release `Space`                  |
| Toggle mic on/off               | Click MIC button in toolbar      |
| Cancel recording                | Press `Escape`                   |
| Watch your speech live          | Subtitle bar shows interim text  |

**Requirements for STT:**
- Internet connection (Web Speech API sends audio to Google's speech servers)
- Microphone permission (auto-granted in Electron)

## Chat Usage

1. Click the JARVIS orb or the CHAT toolbar button to open the chat panel
2. Type your message and press Enter (or click Send)
3. JARVIS responds via Claude, with a typing effect subtitle
4. Hold Space (or click MIC) to speak — JARVIS hears you and responds

## Troubleshooting

**Blank screen / no app:**
- Run `npm install` first
- Make sure Node 18+ is installed: `node -v`

**"API key not configured":**
- Copy `.env.example` to `.env`
- Add your `ANTHROPIC_API_KEY`
- Restart with `npm run dev`

**Connection refused (backend not reachable):**
- The Express server starts automatically inside Electron
- Check the Electron console (Ctrl+Shift+I → Console tab)
- Look for `[JARVIS] Backend listening on http://127.0.0.1:3001`

**Window doesn't appear:**
- Wait a few seconds — it shows after the backend starts
- Check for errors in the terminal

**Font looks wrong:**
- The app loads Orbitron from Google Fonts — requires an internet connection on first launch
- After first load, the browser caches the font

## What's Coming

| Stage | Feature                                      | Status  |
|-------|----------------------------------------------|---------|
| 1     | HUD UI, orb animations, text chat            | ✅ Done |
| 2     | Speech-to-text, push-to-talk, volume orb     | ✅ Done |
| 3     | ElevenLabs realistic voice output            | Pending |
| 4     | Full PC action router (volume, modes, apps)  | Pending |
| 5     | Screenshot vision + screen explanation       | Pending |
| 6     | UI polish, personality presets, wake word    | Pending |
