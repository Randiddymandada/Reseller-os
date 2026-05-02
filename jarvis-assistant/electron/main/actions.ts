/**
 * Stage 4 — System action handlers
 *
 * All system-level actions run here in the main process so the renderer
 * never touches the OS directly.  Actions are deliberately limited to
 * safe, reversible, user-visible operations.
 */

import { clipboard } from 'electron'
import { exec }      from 'child_process'
import { tmpdir }    from 'os'
import { join }      from 'path'
import { writeFile, unlink } from 'fs/promises'

// ─── System Volume ────────────────────────────────────────────────────────────

export async function setSystemVolume(
  level: number
): Promise<{ success: boolean; error?: string }> {
  const vol = Math.max(0, Math.min(100, Math.round(level)))

  return new Promise(async (resolve) => {
    let cmd = ''
    let tmpFile: string | null = null

    switch (process.platform) {
      case 'darwin':
        cmd = `osascript -e "set volume output volume ${vol}"`
        break

      case 'linux':
        // Try pactl first (PulseAudio / PipeWire), fall back to amixer
        cmd = `pactl set-sink-volume @DEFAULT_SINK@ ${vol}% 2>/dev/null || amixer -D pulse sset Master ${vol}% 2>/dev/null`
        break

      case 'win32': {
        // Write a temp .ps1 to avoid all quote-escaping issues
        const script = `
$vol  = ${vol} / 100
$l    = [int]($vol * 0xFFFF)
$dw   = [uint32](($l -shl 16) -bor $l)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class JarvisVol {
    [DllImport("winmm.dll")]
    public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);
}
"@
[JarvisVol]::waveOutSetVolume([IntPtr]::Zero, $dw) | Out-Null
`.trim()
        tmpFile = join(tmpdir(), 'jarvis-setvol.ps1')
        try {
          await writeFile(tmpFile, script, 'utf8')
          cmd = `powershell -ExecutionPolicy Bypass -NonInteractive -File "${tmpFile}"`
        } catch (e) {
          return resolve({ success: false, error: `Could not write temp script: ${e}` })
        }
        break
      }

      default:
        return resolve({ success: false, error: `Volume control not supported on ${process.platform}` })
    }

    exec(cmd, async (err) => {
      if (tmpFile) {
        await unlink(tmpFile).catch(() => {})
      }
      if (err) {
        console.error('[JARVIS] Volume error:', err.message)
        resolve({ success: false, error: err.message })
      } else {
        resolve({ success: true })
      }
    })
  })
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

export function readClipboard(): string {
  return clipboard.readText('clipboard').trim()
}

// ─── System Info ──────────────────────────────────────────────────────────────

export function getSystemInfo(): {
  time: string
  date: string
  platform: string
  uptime: number
} {
  const now = new Date()
  return {
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    platform: process.platform,
    uptime: Math.floor(process.uptime())
  }
}
