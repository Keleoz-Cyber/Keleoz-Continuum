'use client'

import { useEffect, useRef } from 'react'

type RainDrop = {
  x: number
  y: number
  z: number
  v: number
  w: number
  wf: number
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** Exact React lifecycle adapter for the Desktop upstream 45-drop rain field. */
export function SourceRain({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')!
    if (!canvas || !context) return

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const wind = 24
    const drops: RainDrop[] = []
    let width = 0
    let height = 0
    let frame = 0
    let last = 0

    function reset(drop: RainDrop) {
      drop.z = randomBetween(0.35, 1)
      drop.x = Math.random() * width
      drop.v = (380 + randomBetween(0, 320)) * drop.z
      drop.y = -randomBetween(0.05, 1.2) * drop.v
      drop.w = 1.8 + drop.z * 0.8
      drop.wf = randomBetween(0.8, 1.2)
    }

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      drops.length = 0
      for (let index = 0; index < 45; index += 1) {
        const drop: RainDrop = { x: 0, y: 0, z: 0, v: 0, w: 0, wf: 0 }
        reset(drop)
        drops.push(drop)
      }
    }

    function draw(timestamp: number) {
      frame = window.requestAnimationFrame(draw)
      const delta = Math.min(0.05, (timestamp - last) / 1_000 || 0.016)
      last = timestamp
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'

      for (const drop of drops) {
        const windSpeed = wind * drop.z * drop.wf
        drop.y += drop.v * delta
        drop.x += windSpeed * delta
        if (drop.x > width + 30) drop.x -= width + 60
        const length = Math.min(72, drop.v * 0.1)
        if (drop.y - length > height) {
          reset(drop)
          continue
        }
        if (drop.y < -40) continue

        const alpha = 0.18 + 0.26 * drop.z
        const tailX = drop.x - windSpeed * (length / drop.v)
        const tailY = drop.y - length
        const gradient = context.createLinearGradient(tailX, tailY, drop.x, drop.y)
        gradient.addColorStop(0, 'rgba(200,220,242,0)')
        gradient.addColorStop(0.62, `rgba(208,225,245,${(alpha * 0.55).toFixed(3)})`)
        gradient.addColorStop(1, `rgba(218,232,250,${Math.min(0.5, alpha * 1.15).toFixed(3)})`)
        context.strokeStyle = gradient
        context.lineWidth = drop.w
        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(drop.x, drop.y)
        context.stroke()
        context.fillStyle = `rgba(224,238,252,${Math.min(0.45, alpha * 0.9).toFixed(3)})`
        context.beginPath()
        context.arc(drop.x, drop.y, drop.w * 0.55, 0, Math.PI * 2)
        context.fill()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame = window.requestAnimationFrame(draw)
    }
    return () => {
      window.removeEventListener('resize', resize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div id="rain-container" className={visible ? 'rain-visible' : ''} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
