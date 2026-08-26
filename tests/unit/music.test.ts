import { describe, expect, it } from 'vitest'

import { cleanTrackName, nextTrackIndex, parseLrc } from '@/modules/music/contracts'

describe('Music playback contracts', () => {
  it('removes an audio extension without damaging the title', () => {
    expect(cleanTrackName('  Blue Window — demo.MP3  ')).toBe('Blue Window — demo')
  })

  it('wraps list mode, keeps single mode, and chooses a valid random track', () => {
    expect(nextTrackIndex(2, 3, 'list')).toBe(0)
    expect(nextTrackIndex(2, 3, 'single')).toBe(2)
    expect(nextTrackIndex(0, 3, 'random', () => 0.66)).toBe(1)
  })

  it('parses timestamped LRC lines into ordered lyric segments', () => {
    expect(parseLrc('[00:12.50]First line\n[01:03.000]Second line')).toEqual([
      { start: 12.5, text: 'First line' },
      { start: 63, text: 'Second line' },
    ])
  })
})
