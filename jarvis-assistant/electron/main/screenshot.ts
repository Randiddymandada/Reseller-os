import { desktopCapturer } from 'electron'

export interface ScreenshotResult {
  base64: string
  mimeType: 'image/png'
  width: number
  height: number
}

export async function captureScreenshot(): Promise<ScreenshotResult> {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1440, height: 900 }
  })

  if (sources.length === 0) {
    throw new Error('No screen sources found')
  }

  const thumbnail = sources[0].thumbnail
  const dataUrl = thumbnail.toDataURL()
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const { width, height } = thumbnail.getSize()

  return { base64, mimeType: 'image/png', width, height }
}
