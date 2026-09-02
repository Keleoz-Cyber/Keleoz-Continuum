import { and, desc, eq, inArray, max, ne, or, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { contentEntries, contentMedia, contentPublications, contentVersions, mediaObjects } from '@/db/schema'
import type * as schema from '@/db/schema'
import { parseAndRenderDocument } from '@/modules/content/document'
import { extractMediaReferences } from '@/modules/content/media-nodes'
import { projectPublishedVersion } from '@/modules/content/projection'
import type { PublicContentListItem } from '@/modules/content/dto'
import type { DraftSnapshot, TiptapDocument } from '@/modules/content/schemas'
import { normalizeSlug, resolveStableSlug } from '@/modules/content/slug'
import {
  buildPublicSearchSnippet,
  normalizePublicSearchQuery,
  type PublicSearchResult,
} from '@/modules/continuity/contracts'

export class DraftConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super('Draft revision conflict')
    this.name = 'DraftConflictError'
  }
}

export class ContentNotFoundError extends Error {
  constructor() {
    super('Content entry was not found')
    this.name = 'ContentNotFoundError'
  }
}

export type CreateDraftInput = DraftSnapshot & {
  type: 'blog' | 'project' | 'moment' | 'page'
  slug: string
  document: TiptapDocument
}

export function createContentRepository(database: NodePgDatabase<typeof schema>) {
  return {
    async createDraft(input: CreateDraftInput) {
      const rendered = parseAndRenderDocument(input.document)
      const slug = normalizeSlug(input.slug)
      const [entry] = await database
        .insert(contentEntries)
        .values({
          type: input.type,
          slug,
          title: input.title,
          subtitle: input.subtitle,
          categoryLabel: input.categoryLabel,
          summary: input.summary,
          exposure: input.exposure,
          draftDocument: rendered.document,
          draftHtml: rendered.html,
          draftPlainText: rendered.plainText,
        })
        .returning({
          id: contentEntries.id,
          slug: contentEntries.slug,
          revision: contentEntries.draftRevision,
        })

      if (!entry) {
        throw new Error('Draft insert did not return a row')
      }

      return entry
    },
    async saveDraft(input: {
      entryId: string
      expectedRevision: number
      snapshot: DraftSnapshot
    }) {
      const rendered = parseAndRenderDocument(input.snapshot.document)
      const savedAt = new Date()
      const [saved] = await database
        .update(contentEntries)
        .set({
          title: input.snapshot.title,
          subtitle: input.snapshot.subtitle,
          categoryLabel: input.snapshot.categoryLabel,
          summary: input.snapshot.summary,
          exposure: input.snapshot.exposure,
          draftDocument: rendered.document,
          draftHtml: rendered.html,
          draftPlainText: rendered.plainText,
          draftRevision: sql`${contentEntries.draftRevision} + 1`,
          updatedAt: savedAt,
        })
        .where(
          and(
            eq(contentEntries.id, input.entryId),
            eq(contentEntries.draftRevision, input.expectedRevision),
          ),
        )
        .returning({
          revision: contentEntries.draftRevision,
          savedAt: contentEntries.updatedAt,
        })

      if (saved) {
        return saved
      }

      const [current] = await database
        .select({ revision: contentEntries.draftRevision })
        .from(contentEntries)
        .where(eq(contentEntries.id, input.entryId))
        .limit(1)

      if (!current) {
        throw new ContentNotFoundError()
      }

      throw new DraftConflictError(current.revision)
    },
    async listStudioDrafts() {
      const rows = await database
        .select({
          id: contentEntries.id,
          type: contentEntries.type,
          slug: contentEntries.slug,
          title: contentEntries.title,
          subtitle: contentEntries.subtitle,
          categoryLabel: contentEntries.categoryLabel,
          summary: contentEntries.summary,
          exposure: contentEntries.exposure,
          status: contentEntries.status,
          revision: contentEntries.draftRevision,
          updatedAt: contentEntries.updatedAt,
        })
        .from(contentEntries)
        .orderBy(desc(contentEntries.updatedAt))

      return rows
    },
    async getDraftById(entryId: string) {
      const [entry] = await database
        .select({
          id: contentEntries.id,
          type: contentEntries.type,
          slug: contentEntries.slug,
          title: contentEntries.title,
          subtitle: contentEntries.subtitle,
          categoryLabel: contentEntries.categoryLabel,
          summary: contentEntries.summary,
          exposure: contentEntries.exposure,
          status: contentEntries.status,
          document: contentEntries.draftDocument,
          html: contentEntries.draftHtml,
          plainText: contentEntries.draftPlainText,
          revision: contentEntries.draftRevision,
          createdAt: contentEntries.createdAt,
          updatedAt: contentEntries.updatedAt,
        })
        .from(contentEntries)
        .where(eq(contentEntries.id, entryId))
        .limit(1)

      return entry ?? null
    },
    async listVersions(entryId: string) {
      const [versions, publication] = await Promise.all([
        database
          .select({
            id: contentVersions.id,
            versionNumber: contentVersions.versionNumber,
            title: contentVersions.title,
            subtitle: contentVersions.subtitle,
            categoryLabel: contentVersions.categoryLabel,
            summary: contentVersions.summary,
            exposure: contentVersions.exposure,
            createdAt: contentVersions.createdAt,
          })
          .from(contentVersions)
          .where(eq(contentVersions.entryId, entryId))
          .orderBy(desc(contentVersions.versionNumber)),
        database
          .select({ versionId: contentPublications.versionId })
          .from(contentPublications)
          .where(eq(contentPublications.entryId, entryId))
          .limit(1),
      ])
      const currentVersionId = publication[0]?.versionId ?? null
      return versions.map((version) => ({ ...version, isPublished: version.id === currentVersionId }))
    },
    async getVersionById(input: { entryId: string; versionId: string }) {
      const [version] = await database
        .select({
          id: contentVersions.id,
          entryId: contentVersions.entryId,
          versionNumber: contentVersions.versionNumber,
          slug: contentVersions.slug,
          type: contentVersions.type,
          title: contentVersions.title,
          subtitle: contentVersions.subtitle,
          categoryLabel: contentVersions.categoryLabel,
          summary: contentVersions.summary,
          exposure: contentVersions.exposure,
          document: contentVersions.document,
          renderedHtml: contentVersions.renderedHtml,
          plainText: contentVersions.plainText,
          createdAt: contentVersions.createdAt,
        })
        .from(contentVersions)
        .where(and(eq(contentVersions.entryId, input.entryId), eq(contentVersions.id, input.versionId)))
        .limit(1)
      return version ?? null
    },
    async restoreVersionToDraft(input: {
      entryId: string
      versionId: string
      expectedRevision: number
      now?: Date
    }) {
      return database.transaction(async (transaction) => {
        const [entry] = await transaction
          .select({ revision: contentEntries.draftRevision })
          .from(contentEntries)
          .where(eq(contentEntries.id, input.entryId))
          .limit(1)
          .for('update')
        if (!entry) throw new ContentNotFoundError()
        if (entry.revision !== input.expectedRevision) throw new DraftConflictError(entry.revision)

        const [version] = await transaction
          .select()
          .from(contentVersions)
          .where(and(eq(contentVersions.entryId, input.entryId), eq(contentVersions.id, input.versionId)))
          .limit(1)
        if (!version) throw new ContentNotFoundError()

        const [restored] = await transaction
          .update(contentEntries)
          .set({
            title: version.title,
            subtitle: version.subtitle,
            categoryLabel: version.categoryLabel,
            summary: version.summary,
            exposure: version.exposure,
            draftDocument: version.document,
            draftHtml: version.renderedHtml,
            draftPlainText: version.plainText,
            draftRevision: sql`${contentEntries.draftRevision} + 1`,
            updatedAt: input.now ?? new Date(),
          })
          .where(and(eq(contentEntries.id, input.entryId), eq(contentEntries.draftRevision, input.expectedRevision)))
          .returning({ revision: contentEntries.draftRevision })
        if (!restored) throw new DraftConflictError(entry.revision)
        return { revision: restored.revision, restoredVersionNumber: version.versionNumber }
      })
    },
    async publishDraft(input: { entryId: string; now?: Date }) {
      const publishedAt = input.now ?? new Date()

      return database.transaction(async (transaction) => {
        const [entry] = await transaction
          .select()
          .from(contentEntries)
          .where(eq(contentEntries.id, input.entryId))
          .limit(1)
          .for('update')

        if (!entry) {
          throw new ContentNotFoundError()
        }

        const rendered = parseAndRenderDocument(entry.draftDocument)
        const mediaReferences = extractMediaReferences(rendered.document)
        const mediaIds = [...new Set(mediaReferences.map((reference) => reference.mediaId))]
        if (mediaIds.length) {
          const readyMedia = await transaction.select({ id: mediaObjects.id, mimeType: mediaObjects.mimeType }).from(mediaObjects)
            .where(and(inArray(mediaObjects.id, mediaIds), eq(mediaObjects.state, 'ready')))
          if (readyMedia.length !== mediaIds.length) {
            throw new Error('Every referenced media object must be ready before publication')
          }
          const mimeById = new Map(readyMedia.map((media) => [media.id, media.mimeType]))
          for (const reference of mediaReferences) {
            const mimeType = mimeById.get(reference.mediaId)!
            const actualKind = mimeType.startsWith('image/') ? 'image'
              : mimeType.startsWith('audio/') ? 'audio'
                : mimeType.startsWith('video/') ? 'video' : 'attachment'
            if (actualKind !== reference.kind) {
              throw new Error(`Referenced media kind does not match the ${reference.kind} document block`)
            }
          }
        }
        const [latestVersion] = await transaction
          .select({ versionNumber: max(contentVersions.versionNumber) })
          .from(contentVersions)
          .where(eq(contentVersions.entryId, entry.id))
        const versionNumber = (latestVersion?.versionNumber ?? 0) + 1

        const [version] = await transaction
          .insert(contentVersions)
          .values({
            entryId: entry.id,
            versionNumber,
            slug: entry.slug,
            type: entry.type,
            title: entry.title,
            subtitle: entry.subtitle,
            categoryLabel: entry.categoryLabel,
            summary: entry.summary,
            exposure: entry.exposure,
            document: rendered.document,
            renderedHtml: rendered.html,
            plainText: rendered.plainText,
            createdAt: publishedAt,
          })
          .returning({ id: contentVersions.id })

        if (!version) {
          throw new Error('Publication version insert did not return a row')
        }

        await transaction
          .insert(contentPublications)
          .values({ entryId: entry.id, versionId: version.id, publishedAt })
          .onConflictDoUpdate({
            target: contentPublications.entryId,
            set: { versionId: version.id, publishedAt },
          })

        await transaction
          .update(contentEntries)
          .set({ status: 'published', updatedAt: publishedAt })
          .where(eq(contentEntries.id, entry.id))

        await transaction.delete(contentMedia).where(eq(contentMedia.entryId, entry.id))
        if (mediaIds.length) {
          await transaction.insert(contentMedia).values(mediaIds.map((mediaId, position) => {
            const reference = mediaReferences.find((candidate) => candidate.mediaId === mediaId)!
            return {
              entryId: entry.id,
              mediaId,
              position,
              altText: reference.alt,
              createdAt: publishedAt,
            }
          }))
        }

        return {
          versionId: version.id,
          versionNumber,
          type: entry.type,
          slug: entry.slug,
          projection: projectPublishedVersion({
            type: entry.type,
            slug: entry.slug,
            title: entry.title,
            subtitle: entry.subtitle,
            categoryLabel: entry.categoryLabel,
            summary: entry.summary,
            exposure: entry.exposure,
            renderedHtml: rendered.html,
            publishedAt,
          }),
        }
      })
    },
    async getPublicBySlug(type: 'blog' | 'project' | 'moment' | 'page', slugInput: string) {
      let slug: string
      try {
        slug = normalizeSlug(slugInput)
      } catch {
        return null
      }

      const [version] = await database
        .select({
          type: contentVersions.type,
          slug: contentVersions.slug,
          title: contentVersions.title,
          subtitle: contentVersions.subtitle,
          categoryLabel: contentVersions.categoryLabel,
          summary: contentVersions.summary,
          exposure: contentVersions.exposure,
          renderedHtml: contentVersions.renderedHtml,
          publishedAt: contentPublications.publishedAt,
        })
        .from(contentPublications)
        .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
        .where(and(eq(contentVersions.type, type), eq(contentVersions.slug, slug)))
        .limit(1)

      return version ? projectPublishedVersion(version) : null
    },
    async listPublic(type: 'blog' | 'project' | 'moment' | 'page'): Promise<PublicContentListItem[]> {
      const rows = await database
        .select({
          type: contentVersions.type,
          slug: contentVersions.slug,
          title: contentVersions.title,
          subtitle: contentVersions.subtitle,
          categoryLabel: contentVersions.categoryLabel,
          summary: contentVersions.summary,
          exposure: contentVersions.exposure,
          publishedAt: contentPublications.publishedAt,
        })
        .from(contentPublications)
        .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
        .where(and(eq(contentVersions.type, type), ne(contentVersions.exposure, 'hidden')))
        .orderBy(desc(contentPublications.publishedAt))

      const items: PublicContentListItem[] = []
      for (const row of rows) {
        if (row.exposure === 'hidden') continue
        items.push({
          ...row,
          exposure: row.exposure,
          publishedAt: row.publishedAt.toISOString(),
        })
      }
      return items
    },
    async listTimeline(): Promise<PublicContentListItem[]> {
      const rows = await database
        .select({
          type: contentVersions.type,
          slug: contentVersions.slug,
          title: contentVersions.title,
          subtitle: contentVersions.subtitle,
          categoryLabel: contentVersions.categoryLabel,
          summary: contentVersions.summary,
          exposure: contentVersions.exposure,
          publishedAt: contentPublications.publishedAt,
        })
        .from(contentPublications)
        .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
        .where(ne(contentVersions.exposure, 'hidden'))
        .orderBy(desc(contentPublications.publishedAt))

      const items: PublicContentListItem[] = []
      for (const row of rows) {
        if (row.exposure === 'hidden') continue
        items.push({ ...row, exposure: row.exposure, publishedAt: row.publishedAt.toISOString() })
      }
      return items
    },
    async searchPublic(value: string, limit = 40): Promise<PublicSearchResult[]> {
      const query = normalizePublicSearchQuery(value)
      if (!query) return []
      const metadataMatch = or(
        sql`position(${query} in lower(coalesce(${contentVersions.title}, ''))) > 0`,
        sql`position(${query} in lower(coalesce(${contentVersions.subtitle}, ''))) > 0`,
        sql`position(${query} in lower(coalesce(${contentVersions.categoryLabel}, ''))) > 0`,
        sql`position(${query} in lower(coalesce(${contentVersions.summary}, ''))) > 0`,
      )
      const fullBodyMatch = and(
        eq(contentVersions.exposure, 'full'),
        sql`position(${query} in lower(coalesce(${contentVersions.plainText}, ''))) > 0`,
      )
      const rows = await database
        .select({
          type: contentVersions.type,
          slug: contentVersions.slug,
          title: contentVersions.title,
          subtitle: contentVersions.subtitle,
          categoryLabel: contentVersions.categoryLabel,
          summary: contentVersions.summary,
          exposure: contentVersions.exposure,
          plainText: contentVersions.plainText,
          publishedAt: contentPublications.publishedAt,
        })
        .from(contentPublications)
        .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
        .where(and(ne(contentVersions.exposure, 'hidden'), or(metadataMatch, fullBodyMatch)))
        .orderBy(desc(contentPublications.publishedAt))
        .limit(Math.max(1, Math.min(80, Math.trunc(limit))))

      const results: PublicSearchResult[] = []
      for (const row of rows) {
        if (row.exposure === 'hidden') continue
        results.push({
          type: row.type,
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle,
          categoryLabel: row.categoryLabel,
          summary: row.summary,
          exposure: row.exposure,
          publishedAt: row.publishedAt.toISOString(),
          snippet: buildPublicSearchSnippet({
            exposure: row.exposure,
            summary: row.summary,
            plainText: row.exposure === 'full' ? row.plainText : '',
            query,
          }),
        })
      }
      return results
    },
    async updateDraftSlug(input: { entryId: string; requestedSlug: string }) {
      return database.transaction(async (transaction) => {
        const [entry] = await transaction
          .select({ id: contentEntries.id, slug: contentEntries.slug })
          .from(contentEntries)
          .where(eq(contentEntries.id, input.entryId))
          .limit(1)
          .for('update')

        if (!entry) {
          throw new ContentNotFoundError()
        }

        const [publication] = await transaction
          .select({ entryId: contentPublications.entryId })
          .from(contentPublications)
          .where(eq(contentPublications.entryId, entry.id))
          .limit(1)
        const slug = resolveStableSlug({
          currentSlug: entry.slug,
          requestedSlug: input.requestedSlug,
          hasPublication: Boolean(publication),
        })

        if (slug !== entry.slug) {
          await transaction
            .update(contentEntries)
            .set({ slug, updatedAt: new Date() })
            .where(eq(contentEntries.id, entry.id))
        }

        return slug
      })
    },
  }
}
