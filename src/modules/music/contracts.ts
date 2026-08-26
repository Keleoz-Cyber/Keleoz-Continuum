export type PlaybackMode = 'list' | 'single' | 'random'

export function cleanTrackName(filename: string): string {
  return filename.trim().replace(/\.[^./\\]+$/, '')
}

export function nextTrackIndex(
  currentIndex: number,
  length: number,
  mode: PlaybackMode,
  random = Math.random,
): number {
  if (length <= 0) return -1
  if (mode === 'single') return Math.min(Math.max(currentIndex, 0), length - 1)
  if (mode === 'random') return Math.floor(random() * length)
  return (currentIndex + 1 + length) % length
}

export function parseLrc(source: string): Array<{ start: number; text: string }> {
  const segments: Array<{ start: number; text: string }> = []
  for (const line of source.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)]
    const text = line.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g, '').trim()
    if (!text) continue
    for (const match of matches) {
      const fraction = match[3] ? Number(match[3]) / 10 ** match[3].length : 0
      segments.push({ start: Number(match[1]) * 60 + Number(match[2]) + fraction, text })
    }
  }
  return segments.toSorted((left, right) => left.start - right.start)
}
