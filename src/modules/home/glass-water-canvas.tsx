'use client'

import { useEffect, useRef } from 'react'

type RippleState = {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  simulation: HTMLCanvasElement
  simulationContext: CanvasRenderingContext2D
  width: number
  height: number
  simWidth: number
  simHeight: number
  first: Float32Array
  second: Float32Array
  imageData: ImageData | null
  output: ImageData | null
  drops: Array<{ x: number; y: number; targetY: number; sourceX: number; sourceY: number; strength: number; speed: number; vx: number; width: number }>
  plips: Array<{ x: number; y: number; time: number }>
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function GlassWaterCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<RippleState | null>(null)
  const activePointers = useRef(new Map<number, { x: number; y: number }>())

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const simulation = document.createElement('canvas')
    const simulationContext = simulation.getContext('2d', { willReadFrequently: true })
    if (!simulationContext) return

    const state: RippleState = {
      canvas,
      context,
      simulation,
      simulationContext,
      width: 0,
      height: 0,
      simWidth: 0,
      simHeight: 0,
      first: new Float32Array(),
      second: new Float32Array(),
      imageData: null,
      output: null,
      drops: [],
      plips: [],
    }
    stateRef.current = state
    const pointerMap = activePointers.current

    let animationFrame = 0
    let lastTime = 0
    let dropTimer = randomBetween(0.6, 1.6)
    let ambientTimer = randomBetween(1.5, 3)
    let waterTime = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const image = new Image()
    image.decoding = 'async'
    image.src = '/reference/internal-beyond/bg-canvas.png'

    function poke(cx: number, cy: number, strength: number, radius: number) {
      const current = stateRef.current
      if (!current || !current.simWidth || !current.simHeight) return
      const x0 = Math.round(cx)
      const y0 = Math.round(cy)
      const radiusSquared = radius * radius
      const extent = Math.ceil(radius)
      for (let y = -extent; y <= extent; y += 1) {
        for (let x = -extent; x <= extent; x += 1) {
          const px = x0 + x
          const py = y0 + y
          if (px < 1 || py < 1 || px >= current.simWidth - 1 || py >= current.simHeight - 1) continue
          const fraction = (x * x + y * y) / radiusSquared
          if (fraction > 1) continue
          current.first[py * current.simWidth + px] += strength * (0.5 + 0.5 * Math.cos(Math.PI * Math.sqrt(fraction)))
        }
      }
    }

    function resize() {
      const current = stateRef.current
      if (!current) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      current.width = window.innerWidth
      current.height = window.innerHeight
      current.canvas.width = Math.round(current.width * dpr)
      current.canvas.height = Math.round(current.height * dpr)
      current.canvas.style.width = `${current.width}px`
      current.canvas.style.height = `${current.height}px`
      current.context.setTransform(dpr, 0, 0, dpr, 0, 0)
      current.simWidth = Math.min(320, Math.max(150, Math.round(current.width / 4)))
      current.simHeight = Math.max(80, Math.round(current.simWidth * current.height / current.width))
      current.simulation.width = current.simWidth
      current.simulation.height = current.simHeight
      current.first = new Float32Array(current.simWidth * current.simHeight)
      current.second = new Float32Array(current.simWidth * current.simHeight)
      current.output = current.simulationContext.createImageData(current.simWidth, current.simHeight)
      current.drops = []
      current.plips = []
      rebuildBackground()
    }

    function rebuildBackground() {
      const current = stateRef.current
      if (!current || !image.naturalWidth || !image.naturalHeight) return
      const scale = Math.max(current.width / image.naturalWidth, current.height / image.naturalHeight)
      const sourceWidth = current.width / scale
      const sourceHeight = current.height / scale
      const sourceX = (image.naturalWidth - sourceWidth) / 2
      const sourceY = (image.naturalHeight - sourceHeight) / 2
      current.simulationContext.clearRect(0, 0, current.simWidth, current.simHeight)
      current.simulationContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, current.simWidth, current.simHeight)
      current.imageData = current.simulationContext.getImageData(0, 0, current.simWidth, current.simHeight)
      current.output = current.simulationContext.createImageData(current.simWidth, current.simHeight)
    }

    function stepWater() {
      const current = stateRef.current
      if (!current) return
      waterTime += 0.0333
      for (let y = 1; y < current.simHeight - 1; y += 1) {
        let index = y * current.simWidth + 1
        for (let x = 1; x < current.simWidth - 1; x += 1, index += 1) {
          current.second[index] = ((current.first[index - 1] + current.first[index + 1] + current.first[index - current.simWidth] + current.first[index + current.simWidth]) * 0.5 - current.second[index]) * 0.9855 + 0.0024 * Math.sin(waterTime * 0.7 + x * 0.05 + y * 0.021) + 0.0019 * Math.sin(waterTime * 0.43 - x * 0.023 + y * 0.041)
        }
      }
      const swap = current.first
      current.first = current.second
      current.second = swap
    }

    function renderWater() {
      const current = stateRef.current
      if (!current?.imageData || !current.output) return
      const source = current.imageData.data
      const target = current.output.data
      const height = current.simHeight
      const width = current.simWidth
      for (let y = 0; y < height; y += 1) {
        const up = y > 0 ? y - 1 : y
        const down = y < height - 1 ? y + 1 : y
        for (let x = 0; x < width; x += 1) {
          const index = y * width + x
          const left = x > 0 ? index - 1 : index
          const right = x < width - 1 ? index + 1 : index
          const gradientX = current.first[left] - current.first[right]
          const gradientY = current.first[up * width + x] - current.first[down * width + x]
          let sourceX = x + (gradientX * 2) | 0
          let sourceY = y + (gradientY * 2) | 0
          sourceX = Math.max(0, Math.min(width - 1, sourceX))
          sourceY = Math.max(0, Math.min(height - 1, sourceY))
          const sourceIndex = (sourceY * width + sourceX) * 4
          const targetIndex = index * 4
          const shade = gradientY * 10
          target[targetIndex] = Math.max(0, Math.min(255, source[sourceIndex]! + shade))
          target[targetIndex + 1] = Math.max(0, Math.min(255, source[sourceIndex + 1]! + shade))
          target[targetIndex + 2] = Math.max(0, Math.min(255, source[sourceIndex + 2]! + shade * 1.25))
          target[targetIndex + 3] = 255
        }
      }
      current.simulationContext.putImageData(current.output, 0, 0)
      current.context.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0)
      current.context.imageSmoothingEnabled = true
      current.context.filter = 'saturate(0.92) brightness(0.97)'
      current.context.drawImage(current.simulation, 0, 0, current.width, current.height)
      current.context.filter = 'none'
    }

    function spawnDrop(strength: number) {
      const current = stateRef.current
      if (!current) return
      const sourceX = randomBetween(2, current.simWidth - 2)
      const sourceY = randomBetween(2, current.simHeight - 2)
      const x = sourceX / current.simWidth * current.width
      const y = sourceY / current.simHeight * current.height
      const fall = current.height * randomBetween(0.34, 0.52)
      const duration = randomBetween(0.3, 0.42)
      const velocityX = randomBetween(-8, 14)
      current.drops.push({ x: x - velocityX * duration, y: y - fall, targetY: y, sourceX, sourceY, strength, speed: fall / duration, vx: velocityX, width: 1 + strength * 0.35 })
    }

    function updateDrops(delta: number) {
      const current = stateRef.current
      if (!current) return
      for (let index = current.drops.length - 1; index >= 0; index -= 1) {
        const drop = current.drops[index]!
        drop.x += drop.vx * delta
        drop.y += drop.speed * delta
        if (drop.y >= drop.targetY) {
          poke(drop.sourceX, drop.sourceY, drop.strength * 1.15, 1.6)
          poke(drop.sourceX, drop.sourceY, -drop.strength * 0.4, 3.2)
          current.plips.push({ x: drop.x, y: drop.targetY, time: 0.22 })
          current.drops.splice(index, 1)
          continue
        }
        const length = Math.min(26, drop.speed * 0.045)
        const fromX = drop.x - drop.vx * (length / drop.speed)
        const fromY = drop.y - length
        const gradient = current.context.createLinearGradient(fromX, fromY, drop.x, drop.y)
        gradient.addColorStop(0, 'rgba(214,229,248,0)')
        gradient.addColorStop(0.7, 'rgba(206,223,246,0.42)')
        gradient.addColorStop(1, 'rgba(232,243,255,0.8)')
        current.context.strokeStyle = gradient
        current.context.lineWidth = drop.width
        current.context.lineCap = 'round'
        current.context.beginPath()
        current.context.moveTo(fromX, fromY)
        current.context.lineTo(drop.x, drop.y)
        current.context.stroke()
      }
      for (let index = current.plips.length - 1; index >= 0; index -= 1) {
        const plip = current.plips[index]!
        plip.time -= delta
        if (plip.time <= 0) {
          current.plips.splice(index, 1)
          continue
        }
        const alpha = plip.time / 0.22
        current.context.strokeStyle = `rgba(228,241,255,${0.45 * alpha})`
        current.context.lineWidth = 0.9
        current.context.beginPath()
        current.context.arc(plip.x, plip.y, 1.2 + (1 - alpha) * 5, 0, Math.PI * 2)
        current.context.stroke()
      }
    }

    function loop(timestamp: number) {
      const delta = Math.min(0.05, (timestamp - lastTime) / 1_000 || 0.016)
      lastTime = timestamp
      const current = stateRef.current
      if (current) {
        current.context.clearRect(0, 0, current.width, current.height)
        dropTimer -= delta
        ambientTimer -= delta
        if (dropTimer <= 0) {
          dropTimer = randomBetween(0.9, 2.4)
          spawnDrop(randomBetween(0.8, 1.5))
          if (Math.random() < 0.18) spawnDrop(randomBetween(0.5, 0.9))
        }
        if (ambientTimer <= 0) {
          ambientTimer = randomBetween(2.5, 5.5)
          poke(randomBetween(2, current.simWidth - 2), randomBetween(2, current.simHeight - 2), randomBetween(0.25, 0.55), 3)
        }
        let steps = 0
        while (steps < 2) {
          stepWater()
          steps += 1
        }
        renderWater()
        updateDrops(delta)
      }
      animationFrame = window.requestAnimationFrame(loop)
    }

    function pointerDown(event: PointerEvent) {
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select, label')) return
      const current = stateRef.current
      if (!current) return
      pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY })
      poke(event.clientX / current.width * current.simWidth, event.clientY / current.height * current.simHeight, 2, 2.8)
    }
    function pointerMove(event: PointerEvent) {
      if (!event.buttons || !pointerMap.has(event.pointerId)) return
      const current = stateRef.current
      const previous = pointerMap.get(event.pointerId)
      if (!current || !previous) return
      const x = event.clientX / current.width * current.simWidth
      const y = event.clientY / current.height * current.simHeight
      const lastX = previous.x / current.width * current.simWidth
      const lastY = previous.y / current.height * current.simHeight
      const distance = Math.hypot(x - lastX, y - lastY)
      const steps = Math.min(6, Math.ceil(distance / 1.5))
      for (let index = 1; index <= steps; index += 1) poke(lastX + (x - lastX) * index / steps, lastY + (y - lastY) * index / steps, Math.min(0.55, 0.12 + distance * 0.05), 1.7)
      pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }
    function pointerUp(event: PointerEvent) {
      pointerMap.delete(event.pointerId)
    }

    image.onload = () => {
      resize()
      for (let index = 0; index < 3; index += 1) poke(randomBetween(2, state.simWidth - 2), randomBetween(2, state.simHeight - 2), randomBetween(0.5, 1.1), 2)
      renderWater()
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(loop)
    }
    window.addEventListener('resize', resize)
    window.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerUp)
    if (image.complete) image.onload(new Event('load'))
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      stateRef.current = null
      pointerMap.clear()
    }
  }, [active])

  if (!active) return null
  return <canvas ref={canvasRef} className="home-water-canvas" aria-hidden="true" />
}
