import Link from 'next/link'

function PublicMark() {
  return <svg className="source-public-mark" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 8.7 C11.72 10.4 11.72 13.9 12 16.1" fill="none" />
    <path d="M11.55 10.9 C10.4 8.1 8.2 5.4 5.6 4.35 C3.35 3.45 1.7 4.5 1.95 6.55 C2.2 8.7 4.3 10.6 6.9 11.45 C8.7 12.03 10.45 11.9 11.55 11.35 Z" fill="none" />
    <path d="M12.45 10.9 C13.6 8.1 15.8 5.4 18.4 4.35 C20.65 3.45 22.3 4.5 22.05 6.55 C21.8 8.7 19.7 10.6 17.1 11.45 C15.3 12.03 13.55 11.9 12.45 11.35 Z" fill="none" />
    <path d="M11.6 12.55 C10.1 12.45 7.6 12.85 6.05 14.35 C4.5 15.85 4.75 18.05 6.45 18.75 C8.2 19.45 10.35 18.3 11.35 16.35 C11.95 15.15 12.05 13.6 11.6 12.55 Z" fill="none" />
    <path d="M12.4 12.55 C13.9 12.45 16.4 12.85 17.95 14.35 C19.5 15.85 19.25 18.05 17.55 18.75 C15.8 19.45 13.65 18.3 12.65 16.35 C12.05 15.15 11.95 13.6 12.4 12.55 Z" fill="none" />
    <g strokeWidth="0.62" opacity="0.5">
      <path d="M10.6 10.75 C8.9 9 7 7.1 4.6 5.9" fill="none" />
      <path d="M10.2 11.35 C8.15 10.9 6.05 9.8 4.35 8.25" fill="none" />
      <path d="M10.7 13.1 C9.1 13.55 7.35 14.6 6.35 16.05" fill="none" />
      <path d="M13.4 10.75 C15.1 9 17 7.1 19.4 5.9" fill="none" />
      <path d="M13.8 11.35 C15.85 10.9 17.95 9.8 19.65 8.25" fill="none" />
      <path d="M13.3 13.1 C14.9 13.55 16.65 14.6 17.65 16.05" fill="none" />
    </g>
  </svg>
}

function PublicNavLink({ children, className, href, reloadDocument }: {
  children: React.ReactNode
  className?: string
  href: string
  reloadDocument?: boolean
}) {
  return reloadDocument
    ? <a className={className} href={href}>{children}</a>
    : <Link className={className} href={href}>{children}</Link>
}

export function SourcePublicNav({ current, reloadDocument = false }: {
  current?: 'blog' | 'projects' | 'moments' | 'about' | 'letters' | 'room'
  reloadDocument?: boolean
}) {
  return (
    <nav className="source-public-nav" aria-label="主导航">
      <PublicNavLink className="source-public-brand" href="/" reloadDocument={reloadDocument}><PublicMark /> KC</PublicNavLink>
      <ul className="source-public-links">
        <li><PublicNavLink className={current === 'blog' ? 'active' : ''} href="/blog" reloadDocument={reloadDocument}>Blog</PublicNavLink></li>
        <li><PublicNavLink className={current === 'projects' ? 'active' : ''} href="/projects" reloadDocument={reloadDocument}>Projects</PublicNavLink></li>
        <li><PublicNavLink className={current === 'moments' ? 'active' : ''} href="/moments" reloadDocument={reloadDocument}>Moments</PublicNavLink></li>
        <li><PublicNavLink className={current === 'about' ? 'active' : ''} href="/about" reloadDocument={reloadDocument}>About</PublicNavLink></li>
        <li><PublicNavLink className={current === 'room' ? 'active' : ''} href="/room" reloadDocument={reloadDocument}>Room</PublicNavLink></li>
        <li><PublicNavLink className={current === 'letters' ? 'active' : ''} href="/letters" reloadDocument={reloadDocument}>Letters</PublicNavLink></li>
      </ul>
    </nav>
  )
}
