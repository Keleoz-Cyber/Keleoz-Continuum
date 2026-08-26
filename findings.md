# Findings & Decisions

## Requirements
- Build Keleoz Continuum in `D:\study\blog\blog_pro` on the existing GitHub repository.
- Use a new public architecture while reusing Desktop and Mobile source behavior and visuals wherever compatible.
- Target a single 4-core/4-GB/3-Mbps Tencent Cloud server; avoid a heavy V1 architecture.
- Start with a durable plan, then an independently runnable foundation and content-publishing slice.
- Do not delete or modify the copied upstream snapshots.
- Do not create many branches/worktrees or run long, repetitive CI during early implementation.
- Project-local pnpm must use the hoisted linker on this Windows host; supported binary architectures are limited to Windows x64 development and Linux x64 deployment.
- pnpm 11 records the narrow build-script approval as `allowBuilds` for `esbuild` and `unrs-resolver`; the obsolete duplicate allowlist was removed.

## Research Findings
- The repository currently contains documentation and immutable upstream snapshots, but no product application code.
- The V1 design baseline splits delivery into eight sub-projects; the first combines engineering foundation, database, authentication, media, and deployment baseline.
- A useful first product slice is Owner login -> draft/edit -> publish -> Guest read, because it exercises security, persistence, rendering, and public/private boundaries together.
- The provenance baseline pins Desktop at `36be81fba7d3bec9ce9c73450d5e951f2d4a5322` and Mobile at `cf9b579803bd9e288c9f48312547a8cb7e5091f4`; ordinary work must not overwrite either snapshot.
- The existing reuse ledger already classifies authentication, the Tiptap editor, exposure enforcement, and server persistence as reimplementation-required, while preserving upstream reading details and visibility semantics through adapters or contracts.
- Upstream license notices and a future public Credits / License surface are product requirements, not optional repository housekeeping.
- The first slice must model `Blog`, `Project`, `Moment`, `Page`, `Media`, and `Collection/Tag` as stable entities, but only needs to expose the Blog workflow initially; Timeline, Archive, and Search derive from published entities.
- Tiptap JSON is the authoritative body format, with generated HTML, plain text, and summaries for reading, search, SEO, and future AI use.
- Exposure is enforced server-side as `Full`, `Summary`, or `Hidden`; Guest Preview must use the same public projection rather than privileged Studio data.
- The publishing transaction is draft autosave -> verified media -> immutable publication version -> derived search/timeline update -> public cache invalidation.
- The runtime constraint remains one Next.js/Node application plus PostgreSQL and object storage; Redis, Elasticsearch, queues, microservices, and Kubernetes are excluded from V1.
- Desktop is concentrated in `InternalBeyond.html` plus `game/game_module.js`; Mobile is concentrated in `index.html` with `ib-sw.js` and PWA assets. Extraction therefore needs symbol-level evidence rather than assuming file boundaries already exist.
- Both snapshots contain substantial Markdown rendering and Blog UI behavior; Mobile explicitly labels a combined Blog list/reader/editor section and includes journal-card, reading-progress, adjacent-navigation, and comment-card styles.
- Mobile's lock screen is a local-device interaction surface and cannot be reused as public Owner authentication, matching the ledger's reimplementation classification.
- Desktop Blog behavior worth preserving includes category/search filtering across title, subtitle, category, and body; title/subtitle/category metadata; dirty-editor exit protection; adjacent-post navigation; reading progress; in-article search; adjustable reading size; and bounded/batched rendering for very long documents.
- Desktop's `locked` post flag demonstrates separation semantics, but its SHA-256 browser hash, six-digit default password, security questions, and IndexedDB checks are explicitly unsuitable for Owner web authentication.
- Existing Markdown rendering preserves paragraph-level anchors for annotations. The new Tiptap renderer should retain stable block identifiers so future annotations and deep links do not require another content migration.
- Old Blog lists intentionally limit preview text rather than inserting an entire long body into every card; the new public list must query and serialize summaries instead of full content.
- Mobile independently preserves the same Blog contracts while adapting them to a native shell: debounced search, compact date-led cards, Markdown-stripped summaries, reading progress, font controls, previous/next navigation, editor statistics, and fullscreen/subpage transitions.
- Desktop and Mobile share `InternalBeyondDB` version 15 and the same 22-store list, including `posts`, `categories`, `uploadedFiles`, `blogAnnotations`, and `blogComments`; this is useful as an import/compatibility contract but not as the public server schema.
- Both snapshots use the same post fields (`id`, `title`, `subtitle`, `category`, `format`, `locked`, `content`, `created`, `updated`) and cross-device backup semantics. The new schema should map these explicitly in a future import adapter without inheriting local-only security assumptions.
- Mobile strips Markdown syntax before generating list previews and debounces full-text filtering; in the new architecture, precomputed plain text and summary fields should replace client-side whole-library scans.
- Local execution prerequisites are available: Node `24.13.1`, npm `11.13.0`, pnpm `11.19.0`, and Docker `29.6.1`; a host `psql` client is absent, so development database commands should execute inside the PostgreSQL container.
- Current registry checks observed Next.js `16.3.3`, React `19.2.8`, Drizzle ORM `0.45.2`, `pg` `8.23.0`, `@node-rs/argon2` `2.1.0`, and Tiptap React `3.30.3`. Direct dependencies are pinned and the generated lockfile remains authoritative.
- Remaining current registry checks observed Tiptap Starter Kit `3.30.3`, Zod `4.4.3`, Vitest `4.1.11`, and Playwright `1.62.1`.
- Node 24 is the appropriate production baseline because it is an active LTS line; the local Node 24 runtime therefore matches the deployment plan.
- Next.js guidance requires authorization at each Server Action/Route Handler and close to the data source. `proxy.ts` may provide only an optimistic cookie check; it must not be treated as the security boundary or perform a database lookup on every prefetched request.
- Tiptap should initialize only in the client editor with `immediatelyRender: false`, while public articles use Tiptap's static renderer from stored JSON so the editor bundle is absent from Guest reading pages.
- Drizzle's `node-postgres` adapter and transactions fit the single PostgreSQL runtime and permit atomic publication/version creation without adding infrastructure.
- Next.js public mutations must authenticate inside every Server Action/Route Handler; Studio layout checks and `proxy.ts` redirects are usability layers only.
- The Tiptap editor is a heavy client-only dependency and should be dynamically loaded only inside Studio. Guest pages receive server-rendered HTML/projection DTOs with no editor state or privileged fields serialized across the RSC boundary.
- Independent queries should run concurrently, but the publish sequence itself must remain one PostgreSQL transaction.
- Next.js 16 cache tags fit the publishing model: public list/detail repository calls use tagged server caches, while publication combines precise tag revalidation with exact-path revalidation for immediate public URLs.
- `@tiptap/static-renderer` `3.30.3` and `sanitize-html` `2.17.7` are available for server-side JSON rendering plus an explicit output allowlist.
- Self-review found several referenced domain types that were named but not defined in the first draft; the plan now defines `ThrottleState`, the Tiptap document tree, `DraftSnapshot`, and `DraftConflictError` before use.
- Public Blog routes are explicitly dynamic at build time while their repository queries remain tagged and cached; this prevents production image builds from requiring a live PostgreSQL connection.
- Installed `@node-rs/argon2` exposes `Algorithm.Argon2id` and the planned `memoryCost`, `timeCost`, `outputLen`, and `parallelism` option names; no compatibility adapter is needed.
- Tiptap 3.30.3 provides `renderToHTMLString` from `@tiptap/static-renderer/pm/html-string`, accepting JSON content plus extensions; StarterKit includes the Link extension.
- Public list queries select only lightweight publication metadata and exclude Hidden at SQL level; detail projection separately strips bodies for Summary and returns null for Hidden.
- Cache wrappers were intentionally deferred until public route consumers existed; they are now implemented and exercised by the `/blog` pages.
- The live browser flow verified `/studio/login` -> authenticated `/studio` -> draft creation -> Tiptap edit -> autosave -> Guest Preview -> publish -> public `/blog/<slug>` on `127.0.0.1:3000`; temporary smoke data was removed afterward.
- The first public Blog shell uses a modest Continuum reader/list treatment, not the final scene-first Home; final visual shell work is intentionally separated into Phase 9.
- Cache wrappers now have real `/blog` and `/blog/[slug]` consumers; public routes are dynamic at build time while tagged repository calls cache only public DTOs.
- Integration tests share one dedicated `continuum_test` database; Vitest file parallelism must remain disabled unless tests move to isolated schemas/databases.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| First detailed plan covers engineering foundation plus one content publishing vertical slice | It produces working software without pulling every V1 subsystem into one risky plan |
| Keep a single Next.js application rather than a workspace/microservice layout | Fits the target server and current product size |
| Introduce explicit adapters at public infrastructure boundaries | Enables local development now and LightCOS/production services later without rewriting domain logic |
| Store an opaque random session token only in the cookie and its SHA-256 hash in PostgreSQL | A database leak does not immediately expose live bearer tokens |
| Keep drafts mutable with optimistic revisions and publication versions immutable | Supports autosave conflicts and preserves the old public version on failed publication |
| Use explicit public projection DTOs | Prevents Hidden content, drafts, password hashes, and other privileged fields from crossing the server boundary |
| Use Next.js cache tags on public content queries | Supports long-lived public caches with precise invalidation after publication |
| Use targeted local verification during implementation and one checkpoint suite per usable milestone | Preserves correctness without turning early development into continuous release testing |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Initial combined document read was truncated | Re-read source documents separately and only then finalize the plan |
| Broad upstream keyword search produced truncated output | Narrow searches to exact Blog, database, visibility, and lock symbols and inspect bounded line ranges |
| The multi-package npm registry query stopped after Tiptap React at the command time limit | Query only the remaining package versions in a smaller request if exact pins are needed |
| Docker daemon probe returned no visible result | Recheck with a bounded `docker version` at execution time; do not assume the daemon is running from CLI presence alone |
| Large self-review patch did not match the plan's Unicode tree context | Split corrections into focused patches against exact surrounding lines |
| Second multi-section consistency patch missed a heading | Stopped multi-section patching and completed the review with one-section edits |
| Default pnpm isolated linker hit Windows `EPERM` on the `uri-js` -> `punycode` symlink | Use project-local hoisted node linker to avoid Windows symlink creation; verify lockfile/package integrity afterward |
| `pnpm --force` with the hoisted linker fetched irrelevant platform binaries | Aborted and replaced it with a manifest-pinned, architecture-limited normal install |
| Current Next.js 16 lint dependencies require ESLint 9 and TypeScript below 6.1 | Prefer peer-compatible ESLint 9 and TypeScript 5.9 over registry-latest major versions |
| pnpm blocked `esbuild` and `unrs-resolver` install scripts | Allow only these named build dependencies; keep all other dependency scripts blocked by default |
| Docker Desktop may take longer than 30 seconds to restore its Linux engine after a host/session transition | Do not block pure-domain work on repeated engine probes; retain unchanged integration tests and retry later |
| A second multi-package registry query returned only the first four packages before the time boundary | Exact observed versions needed by the plan were captured; remaining type/helper packages are lockfile-resolved during execution |
| Initial Task 4 findings patch targeted a sentence that was never present | Located exact Phase 7 and research sections, then appended with small context-specific patches |

## Resources
- `D:\study\blog\blog_pro\AGENTS.md`
- `D:\study\blog\blog_pro\docs\design\Keleoz_Continuum_V1_设计基线_2026-08-26.md`
- `D:\study\blog\blog_pro\docs\SOURCE_PROVENANCE.md`
- `D:\study\blog\blog_pro\docs\SOURCE_REUSE_LEDGER.md`
- `D:\study\blog\blog_pro\upstream\InternalBeyond-Desktop\`
- `D:\study\blog\blog_pro\upstream\InternalBeyond-Mobile\`
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication
- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Drizzle PostgreSQL guide: https://orm.drizzle.team/docs/get-started-postgresql
- Drizzle transactions: https://orm.drizzle.team/docs/transactions
- Tiptap React guide: https://tiptap.dev/docs/editor/getting-started/install/react
- Tiptap static renderer: https://tiptap.dev/docs/editor/api/utilities/static-renderer
- Node.js release status: https://nodejs.org/en/about/previous-releases
- Next.js revalidation guide: https://nextjs.org/docs/app/getting-started/revalidating
- Next.js dynamic-route guide: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

## Visual/Browser Findings
- The approved visual direction is scene-first: fogged window, butterflies, blue light, negative space, and content below the first viewport.
- Mobile should preserve its independent Desk/App Grid/Fullscreen App language rather than shrinking the Desktop Room.

## Phase 9 visual reuse findings (2026-08-27)
- Desktop Home is not a generic gradient: `upstream/InternalBeyond-Desktop/InternalBeyond.html:60-190` defines the preloader, two crossfading background layers, `#bg-overlay`, splash blur/dissolve, mist/fog canvas layers, and the `MIST` / `BRUSH` controls.
- The authoritative blue first-screen image is `upstream/InternalBeyond-Desktop/bg-canvas.png`; it contains the fogged window, butterflies, droplets, blue light and negative space visible in the reference screenshot. `bg-internal.jpg` is a separate light flower scene and should not be used as the Continuum first-screen default.
- Desktop splash markup is concentrated at `InternalBeyond.html:5359-5490`; the useful reusable contract is the left-aligned signature/title/definition hierarchy, splash dissolve, optional mist controls, and a fixed Music mini surface at `:7289`.
- Desktop navigation is a glass bar at `InternalBeyond.html:193-240` with brand, context links, actions and theme controls; Continuum must replace the `IB` / upstream identity while preserving the window-like visual language.
- Mobile Home is a Desk-first shell. `upstream/InternalBeyond-Mobile/index.html:2030-2130` contains the glass topbar/drawer language and `:2453-2570` contains the Desk hero, app matrix, calendar and Music widget; `:3224` begins the bottom dock. The reusable contract is safe-area-aware fullscreen layout, app tiles, page-specific dock, and a drawer—not the local-only lock screen or IndexedDB storage.
