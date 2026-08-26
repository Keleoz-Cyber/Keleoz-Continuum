type MusicIconName = 'mode' | 'mode-single' | 'mode-random' | 'prev' | 'play' | 'pause' | 'next' | 'plus' | 'queue'

export function MusicIcon({ name, size = 14 }: { name: MusicIconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'mode' || name === 'mode-single') return <svg {...common} strokeWidth="2.2"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />{name === 'mode-single' && <text x="12" y="14" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">1</text>}</svg>
  if (name === 'mode-random') return <svg {...common} strokeWidth="2.2"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
  if (name === 'prev') return <svg {...common} fill="currentColor" stroke="none"><rect x="3" y="5" width="2.5" height="14" rx="1" /><path d="M19 5L9 12l10 7z" /></svg>
  if (name === 'next') return <svg {...common} fill="currentColor" stroke="none"><rect x="18.5" y="5" width="2.5" height="14" rx="1" /><path d="M5 5l10 7-10 7z" /></svg>
  if (name === 'play') return <svg {...common} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>
  if (name === 'pause') return <svg {...common} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
  if (name === 'plus') return <svg {...common} strokeWidth="1.8"><path d="M12 5.5v13M5.5 12h13" /></svg>
  return <svg {...common} strokeWidth="1.8"><path d="M4 6.5h16M4 12h16M4 17.5h9M17.5 15.5v5l3-2.5z" /></svg>
}
