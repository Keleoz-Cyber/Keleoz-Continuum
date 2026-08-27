'use client'

import { useEffect, useRef } from 'react'

type Point = { x: number; y: number }
type Stroke = { points: Point[]; width: number }
type Drop = { x: number; y: number; targetY: number; simX: number; simY: number; strength: number; velocity: number; vx: number; width: number }
type Plip = { x: number; y: number; time: number }

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function midpoint(left: Point, right: Point): Point {
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }
}

/**
 * Source-extracted Desktop Glass Canvas. The only adaptations are React lifecycle
 * cleanup and the public asset URL; drawing, fog and water parameters stay upstream.
 */
export function SourceGlassCanvas({ active, exiting, off }: { active: boolean; exiting: boolean; off: boolean }) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const paneRef = useRef<HTMLDivElement | null>(null)
  const inkRef = useRef<HTMLCanvasElement | null>(null)
  const fogRef = useRef<HTMLCanvasElement | null>(null)
  const rippleRef = useRef<HTMLCanvasElement | null>(null)
  const backgroundRippleRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!active) return
    const slot = slotRef.current!
    const pane = paneRef.current!
    const inkCanvas = inkRef.current!
    const fogCanvas = fogRef.current!
    if (!slot || !pane || !inkCanvas || !fogCanvas) return
    const ink = inkCanvas.getContext('2d')!
    const fog = fogCanvas.getContext('2d')!
    if (!ink || !fog) return

    const abort = new AbortController()
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const inkStrokes: Stroke[] = []
    const wipeStrokes: Stroke[] = []
    let current: { tool: 'pen' | 'finger'; stroke: Stroke } | null = null
    let width = 0
    let height = 0
    let tool: 'pen' | 'finger' = 'finger'
    let fogDensity = 1
    const size = { pen: 3.6, finger: 19 }
    const penMin = 1.4
    const penMax = 9
    const fingerMin = 8
    const fingerMax = 44
    let fogRedrawFrame = 0

    function tracePath(context: CanvasRenderingContext2D, points: Point[]) {
      context.beginPath()
      if (points.length === 1) {
        context.moveTo(points[0]!.x * width, points[0]!.y * height)
        context.lineTo(points[0]!.x * width + 0.01, points[0]!.y * height)
        return
      }
      context.moveTo(points[0]!.x * width, points[0]!.y * height)
      if (points.length === 2) {
        context.lineTo(points[1]!.x * width, points[1]!.y * height)
        return
      }
      const firstMidpoint = midpoint(points[0]!, points[1]!)
      context.lineTo(firstMidpoint.x * width, firstMidpoint.y * height)
      for (let index = 1; index < points.length - 1; index += 1) {
        const nextMidpoint = midpoint(points[index]!, points[index + 1]!)
        context.quadraticCurveTo(points[index]!.x * width, points[index]!.y * height, nextMidpoint.x * width, nextMidpoint.y * height)
      }
      const last = points[points.length - 1]!
      context.lineTo(last.x * width, last.y * height)
    }

    function inkStyle(strokeWidth: number) {
      ink.lineCap = 'round'
      ink.lineJoin = 'round'
      ink.strokeStyle = 'rgba(255,255,255,0.78)'
      ink.fillStyle = 'rgba(255,255,255,0.78)'
      ink.lineWidth = strokeWidth
      ink.shadowColor = 'rgba(178,212,255,0.9)'
      ink.shadowBlur = 12
    }

    function renderInkStroke(stroke: Stroke) {
      inkStyle(stroke.width)
      if (stroke.points.length === 1) {
        const point = stroke.points[0]!
        ink.beginPath()
        ink.arc(point.x * width, point.y * height, stroke.width * 0.53, 0, Math.PI * 2)
        ink.fill()
        return
      }
      tracePath(ink, stroke.points)
      ink.stroke()
    }

    function redrawInk() {
      ink.clearRect(0, 0, width, height)
      inkStrokes.forEach(renderInkStroke)
    }

    function fogAlpha(alpha: number) {
      return Math.min(1, alpha * fogDensity)
    }

    function blotch(x: number, y: number, radius: number, alpha: number) {
      const gradient = fog.createRadialGradient(width * x, height * y, 0, width * x, height * y, Math.max(width, height) * radius)
      gradient.addColorStop(0, `rgba(222,234,250,${alpha})`)
      gradient.addColorStop(1, 'rgba(222,234,250,0)')
      fog.fillStyle = gradient
      fog.fillRect(0, 0, width, height)
    }

    function paintHaze() {
      fog.globalCompositeOperation = 'source-over'
      fog.shadowBlur = 0
      fog.fillStyle = `rgba(208,224,244,${fogAlpha(0.1)})`
      fog.fillRect(0, 0, width, height)
      const gradient = fog.createRadialGradient(width * 0.5, height * 0.46, Math.min(width, height) * 0.22, width * 0.5, height * 0.5, Math.max(width, height) * 0.72)
      gradient.addColorStop(0, 'rgba(214,228,246,0)')
      gradient.addColorStop(1, `rgba(214,228,246,${fogAlpha(0.12)})`)
      fog.fillStyle = gradient
      fog.fillRect(0, 0, width, height)
      blotch(0.18, 0.2, 0.5, fogAlpha(0.06))
      blotch(0.82, 0.74, 0.55, fogAlpha(0.05))
      blotch(0.6, 0.12, 0.4, fogAlpha(0.04))
    }

    function renderWipeStroke(stroke: Stroke) {
      fog.globalCompositeOperation = 'destination-out'
      fog.lineCap = 'round'
      fog.lineJoin = 'round'
      fog.strokeStyle = 'rgba(0,0,0,0.92)'
      fog.lineWidth = stroke.width
      if (stroke.points.length === 1) {
        const point = stroke.points[0]!
        fog.fillStyle = 'rgba(0,0,0,0.92)'
        fog.beginPath()
        fog.arc(point.x * width, point.y * height, stroke.width / 2, 0, Math.PI * 2)
        fog.fill()
      }
      for (let index = 1; index < stroke.points.length; index += 1) {
        fog.beginPath()
        fog.moveTo(stroke.points[index - 1]!.x * width, stroke.points[index - 1]!.y * height)
        fog.lineTo(stroke.points[index]!.x * width, stroke.points[index]!.y * height)
        fog.stroke()
      }
      fog.globalCompositeOperation = 'source-over'
    }

    function redrawFog() {
      fog.globalCompositeOperation = 'source-over'
      fog.clearRect(0, 0, width, height)
      paintHaze()
      wipeStrokes.forEach(renderWipeStroke)
      fog.globalCompositeOperation = 'source-over'
    }

    function wipeSegmentLive(start: Point, end: Point, strokeWidth: number) {
      fog.globalCompositeOperation = 'destination-out'
      fog.lineCap = 'round'
      fog.lineJoin = 'round'
      fog.strokeStyle = 'rgba(0,0,0,0.92)'
      fog.lineWidth = strokeWidth
      fog.beginPath()
      fog.moveTo(start.x * width, start.y * height)
      fog.lineTo(end.x * width, end.y * height)
      fog.stroke()
      fog.globalCompositeOperation = 'source-over'
    }

    function sizeAll() {
      const rect = pane.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      width = rect.width
      height = rect.height
      inkCanvas.width = Math.round(width * dpr)
      inkCanvas.height = Math.round(height * dpr)
      fogCanvas.width = Math.round(width * dpr)
      fogCanvas.height = Math.round(height * dpr)
      ink.setTransform(dpr, 0, 0, dpr, 0, 0)
      fog.setTransform(dpr, 0, 0, dpr, 0, 0)
      redrawInk()
      redrawFog()
    }

    function pointerPoint(event: PointerEvent): Point {
      const rect = inkCanvas.getBoundingClientRect()
      return { x: (event.clientX - rect.left) / width, y: (event.clientY - rect.top) / height }
    }

    function pointerDown(event: PointerEvent) {
      if (event.button > 0 || width < 2 || exiting) return
      try { inkCanvas.setPointerCapture(event.pointerId) } catch { /* capture is best effort */ }
      const point = pointerPoint(event)
      const stroke = { points: [point], width: size[tool] }
      current = { tool, stroke }
      if (tool === 'pen') inkStrokes.push(stroke)
      else wipeStrokes.push(stroke)
      if (tool === 'pen') redrawInk()
      else renderWipeStroke(stroke)
      event.preventDefault()
    }

    function pointerMove(event: PointerEvent) {
      if (!current) return
      const point = pointerPoint(event)
      const points = current.stroke.points
      const last = points[points.length - 1]!
      if (Math.hypot((point.x - last.x) * width, (point.y - last.y) * height) < 1.2) return
      points.push(point)
      if (current.tool === 'pen') redrawInk()
      else wipeSegmentLive(points[points.length - 2]!, points[points.length - 1]!, current.stroke.width)
    }

    function pointerUp() {
      if (!current) return
      if (current.tool === 'finger') redrawFog()
      current = null
    }

    const penButton = slot.querySelector<HTMLButtonElement>('#gw-tool-pen')
    const fingerButton = slot.querySelector<HTMLButtonElement>('#gw-tool-finger')
    const clearButton = slot.querySelector<HTMLButtonElement>('#gw-clear')
    const frost = pane.querySelector<HTMLElement>('.gw-frost')

    function paintBrushTherm() {
      const element = slot.querySelector<HTMLElement>('#gw-therm-brush')
      const ratio = tool === 'pen' ? (size.pen - penMin) / (penMax - penMin) : (size.finger - fingerMin) / (fingerMax - fingerMin)
      const fill = element?.querySelector<HTMLElement>('.gw-therm-fill')
      const bulb = element?.querySelector<HTMLElement>('.gw-therm-bulb')
      const value = element?.querySelector<HTMLElement>('.gw-therm-val')
      if (fill) fill.style.width = `${(ratio * 100).toFixed(1)}%`
      if (bulb) bulb.style.opacity = (0.55 + ratio * 0.45).toFixed(3)
      if (value) value.textContent = `${Math.round(-13 + 20 * ratio)}°F`
    }

    function setTool(nextTool: 'pen' | 'finger') {
      tool = nextTool
      penButton?.classList.toggle('active', tool === 'pen')
      fingerButton?.classList.toggle('active', tool === 'finger')
      paintBrushTherm()
    }

    function clear() {
      inkStrokes.length = 0
      wipeStrokes.length = 0
      current = null
      redrawInk()
      redrawFog()
    }

    function requestFogRedraw() {
      if (fogRedrawFrame) return
      fogRedrawFrame = window.requestAnimationFrame(() => {
        fogRedrawFrame = 0
        redrawFog()
      })
    }

    function syncFrostFog() {
      const ratio = (fogDensity - 0.3) / 2
      if (frost) frost.style.opacity = (0.08 + ratio * 0.72).toFixed(3)
    }

    function makeTherm(
      element: HTMLElement | null,
      getValue: () => number,
      setValue: (value: number) => void,
      format: (value: number) => string,
    ) {
      if (!element) return
      const tube = element.querySelector<HTMLElement>('.gw-therm-tube')
      const fill = element.querySelector<HTMLElement>('.gw-therm-fill')
      const bulb = element.querySelector<HTMLElement>('.gw-therm-bulb')
      const value = element.querySelector<HTMLElement>('.gw-therm-val')
      let dragging = false

      function paint() {
        const currentValue = getValue()
        if (fill) fill.style.width = `${(currentValue * 100).toFixed(1)}%`
        if (bulb) bulb.style.opacity = (0.55 + currentValue * 0.45).toFixed(3)
        if (value) value.textContent = format(currentValue)
        element?.setAttribute('aria-valuenow', String(Math.round(currentValue * 100)))
      }
      function fromX(x: number) {
        const rect = tube?.getBoundingClientRect()
        if (!rect || rect.width < 2) return
        setValue(Math.max(0, Math.min(1, (x - rect.left) / rect.width)))
        paint()
      }
      function down(event: PointerEvent) {
        if (event.button > 0 || exiting) return
        dragging = true
        try { element?.setPointerCapture(event.pointerId) } catch { /* capture is best effort */ }
        fromX(event.clientX)
        event.preventDefault()
        event.stopPropagation()
      }
      function move(event: PointerEvent) {
        if (!dragging) return
        fromX(event.clientX)
        event.preventDefault()
      }
      function release() { dragging = false }
      function wheel(event: WheelEvent) {
        setValue(Math.max(0, Math.min(1, getValue() + (event.deltaY < 0 ? 0.05 : -0.05))))
        paint()
        event.preventDefault()
        event.stopPropagation()
      }
      element.addEventListener('pointerdown', down, { signal: abort.signal })
      element.addEventListener('pointermove', move, { signal: abort.signal })
      element.addEventListener('pointerup', release, { signal: abort.signal })
      element.addEventListener('pointercancel', release, { signal: abort.signal })
      element.addEventListener('wheel', wheel, { passive: false, signal: abort.signal })
      paint()
    }

    inkCanvas.addEventListener('pointerdown', pointerDown, { signal: abort.signal })
    inkCanvas.addEventListener('pointermove', pointerMove, { signal: abort.signal })
    inkCanvas.addEventListener('pointerup', pointerUp, { signal: abort.signal })
    inkCanvas.addEventListener('pointercancel', pointerUp, { signal: abort.signal })
    penButton?.addEventListener('click', () => setTool('pen'), { signal: abort.signal })
    fingerButton?.addEventListener('click', () => setTool('finger'), { signal: abort.signal })
    clearButton?.addEventListener('click', clear, { signal: abort.signal })

    syncFrostFog()
    makeTherm(
      slot.querySelector<HTMLElement>('#gw-therm-fog'),
      () => Math.max(0, Math.min(1, 1 - (fogDensity - 0.3) / 2)),
      (value) => { fogDensity = 0.3 + (1 - value) * 2; syncFrostFog(); requestFogRedraw() },
      (value) => `${Math.round(-13 + 20 * value) || 0}℃`,
    )
    makeTherm(
      slot.querySelector<HTMLElement>('#gw-therm-brush'),
      () => tool === 'pen' ? (size.pen - penMin) / (penMax - penMin) : (size.finger - fingerMin) / (fingerMax - fingerMin),
      (value) => { if (tool === 'pen') size.pen = penMin + value * (penMax - penMin); else size.finger = fingerMin + value * (fingerMax - fingerMin) },
      () => {
        const ratio = tool === 'pen' ? (size.pen - penMin) / (penMax - penMin) : (size.finger - fingerMin) / (fingerMax - fingerMin)
        return `${Math.round(-13 + 20 * ratio)}°F`
      },
    )

    const observer = new ResizeObserver(sizeAll)
    observer.observe(pane)
    window.addEventListener('resize', sizeAll, { signal: abort.signal })
    sizeAll()
    return () => {
      abort.abort()
      observer.disconnect()
      if (fogRedrawFrame) window.cancelAnimationFrame(fogRedrawFrame)
    }
  }, [active, exiting])

  useEffect(() => {
    if (!active) return
    const slot = slotRef.current!
    const pane = paneRef.current!
    const rippleCanvas = rippleRef.current!
    const backgroundCanvas = backgroundRippleRef.current!
    const splash = slot.parentElement!
    if (!slot || !pane || !rippleCanvas || !backgroundCanvas || !splash) return
    const rippleContext = rippleCanvas.getContext('2d')!
    const backgroundContext = backgroundCanvas.getContext('2d')!
    if (!rippleContext || !backgroundContext) return

    const abort = new AbortController()
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const smallQuery = window.matchMedia('(max-width:900px)')
    const simulation = document.createElement('canvas')
    const simulationContext = simulation.getContext('2d', { willReadFrequently: true })!
    if (!simulationContext) return

    let width = 0
    let height = 0
    let image: HTMLImageElement | null = null
    let refractOkay = true
    let simWidth = 0
    let simHeight = 0
    let first = new Float32Array()
    let second = new Float32Array()
    let backgroundData: ImageData | null = null
    let output: ImageData | null = null
    let waterTime = 0
    let rainTimer = randomBetween(0.6, 1.6)
    let ambientTimer = randomBetween(1.5, 3)
    let mode: 'pane' | 'bg' | null = null
    let targetReady = false
    let shownPane = false
    let shownBackground = false
    let last = 0
    let stepAccumulator = 0
    let frame = 0
    let stopped = false
    const damping = 0.9855
    const refraction = 2
    const light = 10
    const step = 1 / 30
    const drops: Drop[] = []
    const plips: Plip[] = []
    const stirPoints = new Map<number, Point>()

    function poke(centerX: number, centerY: number, strength: number, radius: number) {
      const radiusSquared = radius * radius
      const extent = Math.ceil(radius)
      for (let y = -extent; y <= extent; y += 1) {
        for (let x = -extent; x <= extent; x += 1) {
          const pixelX = Math.trunc(centerX) + x
          const pixelY = Math.trunc(centerY) + y
          if (pixelX < 1 || pixelY < 1 || pixelX >= simWidth - 1 || pixelY >= simHeight - 1) continue
          const fraction = (x * x + y * y) / radiusSquared
          if (fraction > 1) continue
          first[pixelY * simWidth + pixelX] += strength * (0.5 + 0.5 * Math.cos(Math.PI * Math.sqrt(fraction)))
        }
      }
    }

    function stepWater() {
      waterTime += 0.0333
      for (let y = 1; y < simHeight - 1; y += 1) {
        let index = y * simWidth + 1
        for (let x = 1; x < simWidth - 1; x += 1, index += 1) {
          second[index] = ((first[index - 1]! + first[index + 1]! + first[index - simWidth]! + first[index + simWidth]!) * 0.5 - second[index]!) * damping
            + 0.0024 * Math.sin(waterTime * 0.7 + x * 0.05 + y * 0.021)
            + 0.0019 * Math.sin(waterTime * 0.43 - x * 0.023 + y * 0.041)
        }
      }
      const swap = first
      first = second
      second = swap
    }

    function renderWater() {
      if (!output || !mode) return
      const gloss = mode === 'bg' || !refractOkay
      const context = mode === 'bg' ? backgroundContext : rippleContext
      const gain = mode === 'bg' ? 150 : 330
      const cap = mode === 'bg' ? 110 : 165
      const destination = output.data
      const source = gloss ? null : backgroundData?.data ?? null
      for (let y = 0; y < simHeight; y += 1) {
        const up = y > 0 ? y - 1 : y
        const down = y < simHeight - 1 ? y + 1 : y
        for (let x = 0; x < simWidth; x += 1) {
          const index = y * simWidth + x
          const left = x > 0 ? index - 1 : index
          const right = x < simWidth - 1 ? index + 1 : index
          const gradientX = first[left]! - first[right]!
          const gradientY = first[up * simWidth + x]! - first[down * simWidth + x]!
          const destinationIndex = index * 4
          if (source) {
            const sourceX = Math.max(0, Math.min(simWidth - 1, x + Math.trunc(gradientX * refraction)))
            const sourceY = Math.max(0, Math.min(simHeight - 1, y + Math.trunc(gradientY * refraction)))
            const sourceIndex = (sourceY * simWidth + sourceX) * 4
            const shade = gradientY * light
            destination[destinationIndex] = source[sourceIndex]! + shade
            destination[destinationIndex + 1] = source[sourceIndex + 1]! + shade
            destination[destinationIndex + 2] = source[sourceIndex + 2]! + shade * 1.25
            destination[destinationIndex + 3] = 255
          } else {
            let alpha = gradientY * gain
            if (alpha >= 0) {
              destination[destinationIndex] = 224
              destination[destinationIndex + 1] = 238
              destination[destinationIndex + 2] = 255
              destination[destinationIndex + 3] = Math.min(cap, alpha)
            } else {
              alpha = -alpha
              destination[destinationIndex] = 10
              destination[destinationIndex + 1] = 22
              destination[destinationIndex + 2] = 44
              destination[destinationIndex + 3] = Math.min(cap, alpha)
            }
          }
        }
      }
      simulationContext.putImageData(output, 0, 0)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = true
      if (source) {
        context.filter = 'saturate(0.92) brightness(0.97)'
        context.drawImage(simulation, 0, 0, width, height)
        context.filter = 'none'
      } else {
        context.clearRect(0, 0, width, height)
        context.drawImage(simulation, 0, 0, width, height)
      }
    }

    function spawnDrop(strength: number) {
      const simX = randomBetween(2, simWidth - 2)
      const simY = randomBetween(2, simHeight - 2)
      const pixelX = simX / simWidth * width
      const pixelY = simY / simHeight * height
      const fall = height * randomBetween(0.34, 0.52)
      const duration = randomBetween(0.3, 0.42)
      const vx = randomBetween(-8, 14)
      drops.push({ x: pixelX - vx * duration, y: pixelY - fall, targetY: pixelY, simX, simY, strength, velocity: fall / duration, vx, width: 1 + strength * 0.35 })
    }

    function rhythm(delta: number) {
      rainTimer -= delta
      if (rainTimer <= 0) {
        rainTimer = randomBetween(0.9, 2.4)
        spawnDrop(randomBetween(0.8, 1.5))
        if (Math.random() < 0.18) spawnDrop(randomBetween(0.5, 0.9))
      }
      ambientTimer -= delta
      if (ambientTimer <= 0) {
        ambientTimer = randomBetween(2.5, 5.5)
        poke(randomBetween(2, simWidth - 2), randomBetween(2, simHeight - 2), randomBetween(0.25, 0.55), 3)
      }
    }

    function updateDrops(delta: number, context: CanvasRenderingContext2D) {
      for (let index = drops.length - 1; index >= 0; index -= 1) {
        const drop = drops[index]!
        drop.x += drop.vx * delta
        drop.y += drop.velocity * delta
        if (drop.y >= drop.targetY) {
          poke(drop.simX, drop.simY, drop.strength * 1.15, 1.6)
          poke(drop.simX, drop.simY, -drop.strength * 0.4, 3.2)
          plips.push({ x: drop.x, y: drop.targetY, time: 0.22 })
          drops.splice(index, 1)
          continue
        }
        const length = Math.min(26, drop.velocity * 0.045)
        const tailX = drop.x - drop.vx * (length / drop.velocity)
        const tailY = drop.y - length
        const gradient = context.createLinearGradient(tailX, tailY, drop.x, drop.y)
        gradient.addColorStop(0, 'rgba(214,229,248,0)')
        gradient.addColorStop(0.7, 'rgba(206,223,246,0.42)')
        gradient.addColorStop(1, 'rgba(232,243,255,0.8)')
        context.strokeStyle = gradient
        context.lineWidth = drop.width
        context.lineCap = 'round'
        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(drop.x, drop.y)
        context.stroke()
      }
      for (let index = plips.length - 1; index >= 0; index -= 1) {
        const plip = plips[index]!
        plip.time -= delta
        if (plip.time <= 0) {
          plips.splice(index, 1)
          continue
        }
        const alpha = plip.time / 0.22
        context.strokeStyle = `rgba(228,241,255,${(0.45 * alpha).toFixed(3)})`
        context.lineWidth = 0.9
        context.beginPath()
        context.arc(plip.x, plip.y, 1.2 + (1 - alpha) * 5, 0, Math.PI * 2)
        context.stroke()
        context.fillStyle = `rgba(236,246,255,${(0.55 * alpha * alpha).toFixed(3)})`
        context.beginPath()
        context.arc(plip.x, plip.y, 1.4 * alpha + 0.3, 0, Math.PI * 2)
        context.fill()
      }
    }

    function toSimulation(event: PointerEvent): Point | null {
      if (mode === 'pane') {
        const rect = pane.getBoundingClientRect()
        if (rect.width < 2 || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null
        return { x: (event.clientX - rect.left) / rect.width * simWidth, y: (event.clientY - rect.top) / rect.height * simHeight }
      }
      return { x: event.clientX / width * simWidth, y: event.clientY / height * simHeight }
    }

    function idle() {
      return document.hidden || exiting
    }

    function tap(event: PointerEvent) {
      if (!targetReady || idle()) return
      const point = toSimulation(event)
      if (!point) return
      stirPoints.set(event.pointerId, point)
      poke(point.x, point.y, 2, 2.8)
    }

    function stir(event: PointerEvent) {
      if (!(event.buttons & 1) || !targetReady || idle()) return
      const point = toSimulation(event)
      if (!point) return
      const previous = stirPoints.get(event.pointerId)
      if (!previous) {
        stirPoints.set(event.pointerId, point)
        return
      }
      const deltaX = point.x - previous.x
      const deltaY = point.y - previous.y
      const distance = Math.hypot(deltaX, deltaY)
      if (distance < 1.15) return
      const steps = Math.min(6, Math.ceil(distance / 1.5))
      const strength = Math.min(0.55, 0.12 + distance * 0.05)
      for (let index = 1; index <= steps; index += 1) {
        poke(previous.x + deltaX * index / steps, previous.y + deltaY * index / steps, strength, 1.7)
      }
      stirPoints.set(event.pointerId, point)
    }

    function lift(event: PointerEvent) {
      stirPoints.delete(event.pointerId)
    }

    function gridFit() {
      simWidth = Math.min(320, Math.max(150, Math.round(width / 4)))
      simHeight = Math.max(80, Math.round(simWidth * height / width))
      simulation.width = simWidth
      simulation.height = simHeight
      first = new Float32Array(simWidth * simHeight)
      second = new Float32Array(simWidth * simHeight)
      stepAccumulator = 0
      stirPoints.clear()
      drops.length = 0
      plips.length = 0
    }

    function rebuildBackground() {
      if (!image?.naturalWidth || !image.naturalHeight) return false
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const sourceWidth = width / scale
      const sourceHeight = height / scale
      const sourceX = (image.naturalWidth - sourceWidth) / 2
      const sourceY = (image.naturalHeight - sourceHeight) / 2
      const temporary = document.createElement('canvas')
      temporary.width = simWidth
      temporary.height = simHeight
      const temporaryContext = temporary.getContext('2d', { willReadFrequently: true })
      if (!temporaryContext) return false
      temporaryContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, simWidth, simHeight)
      try {
        backgroundData = temporaryContext.getImageData(0, 0, simWidth, simHeight)
        refractOkay = true
        slot.classList.remove('gw-gloss')
      } catch {
        backgroundData = null
        refractOkay = false
        slot.classList.add('gw-gloss')
      }
      output = simulationContext.createImageData(simWidth, simHeight)
      return true
    }

    function retarget(nextMode: 'pane' | 'bg') {
      if (nextMode === 'pane') {
        const rect = pane.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) return false
        width = rect.width
        height = rect.height
        rippleCanvas.width = Math.round(width * dpr)
        rippleCanvas.height = Math.round(height * dpr)
        gridFit()
        return rebuildBackground()
      }
      width = window.innerWidth
      height = window.innerHeight
      if (width < 2 || height < 2) return false
      backgroundCanvas.width = Math.round(width * dpr)
      backgroundCanvas.height = Math.round(height * dpr)
      gridFit()
      output = simulationContext.createImageData(simWidth, simHeight)
      for (let index = 0; index < 3; index += 1) poke(randomBetween(2, simWidth - 2), randomBetween(2, simHeight - 2), randomBetween(0.5, 1.1), 2)
      return true
    }

    function computeMode(): 'pane' | 'bg' {
      return off || smallQuery.matches ? 'bg' : 'pane'
    }

    function loop(timestamp: number) {
      if (stopped) return
      frame = window.requestAnimationFrame(loop)
      const nextMode = computeMode()
      if (nextMode !== mode) {
        mode = nextMode
        targetReady = retarget(nextMode)
        if (nextMode !== 'bg') {
          backgroundCanvas.classList.remove('on')
          shownBackground = false
        }
      }
      if (!targetReady || idle()) {
        last = timestamp
        return
      }
      const raw = (timestamp - last) / 1_000 || 0.016
      last = timestamp
      const delta = Math.min(0.05, raw)
      rhythm(Math.min(2, raw))
      stepAccumulator += delta
      let iterations = 0
      while (stepAccumulator >= step && iterations < 2) {
        stepWater()
        stepAccumulator -= step
        iterations += 1
      }
      renderWater()
      updateDrops(delta, mode === 'bg' ? backgroundContext : rippleContext)
      if (mode === 'pane' && !shownPane) {
        shownPane = true
        slot.classList.add('gw-rippling')
      } else if (mode === 'bg' && !shownBackground) {
        shownBackground = true
        backgroundCanvas.classList.add('on')
      }
    }

    const drawCanvas = inkRef.current
    if (drawCanvas && !reduced) {
      drawCanvas.addEventListener('pointerdown', (event) => { if (mode === 'pane') tap(event) }, { signal: abort.signal })
      drawCanvas.addEventListener('pointermove', (event) => { if (mode === 'pane') stir(event) }, { signal: abort.signal })
      drawCanvas.addEventListener('pointerup', lift, { signal: abort.signal })
      drawCanvas.addEventListener('pointercancel', lift, { signal: abort.signal })
      drawCanvas.addEventListener('pointerleave', lift, { signal: abort.signal })
      splash.addEventListener('pointerdown', (event) => { if (mode === 'bg') tap(event) }, { passive: true, signal: abort.signal })
      splash.addEventListener('pointermove', (event) => { if (mode === 'bg') stir(event) }, { passive: true, signal: abort.signal })
      splash.addEventListener('pointerup', lift, { passive: true, signal: abort.signal })
      splash.addEventListener('pointercancel', lift, { passive: true, signal: abort.signal })
      splash.addEventListener('pointerleave', lift, { passive: true, signal: abort.signal })
    }

    const observer = new ResizeObserver(() => { if (mode === 'pane') targetReady = retarget('pane') })
    observer.observe(pane)
    window.addEventListener('resize', () => { if (mode) targetReady = retarget(mode) }, { signal: abort.signal })
    const loadedImage = new Image()
    loadedImage.onload = () => {
      if (stopped) return
      image = loadedImage
      document.documentElement.style.setProperty('--gw-ar', (loadedImage.naturalWidth / loadedImage.naturalHeight).toFixed(6))
      slot.classList.add('gw-has-img')
      if (reduced) {
        mode = 'pane'
        if (retarget('pane')) {
          renderWater()
          slot.classList.add('gw-rippling')
        }
      } else if (mode === 'pane') targetReady = retarget('pane')
    }
    loadedImage.src = '/reference/internal-beyond/bg-canvas.png'
    if (!reduced) frame = window.requestAnimationFrame(loop)

    return () => {
      stopped = true
      abort.abort()
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [active, exiting, off])

  if (!active) return null
  return (
    <>
      <canvas ref={backgroundRippleRef} id="gw-ripple-bg" aria-hidden="true" />
      <div ref={slotRef} id="gw-slot" className={`${off ? 'gw-off ' : ''}${exiting ? 'gw-exit' : ''}`.trim()}>
        <div ref={paneRef} id="gw-pane">
          <div className="gw-ly gw-img" id="gw-img" />
          <canvas ref={rippleRef} id="gw-ripple" className="gw-ly" aria-hidden="true" />
          <div className="gw-ly gw-grade-c" />
          <div className="gw-ly gw-grade-s" />
          <div className="gw-ly gw-frost" />
          <div className="gw-ly gw-noise" />
          <div className="gw-ly gw-depth" />
          <canvas ref={fogRef} id="gw-fogwipe" className="gw-ly" aria-hidden="true" />
          <canvas ref={inkRef} id="gw-draw" aria-label="玻璃画窗" />
        </div>
        <div className="gw-ctrl">
          <button type="button" className="gw-cbtn" id="gw-tool-pen" aria-label="白笔">
            <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
          <button type="button" className="gw-cbtn active" id="gw-tool-finger" aria-label="指雾笔">
            <svg viewBox="0 0 24 24"><path d="M2 12a10 10 0 0 1 18-6" /><path d="M9 6.8a6 6 0 0 1 9 5.2v2" /><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" /><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" /><path d="M14 13.12c0 2.38 0 6.38-1 8.88" /><path d="M8.65 22c.21-.66.45-1.32.57-2" /><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" /><path d="M21.8 16c.2-2 .131-5.354 0-6" /><path d="M2 16h.01" /></svg>
          </button>
          <button type="button" className="gw-cbtn" id="gw-clear" aria-label="清除画迹">
            <svg viewBox="0 0 24 24"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>
          </button>
        </div>
        <div className="gw-therms">
          <div className="gw-therm" id="gw-therm-fog" role="slider" aria-label="玻璃温度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={65} tabIndex={0}>
            <span className="gw-therm-label">MIST</span><div className="gw-therm-body"><span className="gw-therm-bulb" /><div className="gw-therm-tube"><div className="gw-therm-fill" /></div></div><span className="gw-therm-val">0℃</span>
          </div>
          <div className="gw-therm" id="gw-therm-brush" role="slider" aria-label="画笔大小" aria-valuemin={0} aria-valuemax={100} aria-valuenow={31} tabIndex={0}>
            <span className="gw-therm-label">BRUSH</span><div className="gw-therm-body"><span className="gw-therm-bulb" /><div className="gw-therm-tube"><div className="gw-therm-fill" /></div></div><span className="gw-therm-val">0°F</span>
          </div>
        </div>
      </div>
    </>
  )
}
