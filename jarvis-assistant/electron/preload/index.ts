import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    jarvis: typeof jarvisAPI
  }
}

const jarvisAPI = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  openUrl: (url: string): Promise<{ success: boolean; reason?: string }> =>
    ipcRenderer.invoke('open-url', url),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('get-platform')
}

contextBridge.exposeInMainWorld('jarvis', jarvisAPI)
