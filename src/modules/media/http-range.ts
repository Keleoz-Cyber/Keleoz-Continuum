export function parseMediaByteRange(header: string, size: number) {
  if (!Number.isSafeInteger(size) || size <= 0 || !header.startsWith('bytes=') || header.includes(',')) {
    throw new Error('Invalid media byte range')
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || (!match[1] && !match[2])) throw new Error('Invalid media byte range')
  let start: number
  let end: number
  if (!match[1]) {
    const suffix = Number(match[2])
    if (!Number.isSafeInteger(suffix) || suffix <= 0) throw new Error('Invalid media byte range')
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : size - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) throw new Error('Invalid media byte range')
    end = Math.min(end, size - 1)
  }
  if (start < 0 || start >= size || end < start) throw new Error('Unsatisfiable media byte range')
  return { start, end }
}
