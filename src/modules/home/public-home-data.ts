import type { PublicContentDto, PublicContentListItem } from '@/modules/content/dto'

type ContentType = PublicContentListItem['type']

export type HomePublicData = {
  projects: PublicContentListItem[]
  blogs: PublicContentListItem[]
  moments: PublicContentListItem[]
  timeline: PublicContentListItem[]
  about: PublicContentDto | null
}

export async function loadHomePublicData(dependencies: {
  list(type: ContentType): Promise<PublicContentListItem[]>
  timeline(): Promise<PublicContentListItem[]>
  detail(type: ContentType, slug: string): Promise<PublicContentDto | null>
}): Promise<HomePublicData> {
  const [projects, blogs, moments, timeline, about] = await Promise.allSettled([
    dependencies.list('project'),
    dependencies.list('blog'),
    dependencies.list('moment'),
    dependencies.timeline(),
    dependencies.detail('page', 'about'),
  ])
  return {
    projects: projects.status === 'fulfilled' ? projects.value : [],
    blogs: blogs.status === 'fulfilled' ? blogs.value : [],
    moments: moments.status === 'fulfilled' ? moments.value : [],
    timeline: timeline.status === 'fulfilled' ? timeline.value : [],
    about: about.status === 'fulfilled' ? about.value : null,
  }
}
