import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { startServer } from './server'
import { setSystemVolume, readClipboard, getSystemInfo } from './actions'
import { captureScreenshot } from './screenshot'

let mainWindow: BrowserWindow | null = null

// URLs and protocols that JARVIS is allowed to open
const ALLOWED_URL_PREFIXES = [
  'https://www.google.com/',
  'https://google.com/',
  'https://www.youtube.com',
  'https://youtube.com',
  'https://music.youtube.com',
  'https://discord.com',
  'https://www.discord.com',
  'https://maps.google.com',
  'https://open.spotify.com',
  'https://www.twitch.tv',
  'https://github.com',
  'https://www.reddit.com',
  'https://www.wikipedia.org',
  'https://en.wikipedia.org',
  'https://pomofocus.io',
  'https://www.notion.so',
  'https://mail.google.com',
  'https://calendar.google.com',
  'https://drive.google.com'
]

// App protocol schemes that JARVIS is allowed to open (requires app to be installed)
const ALLOWED_PROTOCOLS = [
  'discord://',
  'steam://',
  'spotify:',
  'slack://',
  'vscode://',
  'notion://'
]

function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Allow https URLs in the prefix list
    if (parsed.protocol === 'https:') {
      return ALLOWED_URL_PREFIXES.some(
        (p) => url.startsWith(p) || url === p.replace(/\/$/, '')
      )
    }
    // Allow approved app protocol schemes
    return ALLOWED_PROTOCOLS.some((p) => url.startsWith(p))
  } catch {
    return false
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#050a12',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Auto-grant microphone permission
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(permission === 'media' || permission === 'microphone')
  })
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return permission === 'media' || permission === 'microphone'
  })

  startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Window controls ────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

// ── URL / protocol opener ──────────────────────────────────────────────────────
ipcMain.handle('open-url', async (_e, url: string) => {
  if (!isUrlAllowed(url)) {
    console.warn('[JARVIS] Blocked URL:', url)
    return { success: false, reason: 'URL not in allowlist' }
  }
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    return { success: false, reason: String(err) }
  }
})

// ── System volume ──────────────────────────────────────────────────────────────
ipcMain.handle('action:set-volume', async (_e, level: number) => {
  return setSystemVolume(level)
})

// ── Clipboard ──────────────────────────────────────────────────────────────────
ipcMain.handle('action:get-clipboard', () => {
  return readClipboard()
})

// ── System info ────────────────────────────────────────────────────────────────
ipcMain.handle('action:get-sysinfo', () => {
  return getSystemInfo()
})

// ── Screenshot / vision ────────────────────────────────────────────────────────
ipcMain.handle('action:take-screenshot', async () => {
  return captureScreenshot()
})

// ── Platform ───────────────────────────────────────────────────────────────────
ipcMain.handle('get-platform', () => process.platform)
