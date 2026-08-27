'use client'

import { useEffect, useRef } from 'react'

type MistBlob = {
  kind: 'light' | 'dark'
  x: number
  y: number
  baseRadius: number
  radius: number
  vx: number
  vy: number
  wanderFrequency: number
  wanderPhase: number
  wanderAmplitude: number
  breathSpeed: number
  breathPhase: number
  breathAmplitude: number
  opacity: number
  red: number
  green: number
  blue: number
}

/** Exact React lifecycle adapter for the Desktop upstream splash mist field. */
export function SourceMist({ dissolving, hidden }: { dissolving: boolean; hidden: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasNode = canvasRef.current
    if (!canvasNode || hidden) return
    const contextNode = canvasNode.getContext('2d')
    if (!contextNode) return
    const canvas: HTMLCanvasElement = canvasNode
    const context: CanvasRenderingContext2D = contextNode

    let width = 0
    let height = 0
    let frame = 0
    let time = 0
    const blobs: MistBlob[] = []
    const lightColors = [
      { red: 150, green: 195, blue: 255 },
      { red: 168, green: 206, blue: 252 },
      { red: 132, green: 182, blue: 246 },
      { red: 178, green: 212, blue: 253 },
      { red: 156, green: 200, blue: 250 },
    ]
    const darkColors = [
      { red: 26, green: 40, blue: 78 },
      { red: 20, green: 34, blue: 70 },
      { red: 36, green: 50, blue: 92 },
      { red: 32, green: 48, blue: 86 },
      { red: 28, green: 42, blue: 80 },
    ]

    function resize() {
      width = canvas.width = window.innerWidth * 1.5
      height = canvas.height = window.innerHeight * 1.5
    }

    function push(color: { red: number; green: number; blue: number }, kind: 'light' | 'dark') {
      const isLight = kind === 'light'
      blobs.push({
        kind,
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: isLight ? 210 + Math.random() * 240 : 290 + Math.random() * 300,
        radius: 0,
        vx: (Math.random() - 0.5) * (isLight ? 1.6 : 1.2),
        vy: (Math.random() - 0.5) * (isLight ? 1.3 : 1),
        wanderFrequency: (isLight ? 0.6 : 0.5) + Math.random() * 0.45,
        wanderPhase: Math.random() * Math.PI * 2,
        wanderAmplitude: isLight ? 0.26 : 0.22,
        breathSpeed: 0.002 + Math.random() * 0.0035,
        breathPhase: Math.random() * Math.PI * 2,
        breathAmplitude: 0.18,
        opacity: isLight ? 0.26 + Math.random() * 0.16 : 0.3 + Math.random() * 0.16,
        ...color,
      })
    }

    function paint(blob: MistBlob) {
      blob.x += blob.vx + Math.sin(time * blob.wanderFrequency + blob.wanderPhase) * blob.wanderAmplitude
      blob.y += blob.vy + Math.cos(time * blob.wanderFrequency * 0.8 + blob.wanderPhase) * blob.wanderAmplitude
      if (blob.x < -blob.baseRadius * 0.6) blob.vx = Math.abs(blob.vx) * 0.85 + 0.08
      if (blob.x > width + blob.baseRadius * 0.6) blob.vx = -Math.abs(blob.vx) * 0.85 - 0.08
      if (blob.y < -blob.baseRadius * 0.6) blob.vy = Math.abs(blob.vy) * 0.85 + 0.06
      if (blob.y > height + blob.baseRadius * 0.6) blob.vy = -Math.abs(blob.vy) * 0.85 - 0.06
      blob.radius = blob.baseRadius * (1 + blob.breathAmplitude * Math.sin(time * blob.breathSpeed * 60 + blob.breathPhase))
      const gradient = context.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
      const rgb = `${blob.red},${blob.green},${blob.blue}`
      gradient.addColorStop(0, `rgba(${rgb},${blob.opacity})`)
      gradient.addColorStop(0.5, `rgba(${rgb},${blob.opacity * 0.55})`)
      gradient.addColorStop(0.8, `rgba(${rgb},${blob.opacity * 0.16})`)
      gradient.addColorStop(1, `rgba(${rgb},0)`)
      context.beginPath()
      context.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
      context.fillStyle = gradient
      context.fill()
    }

    function draw() {
      context.clearRect(0, 0, width, height)
      time += 0.016
      context.globalCompositeOperation = 'source-over'
      blobs.forEach((blob) => { if (blob.kind === 'dark') paint(blob) })
      context.globalCompositeOperation = 'lighter'
      blobs.forEach((blob) => { if (blob.kind === 'light') paint(blob) })
      context.globalCompositeOperation = 'source-over'
      frame = window.requestAnimationFrame(draw)
    }

    resize()
    lightColors.forEach((color) => push(color, 'light'))
    darkColors.forEach((color) => push(color, 'dark'))
    window.addEventListener('resize', resize)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw()
    return () => {
      window.removeEventListener('resize', resize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [hidden])

  if (hidden) return null
  return <canvas ref={canvasRef} id="splash-mist" className={dissolving ? 'is-dissolving' : ''} aria-hidden="true" />
}
