import React from 'react'

export function HUDBackground(): React.JSX.Element {
  return (
    <div className="hud-bg" aria-hidden="true">
      <div className="hud-grid" />
      <div className="hud-scanline" />
      <div className="hud-vignette" />

      {/* Corner brackets */}
      <div className="hud-corner hud-corner-tl">
        <div className="hud-corner-h" />
        <div className="hud-corner-v" />
      </div>
      <div className="hud-corner hud-corner-tr">
        <div className="hud-corner-h" />
        <div className="hud-corner-v" />
      </div>
      <div className="hud-corner hud-corner-bl">
        <div className="hud-corner-h" />
        <div className="hud-corner-v" />
      </div>
      <div className="hud-corner hud-corner-br">
        <div className="hud-corner-h" />
        <div className="hud-corner-v" />
      </div>

      {/* Side accent lines */}
      <div className="hud-side-line hud-side-left" />
      <div className="hud-side-line hud-side-right" />

      {/* Horizontal data lines */}
      <div className="hud-data-line hud-data-top" />
      <div className="hud-data-line hud-data-bottom" />
    </div>
  )
}
