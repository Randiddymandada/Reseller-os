import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { startServer } from './server'

let mainWindow: BrowserWindow | null = null

const ALLOWED_URL_PREFIXES = [
  'https://www.google.com/',
  'https://google.com/',
  'https://www.youtube.com',
  'https://youtube.com',
  'https://discord.com',
  'https://www.discord.com',
  'https://maps.google.com',
  'https://open.spotify.com',
  'https://music.youtube.com',
  'https://www.twitch.tv',
  'https://github.com',
  'https://www.reddit.com',
  'https://www.wikipedia.org',
  'https://en.wikipedia.org'
]

function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_URL_PREFIXES.some(
      (prefix) => url.startsWith(prefix) || url === prefix.replace(/\/$/, '')
    )
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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

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
  startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

ipcMain.handle('open-url', async (_event, url: string) => {
  if (!isUrlAllowed(url)) {
    console.warn('[JARVIS] Blocked URL (not in allowlist):', url)
    return { success: false, reason: 'URL not in allowlist' }
  }
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    return { success: false, reason: String(err) }
  }
})

ipcMain.handle('get-platform', () => process.platform)
