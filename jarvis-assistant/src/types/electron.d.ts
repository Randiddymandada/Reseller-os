/**
 * Type declarations for the window.jarvis API exposed by the Electron preload.
 */
declare global {
  interface Window {
    jarvis: {
      // Window
      minimize:     () => void
      maximize:     () => void
      close:        () => void
      // Navigation
      openUrl:      (url: string) => Promise<{ success: boolean; reason?: string }>
      // Stage 4 — system actions
      setVolume:    (level: number) => Promise<{ success: boolean; error?: string }>
      getClipboard: () => Promise<string>
      getSysInfo:   () => Promise<{ time: string; date: string; platform: string; uptime: number }>
      // Stage 5 — screenshot / vision
      takeScreenshot: () => Promise<{ base64: string; mimeType: string; width: number; height: number }>
      // Platform
      getPlatform:  () => Promise<NodeJS.Platform>
    }
  }
}

export {}
