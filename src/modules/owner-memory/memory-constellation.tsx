'use client'

import { useEffect, useRef } from 'react'

export function MemoryConstellation(props: { memories: Array<{ id: string; title: string; valence: number; arousal: number; importance: number; pinned: boolean; resolved: boolean; domain: string }> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(rect.width * ratio))
      canvas.height = Math.max(1, Math.round(rect.height * ratio))
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      context.strokeStyle = 'rgba(76,126,188,.13)'
      context.lineWidth = 1
      for (let x = 0; x <= rect.width; x += Math.max(28, rect.width / 16)) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, rect.height); context.stroke() }
      for (let y = 0; y <= rect.height; y += Math.max(28, rect.height / 10)) { context.beginPath(); context.moveTo(0, y); context.lineTo(rect.width, y); context.stroke() }
      context.strokeStyle = 'rgba(62,112,178,.25)'
      context.beginPath(); context.moveTo(rect.width / 2, 0); context.lineTo(rect.width / 2, rect.height); context.moveTo(0, rect.height / 2); context.lineTo(rect.width, rect.height / 2); context.stroke()
      for (const memory of props.memories) {
        const x = rect.width * (0.08 + Math.max(0, Math.min(1, memory.valence)) * 0.84)
        const y = rect.height * (0.08 + (1 - Math.max(0, Math.min(1, memory.arousal))) * 0.84)
        const radius = 2.4 + memory.importance * 0.55
        const color = memory.pinned ? '214,170,73' : memory.resolved ? '165,177,201' : '82,144,211'
        const glow = context.createRadialGradient(x, y, 0, x, y, radius * 3)
        glow.addColorStop(0, `rgba(255,255,255,.96)`)
        glow.addColorStop(.25, `rgba(${color},.88)`)
        glow.addColorStop(1, `rgba(${color},0)`)
        context.fillStyle = glow
        context.beginPath(); context.arc(x, y, radius * 3, 0, Math.PI * 2); context.fill()
        context.fillStyle = `rgba(${color},.9)`
        context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill()
      }
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [props.memories])
  return <canvas ref={canvasRef} aria-label={`${props.memories.length} memories in the valence and arousal constellation`} />
}
