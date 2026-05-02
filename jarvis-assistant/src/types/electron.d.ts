/**
 * Type declarations for the window.jarvis API exposed by the Electron preload.
 * This makes the renderer TypeScript-aware of all IPC bridges.
 */
declare global {
  interface Window {
    jarvis: {
      minimize: () => void
      maximize: () => void
      close: () => void
      openUrl: (url: string) => Promise<{ success: boolean; reason?: string }>
      getPlatform: () => Promise<NodeJS.Platform>
    }
  }
}

export {}
