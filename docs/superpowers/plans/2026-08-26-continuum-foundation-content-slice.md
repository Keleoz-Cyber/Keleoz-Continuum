# Continuum Foundation and Content Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable Keleoz Continuum foundation where the single Owner can sign in, create and autosave a structured Blog draft, publish an immutable version, and verify exactly what a Guest can read.

**Architecture:** Use one root-level Next.js 16 App Router application backed by PostgreSQL through Drizzle. Keep mutable drafts separate from immutable publication versions, enforce Owner authorization inside every mutation/data-access boundary, render Tiptap JSON on the server for Guests, and place media behind a storage adapter so local development does not depend on LightCOS credentials.

**Tech Stack:** Node.js 24 LTS, pnpm, Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, PostgreSQL 17, Drizzle ORM 0.45.2 with `pg`, Tiptap 3.30.3, Zod 4.4.3, Argon2id, Vitest 4.1.11, Playwright 1.62.1.

---

## Scope and acceptance boundary

Execution adjustment approved by the user: work in the current checkout without additional worktrees or feature-branch proliferation. The per-task commit commands below are optional grouping hints; use one milestone commit if requested. During early implementation, run focused local tests after behavior changes and one proportional checkpoint suite after Tasks 1-3. Remote CI, the complete Playwright matrix, Docker verification, and pressure testing remain later release gates rather than per-task requirements.

This plan implements one independently testable vertical slice:

```text
Owner bootstrap
  -> /studio/login
  -> create Blog draft
  -> debounced autosave with revision conflict protection
  -> Guest Preview using the public projection
  -> publish immutable version in one database transaction
  -> /blog and /blog/[slug] show only the published projection
```

Included:

- Root single-app engineering foundation and local PostgreSQL.
- One Owner account, Argon2id password, opaque 30-day database sessions, logout, and login throttling.
- Stable content entity boundaries for Blog, Project, Moment, and Page; the UI implements Blog only.
- Tiptap JSON as the authoritative draft/version body, with generated sanitized HTML and plain text.
- `Full`, `Summary`, and `Hidden` Guest projections enforced before data leaves the server.
- Draft autosave, optimistic revisions, immutable versions, stable slug after first publication, and cache invalidation.
- Desktop and mobile-responsive Blog list/reader details derived from both upstream snapshots.
- Storage adapter contract plus local development adapter; LightCOS implementation is deliberately left for the media/deployment subproject.
- Unit, PostgreSQL integration, and Playwright end-to-end evidence.

Excluded from this plan:

- Final Home scene, Room, Tea, Story, Tarot, Wardrobe, Sleep, Music, Letters, Moments feed, Persona review, global search, full media library, LightCOS credentials, Member accounts, email login, AI gateway, domain, ICP, reverse proxy, and production deployment.
- Importing old data; the user confirmed there is no old user data. The legacy post mapping is documented but not executed.
- A final visual redesign. The reader uses restrained Continuum tokens and preserves upstream reading behavior; final Home/Desktop/Mobile shells remain separate subprojects.

## Locked file map

```text
.
├─ compose.dev.yml                         # local PostgreSQL only
├─ Dockerfile                              # standalone production image
├─ .dockerignore                           # build-context exclusions
├─ drizzle.config.ts                       # migration configuration
├─ next.config.ts                          # standalone output
├─ package.json                            # single deployable application
├─ playwright.config.ts                    # browser acceptance
├─ public/.gitkeep                         # keeps the public asset root present
├─ vitest.config.ts                        # unit/integration tests
├─ proxy.ts                                # optimistic Studio cookie redirect only
├─ scripts/
│  └─ create-owner.ts                      # one-time Owner bootstrap
├─ src/
│  ├─ app/
│  │  ├─ api/health/route.ts
│  │  ├─ api/studio/content/[id]/draft/route.ts
│  │  ├─ media/[...key]/route.ts
│  │  ├─ blog/page.tsx
│  │  ├─ blog/[slug]/page.tsx
│  │  ├─ studio/login/page.tsx
│  │  ├─ studio/layout.tsx
│  │  ├─ studio/page.tsx
│  │  ├─ studio/blog/new/page.tsx
│  │  ├─ studio/blog/[id]/page.tsx
│  │  ├─ studio/blog/[id]/preview/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ db/
│  │  ├─ client.ts
│  │  └─ schema/
│  │     ├─ auth.ts
│  │     ├─ content.ts
│  │     ├─ media.ts
│  │     └─ index.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ actions.ts
│  │  │  ├─ crypto.ts
│  │  │  ├─ dal.ts
│  │  │  ├─ repository.ts
│  │  │  ├─ session.ts
│  │  │  └─ throttle.ts
│  │  ├─ content/
│  │  │  ├─ actions.ts
│  │  │  ├─ cache.ts
│  │  │  ├─ document.ts
│  │  │  ├─ dto.ts
│  │  │  ├─ projection.ts
│  │  │  ├─ repository.ts
│  │  │  ├─ schemas.ts
│  │  │  ├─ slug.ts
│  │  │  ├─ blog-list-client.tsx
│  │  │  └─ reading-progress.tsx
│  │  ├─ editor/
│  │  │  ├─ blog-editor-client.tsx
│  │  │  ├─ blog-editor-shell.tsx
│  │  │  └─ use-draft-autosave.ts
│  │  └─ media/
│  │     ├─ local-storage.ts
│  │     └─ storage.ts
│  ├─ shared/
│  │  ├─ env.ts
│  │  └─ same-origin.ts
│  └─ test/
│     ├─ db.ts
│     └─ fixtures.ts
├─ tests/
│  ├─ integration/
│  │  ├─ auth-session.test.ts
│  │  ├─ draft-repository.test.ts
│  │  ├─ draft-route.test.ts
│  │  ├─ schema.test.ts
│  │  └─ publish-repository.test.ts
│  ├─ unit/
│  │  ├─ auth-crypto.test.ts
│  │  ├─ content-document.test.ts
│  │  ├─ content-projection.test.ts
│  │  ├─ env.test.ts
│  │  ├─ login-throttle.test.ts
│  │  └─ local-storage.test.ts
│  └─ e2e/
│     └─ owner-publish-guest-read.spec.ts
└─ var/media/.gitkeep                     # local adapter root; content ignored
```

## Upstream contracts for this slice

Before implementation, keep these source locations open and do not edit them:

- Desktop Blog shell and search: `upstream/InternalBeyond-Desktop/InternalBeyond.html:5490`, `:5520`, `:8208-8209`.
- Desktop post filter/list metadata: `upstream/InternalBeyond-Desktop/InternalBeyond.html:8377`.
- Desktop editor dirty-state and metadata behavior: `upstream/InternalBeyond-Desktop/InternalBeyond.html:8390-8460`.
- Desktop Markdown block/paragraph anchors and batched rendering: `upstream/InternalBeyond-Desktop/InternalBeyond.html:8430-8520`.
- Desktop reader, adjacent navigation, progress, in-article search, and font controls: `upstream/InternalBeyond-Desktop/InternalBeyond.html:8521-8705`.
- Mobile Blog shell/editor markup: `upstream/InternalBeyond-Mobile/index.html:3174-3180`, `:3792-3820`.
- Mobile post cards, Markdown-clean summaries, debounced search, reader progress, and navigation: `upstream/InternalBeyond-Mobile/index.html:12125-12320`.
- Mobile editor metadata/save behavior: `upstream/InternalBeyond-Mobile/index.html:12587-12620`.
- Shared IndexedDB v15 schema and store list: Desktop `:7886-7889`; Mobile `:3868-3875`.

Preserve in this slice:

- Search/list DTOs never carry a full long body.
- Title, subtitle, category, created/updated time, clean summary, and stable reading metadata.
- Dirty-exit protection, debounced saves/search, reading progress, previous/next navigation, adjustable reading size, and paragraph/block identifiers.
- Distinct Desktop and Mobile presentation without duplicating domain logic.

Do not preserve:

- Local six-digit passwords, default passwords, browser SHA-256 password checks, security questions, IndexedDB as public authority, browser-held site secrets, direct client AI calls, or the monolithic global-script lifecycle.

### Task 1: Scaffold the single Next.js application and quality gates

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Verify the immutable source snapshots and execution prerequisites**

Run:

```powershell
git status --short --branch
$expected = @{
  'upstream/InternalBeyond-Desktop/InternalBeyond.html' = '92F8255E6B710FEA150F3F08BC51737442C6CC2F707C3DCB4A64C4AC1FBE8D28'
  'upstream/InternalBeyond-Desktop/game/game_module.js' = 'F64BDA6D07DB4254B18107C2FE54E7CC41237ED35EC0BBFC40AE89AF0314C043'
  'upstream/InternalBeyond-Mobile/index.html' = 'B343CC08AC8E27905CA61C61F0F065B5F3E25D066C29FCE215E88CE064BE531D'
  'upstream/InternalBeyond-Mobile/ib-sw.js' = '5560DFFBF557AFB73D4DFA9A7B0CF0D50204E40806B65F991A8F4D50CF26128D'
}
$expected.GetEnumerator() | ForEach-Object {
  if ((Get-FileHash -LiteralPath $_.Key -Algorithm SHA256).Hash -ne $_.Value) { throw "Upstream hash mismatch: $($_.Key)" }
}
docker version --format '{{.Server.Version}}'
node --version
pnpm --version
```

Expected: `main` tracks `origin/main`; all four hash checks pass without throwing; Docker reports a server version; Node starts with `v24.`; pnpm starts with `11.`. If Docker has no server response, start Docker Desktop and rerun only `docker version`.

- [ ] **Step 2: Create the package manifest and install pinned direct dependencies**

Create `package.json`:

```json
{
  "name": "keleoz-continuum",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.19.0",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "owner:create": "tsx scripts/create-owner.ts",
    "check": "pnpm lint && pnpm typecheck && pnpm test"
  }
}
```

Run:

```powershell
pnpm add next@16.3.3 react@19.2.8 react-dom@19.2.8 drizzle-orm@0.45.2 pg@8.23.0 zod@4.4.3 @node-rs/argon2@2.1.0 @tiptap/core@3.30.3 @tiptap/react@3.30.3 @tiptap/pm@3.30.3 @tiptap/starter-kit@3.30.3 @tiptap/static-renderer@3.30.3 sanitize-html@2.17.7 server-only@0.0.1
pnpm add -D typescript@5.9.3 drizzle-kit@0.31.10 vitest@4.1.11 @playwright/test@1.62.1 tsx eslint@9.39.5 eslint-config-next@16.3.3 @types/node @types/react @types/react-dom @types/pg @types/sanitize-html
```

Expected: `pnpm-lock.yaml` is created and the direct dependency versions match the command.

- [ ] **Step 3: Add strict framework and test configuration**

Create `next.config.ts`:

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
}

export default config
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], restoreMocks: true },
})
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: true },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
})
```

Use strict TypeScript with alias `@/* -> src/*`; use the Next.js flat ESLint configuration without custom rule suppression.

- [ ] **Step 4: Add a minimal brand shell without claiming the final Home design**

Create a server-rendered root layout and a restrained root page containing only:

```tsx
<main className="foundation-home">
  <p className="eyebrow">A Personal Digital Space.</p>
  <h1>Keleoz Continuum</h1>
  <p>一个持续生长的个人数字空间。</p>
  <a href="/blog">Enter the writing</a>
</main>
```

In `globals.css`, define semantic color/font/spacing tokens and reduced-motion handling. Do not copy an upstream logo, Sui name, final butterfly art, card grid, dashboard counters, or large glass panel into this temporary foundation page.

- [ ] **Step 5: Verify the scaffold**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit `0`; build output reports App Router routes and standalone output.

- [ ] **Step 6: Commit**

```powershell
git add package.json pnpm-lock.yaml tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts src/app .gitignore
git commit -m "chore: scaffold Continuum web foundation"
```

### Task 2: Establish validated environment and local PostgreSQL

**Files:**
- Create: `compose.dev.yml`
- Create: `.env.example`
- Create: `src/shared/env.ts`
- Create: `tests/unit/env.test.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Write the failing environment-contract test**

```ts
import { describe, expect, it } from 'vitest'
import { parseServerEnv } from '@/shared/env'

describe('parseServerEnv', () => {
  it('rejects a short session secret', () => {
    expect(() => parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://continuum:continuum@127.0.0.1:55432/continuum',
      SESSION_SECRET: 'short',
      SITE_ORIGIN: 'http://127.0.0.1:3000',
      MEDIA_DRIVER: 'local',
      MEDIA_LOCAL_ROOT: './var/media',
    })).toThrow('SESSION_SECRET')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run tests/unit/env.test.ts`

Expected: FAIL because `@/shared/env` does not exist.

- [ ] **Step 3: Implement the environment contract**

`parseServerEnv` must validate `NODE_ENV`, `DATABASE_URL`, a minimum 32-character `SESSION_SECRET`, an absolute `SITE_ORIGIN`, `MEDIA_DRIVER=local|lightcos`, and the local media root. Export a parsed `serverEnv` only from a `server-only` module. `.env.example` contains inert examples and no usable credential.

Use this exact public type:

```ts
export type ServerEnv = {
  NODE_ENV: 'development' | 'test' | 'production'
  DATABASE_URL: string
  SESSION_SECRET: string
  SITE_ORIGIN: string
  MEDIA_DRIVER: 'local' | 'lightcos'
  MEDIA_LOCAL_ROOT: string
}

export function parseServerEnv(source: NodeJS.ProcessEnv): ServerEnv
```

- [ ] **Step 4: Add the local database service**

Create `compose.dev.yml` with one `postgres:17-alpine` service named `continuum-db`, port `55432:5432`, database/user/password `continuum`, a named volume, and a `pg_isready` healthcheck. Do not add Redis, a queue, an object-store emulator, or the Next.js app to this development compose file.

Run:

```powershell
docker compose -f compose.dev.yml up -d
docker compose -f compose.dev.yml exec -T continuum-db pg_isready -U continuum -d continuum
```

Expected: `accepting connections`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm vitest run tests/unit/env.test.ts`

Expected: PASS.

```powershell
git add compose.dev.yml .env.example drizzle.config.ts src/shared/env.ts tests/unit/env.test.ts
git commit -m "chore: add validated local database environment"
```

### Task 3: Create the public-safe database schema

**Files:**
- Create: `src/db/client.ts`
- Create: `src/db/schema/auth.ts`
- Create: `src/db/schema/content.ts`
- Create: `src/db/schema/media.ts`
- Create: `src/db/schema/index.ts`
- Create: `src/test/db.ts`
- Create: `tests/integration/schema.test.ts`
- Create: `drizzle/0000_*.sql` through `pnpm db:generate`

- [ ] **Step 1: Write the failing schema integration test**

The test resets the test database, runs migrations, and asserts these tables exist:

```ts
expect(tableNames).toEqual(expect.arrayContaining([
  'owners', 'sessions', 'login_throttles',
  'content_entries', 'content_versions', 'content_publications',
  'media_objects',
]))
```

It also attempts duplicate usernames, duplicate slugs, and duplicate `(entry_id, version_number)` values and expects PostgreSQL unique-constraint failures.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run tests/integration/schema.test.ts`

Expected: FAIL because no schema or migrations exist.

- [ ] **Step 3: Define the schema with explicit boundaries**

Use PostgreSQL UUID primary keys and timezone-aware timestamps. Define:

```ts
export const contentType = pgEnum('content_type', ['blog', 'project', 'moment', 'page'])
export const contentStatus = pgEnum('content_status', ['draft', 'published', 'archived'])
export const exposure = pgEnum('exposure', ['full', 'summary', 'hidden'])
export const mediaState = pgEnum('media_state', ['pending', 'ready', 'failed'])
```

`content_entries` owns mutable draft metadata and body:

```ts
{
  id: uuid primary key,
  type: contentType not null,
  slug: varchar(160) unique not null,
  title: varchar(240) not null,
  subtitle: varchar(320),
  categoryLabel: varchar(120),
  summary: text not null default '',
  exposure: exposure not null default 'full',
  status: contentStatus not null default 'draft',
  draftDocument: jsonb not null,
  draftHtml: text not null,
  draftPlainText: text not null,
  draftRevision: integer not null default 1,
  createdAt: timestamptz not null default now,
  updatedAt: timestamptz not null default now
}
```

`content_versions` stores immutable snapshots with `entryId`, `versionNumber`, title, subtitle, `categoryLabel`, summary, exposure, JSON, sanitized HTML, plain text, and `createdAt`. `content_publications` has one row per entry and points to exactly one version. `media_objects` stores metadata and a storage key, never binary content. Collection/Tag relations belong to the later public-content subproject; `categoryLabel` preserves the current Blog contract without inventing that relation model prematurely.

- [ ] **Step 4: Generate, inspect, and apply the migration**

Run:

```powershell
pnpm db:generate
pnpm db:migrate
docker compose -f compose.dev.yml exec -T continuum-db psql -U continuum -d continuum -c "\dt"
```

Expected: all seven application tables are listed.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm vitest run tests/integration/schema.test.ts`

Expected: PASS with the unique constraints enforced by PostgreSQL.

```powershell
git add drizzle.config.ts drizzle src/db src/test tests/integration/schema.test.ts
git commit -m "feat: add Continuum persistence schema"
```

### Task 4: Implement single-Owner password, sessions, and throttling

**Files:**
- Create: `src/modules/auth/crypto.ts`
- Create: `src/modules/auth/session.ts`
- Create: `src/modules/auth/throttle.ts`
- Create: `tests/unit/auth-crypto.test.ts`
- Create: `tests/unit/login-throttle.test.ts`
- Create: `tests/integration/auth-session.test.ts`
- Create: `scripts/create-owner.ts`

- [ ] **Step 1: Write failing crypto and throttle tests**

```ts
it('verifies the right password and rejects the wrong password', async () => {
  const hash = await hashPassword('a-long-owner-password')
  await expect(verifyPassword(hash, 'a-long-owner-password')).resolves.toBe(true)
  await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false)
})

it('stores only a hash of the bearer token', () => {
  const session = createSessionMaterial()
  expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/)
  expect(session.tokenHash).not.toContain(session.token)
})

it('blocks the sixth failed attempt for fifteen minutes', () => {
  const state = applyFailedAttempt({ failures: 5, blockedUntil: null }, now)
  expect(state.blockedUntil?.getTime()).toBe(now.getTime() + 15 * 60_000)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm vitest run tests/unit/auth-crypto.test.ts tests/unit/login-throttle.test.ts`

Expected: FAIL because auth modules do not exist.

- [ ] **Step 3: Implement pure auth primitives**

Use `@node-rs/argon2` with Argon2id, memory cost `19_456`, time cost `2`, parallelism `1`, and output length `32`. Generate the session token with `randomBytes(32).toString('base64url')`; store `createHash('sha256').update(token).digest('hex')`. Use constant-time library verification and never log a password or bearer token.

Expose:

```ts
export type ThrottleState = { failures: number; blockedUntil: Date | null }
export async function hashPassword(password: string): Promise<string>
export async function verifyPassword(hash: string, password: string): Promise<boolean>
export function createSessionMaterial(): { token: string; tokenHash: string }
export function applyFailedAttempt(state: ThrottleState, now: Date): ThrottleState
```

- [ ] **Step 4: Write and run the session integration test**

The test creates one Owner, creates a 30-day session row from a token hash, resolves the Owner using the raw token, expires the row, and then expects resolution to return `null`. Run it once before repository implementation and confirm RED because session persistence is absent.

- [ ] **Step 5: Implement Owner bootstrap and session persistence**

`scripts/create-owner.ts` reads `CONTINUUM_OWNER_USERNAME` and `CONTINUUM_OWNER_PASSWORD`, normalizes the username to lowercase, rejects passwords under 8 characters (updated by explicit Owner request on 2026-09-07), refuses to create a second Owner, hashes the password, inserts the account, and prints only the created username. It never stores the bootstrap password in `.env.example`.

Session cookies use:

```ts
{
  name: 'continuum_session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}
```

- [ ] **Step 6: Verify GREEN and commit**

Run:

```powershell
pnpm vitest run tests/unit/auth-crypto.test.ts tests/unit/login-throttle.test.ts tests/integration/auth-session.test.ts
```

Expected: all auth tests PASS.

```powershell
git add src/modules/auth scripts/create-owner.ts tests/unit/auth-crypto.test.ts tests/unit/login-throttle.test.ts tests/integration/auth-session.test.ts
git commit -m "feat: add secure single-owner sessions"
```

### Task 5: Define structured documents and Guest projections

**Files:**
- Create: `src/modules/content/schemas.ts`
- Create: `src/modules/content/document.ts`
- Create: `src/modules/content/dto.ts`
- Create: `src/modules/content/projection.ts`
- Create: `src/modules/content/slug.ts`
- Create: `tests/unit/content-document.test.ts`
- Create: `tests/unit/content-projection.test.ts`

- [ ] **Step 1: Write failing document tests**

Use this fixture:

```ts
const document = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2, blockId: 'arrival' }, content: [{ type: 'text', text: 'Arrival' }] },
    { type: 'paragraph', attrs: { blockId: 'p-1' }, content: [{ type: 'text', text: 'First light.' }] },
  ],
}
```

Assert that rendering returns sanitized HTML containing `data-block-id="arrival"`, plain text `Arrival\nFirst light.`, and no script/event attribute when hostile attributes are supplied. Assert slug normalization produces `first-light`, rejects an empty slug, and never changes a published slug silently.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run tests/unit/content-document.test.ts`

Expected: FAIL because document rendering and slug functions are missing.

- [ ] **Step 3: Implement the shared Tiptap contract**

Define one extension factory used by both the editor and static renderer. Permit StarterKit nodes only in this slice; raw HTML is not enabled. Add a `blockId` global attribute to block nodes, generate missing IDs on the editor side, and preserve them through JSON and HTML. Render on the server with `@tiptap/static-renderer`, then sanitize with an explicit allowlist for headings, paragraphs, lists, task lists, blockquotes, code/pre, marks, links, and `data-block-id`. Permit only `http`, `https`, and `mailto` link schemes.

Define the shared document and draft types before later tasks use them:

```ts
export type TiptapMark = { type: string; attrs?: Record<string, unknown> }
export type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}
export type TiptapDocument = TiptapNode & { type: 'doc' }
export type DraftSnapshot = {
  title: string
  subtitle: string | null
  categoryLabel: string | null
  summary: string
  exposure: 'full' | 'summary' | 'hidden'
  document: TiptapDocument
}
export type RenderedDocument = { document: TiptapDocument; html: string; plainText: string }
export function parseAndRenderDocument(input: unknown): RenderedDocument
export function normalizeSlug(input: string): string
```

- [ ] **Step 4: Write failing projection tests for all exposure values**

```ts
expect(projectPublishedVersion(fullVersion)).toMatchObject({ bodyHtml: expect.stringContaining('First light') })
expect(projectPublishedVersion(summaryVersion)).toEqual(expect.objectContaining({ bodyHtml: null, summary: 'Public summary' }))
expect(projectPublishedVersion(hiddenVersion)).toBeNull()
```

Also assert the returned DTO has no `document`, `plainText`, `entryId`, draft field, or database-only field.

- [ ] **Step 5: Implement and verify projections**

Define a discriminated public DTO:

```ts
export type PublicContentDto = {
  type: 'blog' | 'project' | 'moment' | 'page'
  slug: string
  title: string
  subtitle: string | null
  categoryLabel: string | null
  summary: string
  exposure: 'full' | 'summary'
  bodyHtml: string | null
  publishedAt: string
}
```

Run: `pnpm vitest run tests/unit/content-document.test.ts tests/unit/content-projection.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/modules/content tests/unit/content-document.test.ts tests/unit/content-projection.test.ts
git commit -m "feat: define structured content projections"
```

### Task 6: Implement conflict-safe drafts and atomic publication

**Files:**
- Create: `src/modules/content/repository.ts`
- Create: `src/modules/content/cache.ts`
- Create: `tests/integration/draft-repository.test.ts`
- Create: `tests/integration/publish-repository.test.ts`

- [ ] **Step 1: Write and verify failing draft tests**

Test these behaviors against PostgreSQL:

```text
createDraft -> revision 1
saveDraft(expectedRevision=1) -> revision 2
saveDraft(expectedRevision=1) again -> DraftConflictError(currentRevision=2)
listStudioDrafts -> metadata only, not draftDocument/draftHtml
```

Run: `pnpm vitest run tests/integration/draft-repository.test.ts`

Expected: FAIL because the repository is missing.

- [ ] **Step 2: Implement draft persistence with a compare-and-swap update**

Use one SQL update shaped as:

```sql
UPDATE content_entries
SET title = $1,
    subtitle = $2,
    category_label = $3,
    summary = $4,
    exposure = $5,
    draft_document = $6,
    draft_html = $7,
    draft_plain_text = $8,
    draft_revision = draft_revision + 1,
    updated_at = now()
WHERE id = $9 AND draft_revision = $10
RETURNING draft_revision;
```

Zero returned rows throws this domain error and becomes a `409` only at the HTTP boundary:

```ts
export class DraftConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super('Draft revision conflict')
    this.name = 'DraftConflictError'
  }
}
```

- [ ] **Step 3: Write and verify failing publication tests**

Test that publication:

- creates version 1 and a publication pointer;
- creates version 2 on republish without mutating version 1;
- preserves the previous publication pointer when rendering or insertion fails;
- locks the slug after first publication;
- returns no Guest DTO for Hidden;
- returns summary without body for Summary;
- returns the sanitized body for Full.

Run: `pnpm vitest run tests/integration/publish-repository.test.ts`

Expected: FAIL because publication is missing.

- [ ] **Step 4: Implement publication in one transaction**

The transaction must:

```text
1. SELECT the entry FOR UPDATE.
2. Validate and render the draft document before changing the public pointer.
3. Calculate next version_number from the locked entry.
4. INSERT an immutable content_versions snapshot.
5. INSERT ... ON CONFLICT(entry_id) DO UPDATE the content_publications pointer.
6. Mark the entry published and preserve its first-published slug.
7. Commit.
```

Do not delete old versions during publication. Do not update the public pointer before the version insert succeeds.

- [ ] **Step 5: Add tagged public queries and verify GREEN**

Wrap public list/detail repository queries with `unstable_cache`. Tag list queries with `content:blog`; tag details with both `content:blog` and `content:blog:<slug>`. Public queries select only publication snapshot columns needed by `PublicContentDto`. Do not select draft JSON or Owner fields.

Run:

```powershell
pnpm vitest run tests/integration/draft-repository.test.ts tests/integration/publish-repository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/modules/content/repository.ts src/modules/content/cache.ts tests/integration/draft-repository.test.ts tests/integration/publish-repository.test.ts
git commit -m "feat: add versioned content publishing"
```

### Task 7: Add Owner login and secure Studio boundaries

**Files:**
- Create: `src/modules/auth/repository.ts`
- Create: `src/modules/auth/dal.ts`
- Create: `src/modules/auth/actions.ts`
- Create: `src/shared/same-origin.ts`
- Create: `proxy.ts`
- Create: `src/app/studio/login/page.tsx`
- Create: `src/app/studio/layout.tsx`
- Create: `src/app/studio/page.tsx`

- [ ] **Step 1: Add one test Owner through the bootstrap command**

Run in PowerShell without writing the password to a tracked file:

```powershell
$env:CONTINUUM_OWNER_USERNAME='keleoz'
$env:CONTINUUM_OWNER_PASSWORD='continuum-local-owner-password'
pnpm owner:create
Remove-Item Env:CONTINUUM_OWNER_USERNAME
Remove-Item Env:CONTINUUM_OWNER_PASSWORD
```

Expected: the command prints that Owner `keleoz` was created and a second run refuses to add another Owner.

- [ ] **Step 2: Implement authenticated actions and DAL checks**

Every mutation begins with an internal authorization call:

```ts
export async function requireOwner(): Promise<{ id: string; username: string }> {
  const token = (await cookies()).get('continuum_session')?.value
  if (!token) redirect('/studio/login')
  const owner = await resolveActiveSession(token)
  if (!owner) redirect('/studio/login')
  return owner
}
```

`loginAction` validates Zod input, checks the DB-backed throttle before Argon2 work, adds a fixed minimum response duration plus bounded jitter on failure, resets the throttle on success, creates the session, and redirects to `/studio`. `logoutAction` deletes the database session before clearing the cookie.

- [ ] **Step 3: Add optimistic route handling without treating it as authorization**

`proxy.ts` checks only whether `continuum_session` is present to redirect obvious unauthenticated `/studio/*` requests. It excludes `/studio/login`, `_next`, and static assets. It performs no database query. `studio/layout.tsx`, every Server Action, and every Studio Route Handler still call `requireOwner()`.

- [ ] **Step 4: Build the restrained Studio login and overview**

The login page contains username, password, an accessible error region, and no Member/signup/email controls. The Studio overview contains only working links to Blog drafts and logout; do not add disabled Room/AI/Letters navigation.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
pnpm test
pnpm lint
pnpm typecheck
```

Expected: all commands PASS.

```powershell
git add proxy.ts src/modules/auth src/shared/same-origin.ts src/app/studio
git commit -m "feat: protect the Owner Studio"
```

### Task 8: Add the dynamically loaded Tiptap editor and revisioned autosave

**Files:**
- Create: `src/modules/content/actions.ts`
- Create: `src/modules/editor/blog-editor-client.tsx`
- Create: `src/modules/editor/blog-editor-shell.tsx`
- Create: `src/modules/editor/use-draft-autosave.ts`
- Create: `src/app/api/studio/content/[id]/draft/route.ts`
- Create: `src/app/studio/blog/new/page.tsx`
- Create: `src/app/studio/blog/[id]/page.tsx`
- Create: `src/app/studio/blog/[id]/preview/page.tsx`
- Create: `tests/integration/draft-route.test.ts`

- [ ] **Step 1: Write a failing Route Handler integration test**

Call the autosave handler with a valid Owner cookie and `expectedRevision: 1`; expect `200` with revision 2. Repeat revision 1; expect `409` with `{ code: 'draft_conflict', currentRevision: 2 }`. Call without a session; expect `401` or redirect according to the shared handler policy.

Run: `pnpm vitest run tests/integration/draft-route.test.ts`

Expected: FAIL because the route does not exist.

- [ ] **Step 2: Implement the authenticated same-origin autosave route**

The Route Handler verifies Owner session, checks `Origin` against the configured site origin when present, validates the request body, renders/sanitizes the JSON, and calls compare-and-swap persistence. It returns only `{ revision, savedAt }`; it never returns the full stored draft.

- [ ] **Step 3: Implement the editor as an isolated client bundle**

`blog-editor-shell.tsx` uses `next/dynamic` with `ssr: false` to load `blog-editor-client.tsx`. The editor config sets `immediatelyRender: false`, uses the shared extension list, and emits JSON only. The Server Component passes only initial draft fields required by the editor.

The autosave hook:

```ts
export type AutosaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'conflict' | 'error'

export function useDraftAutosave(input: {
  entryId: string
  initialRevision: number
  snapshot: DraftSnapshot
  delayMs?: number
}): { state: AutosaveState; revision: number; retry(): void }
```

Use a 900 ms debounce, one in-flight save at a time, `AbortController` only for obsolete unsent requests, and explicit conflict UI. Never silently overwrite a newer revision. Register `beforeunload` only while dirty/saving/conflicted, preserving the upstream dirty-exit contract.

- [ ] **Step 4: Implement create, preview, and publish actions**

`createBlogDraftAction` creates an empty Tiptap doc and redirects to the editor. `publishBlogAction` calls `requireOwner()`, publishes transactionally, calls `revalidateTag('content:blog', 'max')`, `revalidateTag('content:blog:<slug>', 'max')`, `revalidatePath('/blog')`, and `revalidatePath('/blog/<slug>')`, then redirects to the public URL. Guest Preview calls the same projection function used by public pages; for Hidden it renders “Guest receives 404” rather than privileged content.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
pnpm vitest run tests/integration/draft-route.test.ts
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands PASS; the public route build output does not include the Tiptap editor chunk in its client dependency graph.

```powershell
git add src/modules/editor src/modules/content/actions.ts src/app/api/studio src/app/studio/blog tests/integration/draft-route.test.ts
git commit -m "feat: add autosaving Blog editor"
```

### Task 9: Build the public Blog list and reader from public DTOs

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/modules/content/blog-list-client.tsx`
- Create: `src/modules/content/reading-progress.tsx`

- [ ] **Step 1: Implement public server pages with no privileged serialization**

Both public route files export `const dynamic = 'force-dynamic'` so a container build never requires a live database; tagged repository calls still cache public data across requests. `/blog` queries list DTOs containing title, subtitle, category label, clean summary, slug, exposure, and published time only. A small `blog-list-client.tsx` filters only these DTOs across title, subtitle, category label, and summary after a 160 ms debounce; it never receives body HTML or document JSON. `/blog/[slug]` awaits `params`, resolves a public DTO, and calls `notFound()` for Hidden, missing, or unpublished entries. Summary pages render the Owner-written summary and a quiet “完整内容未公开” note; they never request or receive the full body.

- [ ] **Step 2: Preserve the proven reading contracts**

Desktop reader:

- restrained centered reading column;
- title/subtitle/date/category metadata;
- previous/next navigation in publication order;
- reading-progress rail;
- small/medium/large reading-size control;
- stable `data-block-id` anchors.

Mobile reader:

- date-led compact list entries;
- native-feeling full-page reader and back navigation;
- safe-area padding;
- 160 ms debounced list filtering over the small public DTO set;
- no Desktop floating-window geometry.

Do not port Owner edit/delete/comment buttons to Guest pages. The V1 comment affordance may display the approved members-only message and a working link to `/letters` only after Letters exists; until then omit the control rather than link to a dead route.

- [ ] **Step 3: Add metadata and accessibility**

Generate canonical title/description from the public DTO. Sanitized HTML headings retain a logical order. Reading controls have labels; focus rings are visible; `prefers-reduced-motion` disables progress animation; no text is encoded only by translucency.

- [ ] **Step 4: Verify public separation manually**

Run `pnpm dev`, then inspect:

```text
/blog                    published Full and Summary only
/blog/<full-slug>        full body visible
/blog/<summary-slug>     summary visible, full body absent from HTML/RSC payload
/blog/<hidden-slug>      404
/studio                  redirects without a valid DB session
```

Use browser devtools Network response search to confirm a distinctive sentence from Summary/Hidden draft bodies is absent.

- [ ] **Step 5: Commit**

```powershell
git add src/app/blog src/app/globals.css src/modules/content/blog-list-client.tsx src/modules/content/reading-progress.tsx
git commit -m "feat: publish the public Blog reader"
```

### Task 10: Establish the media adapter without pretending LightCOS is integrated

**Files:**
- Create: `src/modules/media/storage.ts`
- Create: `src/modules/media/local-storage.ts`
- Create: `src/app/media/[...key]/route.ts`
- Create: `tests/unit/local-storage.test.ts`
- Create: `var/media/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing adapter contract test**

```ts
it('stores bytes under a generated key and never trusts the original filename', async () => {
  const result = await storage.put({
    bytes: Buffer.from('image'),
    mimeType: 'image/png',
    originalName: '../../avatar.png',
  })
  expect(result.key).toMatch(/^media\/[a-f0-9-]+\.png$/)
  expect(result.key).not.toContain('..')
})
```

Also assert rejection of disallowed MIME types and oversize input before any file is written.

- [ ] **Step 2: Verify RED and implement the interface**

Run: `pnpm vitest run tests/unit/local-storage.test.ts`

Expected: FAIL because the adapter is absent.

Use:

```ts
export type StoredObject = { key: string; byteSize: number; mimeType: string }

export interface MediaStorage {
  put(input: { bytes: Buffer; mimeType: string; originalName: string }): Promise<StoredObject>
  delete(key: string): Promise<void>
  publicUrl(key: string): string
}
```

The local adapter resolves and verifies every final path remains under `MEDIA_LOCAL_ROOT`, creates only required subdirectories, uses random UUID keys, and accepts only internally verified PNG/JPEG/WebP/AVIF declarations up to 10 MiB for this slice. The later upload subproject owns magic-byte inspection before calling this adapter. `publicUrl()` returns `SITE_ORIGIN` plus `/media/<key>`. The development media Route Handler repeats the containment check before streaming a file and returns `404` for traversal, unknown keys, and missing files. A LightCOS class is not created until real endpoint/bucket/domain details exist.

- [ ] **Step 3: Verify GREEN and commit**

Run: `pnpm vitest run tests/unit/local-storage.test.ts`

Expected: PASS and the test removes its own temporary directory.

```powershell
git add src/modules/media tests/unit/local-storage.test.ts var/media/.gitkeep .gitignore
git commit -m "feat: define the media storage boundary"
```

### Task 11: Prove the full Owner-to-Guest flow and production build baseline

**Files:**
- Create: `tests/e2e/owner-publish-guest-read.spec.ts`
- Create: `src/app/api/health/route.ts`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: `README.md`

- [ ] **Step 1: Write the failing end-to-end test**

The Playwright test must:

```text
1. Open /studio and observe redirect to /studio/login.
2. Log in as the seeded test Owner.
3. Create a Blog draft titled “First Light”.
4. Enter a distinctive body sentence and wait for Saved.
5. Open Guest Preview and confirm Full displays the body.
6. Change to Summary and confirm preview omits the body but shows the summary.
7. Publish, open /blog/first-light in a fresh context, and confirm the same Summary projection.
8. Change to Hidden, republish, and confirm a fresh Guest request receives 404.
9. Repeat on desktop and mobile Chromium projects.
```

Run: `pnpm test:e2e`

Expected: FAIL before remaining wiring and fixtures are complete.

- [ ] **Step 2: Add deterministic test setup and health endpoint**

The test setup resets only the dedicated test database, creates one Owner, and never touches development data. `/api/health` returns `200` with `{ status: 'ok' }` after a bounded `SELECT 1`; it returns `503` with `{ status: 'degraded' }` and no stack/connection string if PostgreSQL is unavailable.

- [ ] **Step 3: Add a multi-stage standalone production image**

Use Node 24 Alpine stages for dependencies, build, and runner. Copy only `.next/standalone`, `.next/static`, and `public`; run as a non-root user; expose `3000`; do not include `upstream/`, `.git/`, tests, local media content, or development secrets in the runtime image.

- [ ] **Step 4: Run the complete verification matrix**

Run:

```powershell
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
docker build -t keleoz-continuum:foundation .
docker run --rm keleoz-continuum:foundation node --version
git diff --check
git status --short
```

Expected:

- lint, typecheck, unit, integration, build, and both Playwright projects PASS;
- the image builds and reports Node 24;
- `git diff --check` prints nothing;
- only intended first-slice files are modified/untracked;
- neither upstream snapshot has a diff.

- [ ] **Step 5: Update evidence and commit**

Update `README.md` with exact local startup, Owner bootstrap, migration, test, and build commands. Add test evidence and implemented source symbols to `docs/SOURCE_REUSE_LEDGER.md`; do not change the provenance hashes.

```powershell
git add Dockerfile .dockerignore README.md src/app/api/health tests/e2e docs/SOURCE_REUSE_LEDGER.md
git commit -m "test: verify Owner publishing boundary"
```

## Final acceptance checklist

- [ ] `upstream/InternalBeyond-Desktop/` and `upstream/InternalBeyond-Mobile/` remain byte-for-byte unchanged.
- [ ] A second Owner cannot be created through normal bootstrap.
- [ ] Owner password and raw session token never appear in PostgreSQL, logs, or client payloads.
- [ ] Every Studio mutation and Route Handler authenticates internally.
- [ ] Draft autosave conflicts produce `409` and never overwrite silently.
- [ ] Publishing creates a new immutable version and swaps the public pointer atomically.
- [ ] A failed publish leaves the previous public version readable.
- [ ] Full, Summary, and Hidden projections pass unit, integration, and browser tests.
- [ ] Summary and Hidden bodies are absent from Guest HTML and RSC responses.
- [ ] Tiptap editor code is loaded only in Studio.
- [ ] Desktop and Mobile Blog reading retain their upstream-native interaction strengths.
- [ ] The app builds as one standalone Node process and does not require Redis, Elasticsearch, queues, or a microservice.
- [ ] LightCOS remains an explicit adapter target, not a fake or hard-coded local implementation.

## Execution checkpoints

Stop for review after:

1. Tasks 1-3: scaffold and schema are green.
2. Tasks 4-6: security and publication domain are green.
3. Tasks 7-9: usable Owner/Guest vertical slice is green.
4. Tasks 10-11: media boundary, browser evidence, and production build are green.

Do not start the Room or final Home visual extraction inside this plan. Their reuse contracts and visual QA require separate plans after this foundation is accepted.
