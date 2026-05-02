import { contextBridge, ipcRenderer } from 'electron'

const jarvisAPI = {
  // Window controls
  minimize: ()  => ipcRenderer.send('window-minimize'),
  maximize: ()  => ipcRenderer.send('window-maximize'),
  close:    ()  => ipcRenderer.send('window-close'),

  // URL / app protocol opener
  openUrl: (url: string): Promise<{ success: boolean; reason?: string }> =>
    ipcRenderer.invoke('open-url', url),

  // Stage 4 — system actions
  setVolume: (level: number): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('action:set-volume', level),

  getClipboard: (): Promise<string> =>
    ipcRenderer.invoke('action:get-clipboard'),

  getSysInfo: (): Promise<{ time: string; date: string; platform: string; uptime: number }> =>
    ipcRenderer.invoke('action:get-sysinfo'),

  // Stage 5 — screenshot / vision
  takeScreenshot: (): Promise<{ base64: string; mimeType: string; width: number; height: number }> =>
    ipcRenderer.invoke('action:take-screenshot'),

  // Platform info
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('get-platform')
}

contextBridge.exposeInMainWorld('jarvis', jarvisAPI)
