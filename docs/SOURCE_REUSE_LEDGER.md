# Source Reuse Ledger

This ledger is a required implementation gate. Update source pointers and evidence as modules are extracted or adapted.

## Pre-deployment delivery and recovery adapters — 2026-09-07

- **Public security filing — 2026-10-02:** adds the user-supplied `皖公网安备34020702000816号` alongside the retained ICP notice in the compact Home footer, linking to `https://beian.mps.gov.cn/#/query/webSearch?code=34020702000816`. The official supplied badge `logo01.6189a29f.png` is copied byte-for-byte to `public/images/public-security-filing.png` and served locally. This public-hosting notice has no offline-source equivalent. Original attribution/license links and source snapshots remain intact.

- **Visible upstream attribution — 2026-10-02:** restores the upstream identity and links as three small Home footer lines: Internal Beyond, Sui-IB, Desktop/Mobile repositories, PolyForm Noncommercial 1.0.0, CC BY-NC-SA 4.0 and the retained copyright/ICP notice. Source pointers: Desktop `LICENSE`, Mobile `LICENSE` / `COPYRIGHT.md`, and `NOTICE.md`. This is a public-hosting attribution adapter following the author's request and the user's preference for a compact corner notice. License snapshots and the original scene remain unchanged; no separate Credits page or dialog was introduced.

- **Local history + continuous native music — 2026-09-08:** `/history` reads only validated Tea/Story/Tarot transcript records from the existing `keleoz-continuum-guest` / `experience-state` store. Reuses original Blog list/reader CSS and supports filters, search, text viewing, one-record TXT and all-record JSON exports; no upload/delete/import or game-resume claim, and Room state is excluded. A shared client-layout host keeps the actual original Home iframe/audio instance across supported internal routes and browser Back. Off-Home music opens the same source Desktop panel / Mobile app, not a replacement audio engine. Source navigation is adapted only in static bridge scripts; API/download/external/modified links retain their boundaries. Editor saves are awaited on explicit navigation and guarded Back/Forward; failed saves retain the editor, including native fragment history. Hard reload/tab close still end playback; changed published scene configuration is explicitly applied so it cannot silently interrupt music. Runtime tests use isolated browser audio/history fixtures; local temporary draft tests cover both editor engines and are never published. Desktop/Mobile source snapshots and scene rendering parameters remain unchanged.

- **Desktop/mobile regression — 2026-09-08:** checked 20 public/guarded route visits across 1440px and 390px, Home entry/player, Mobile theme switching, Letters compose/open/close and Desktop Room startup; no observed page exceptions or horizontal overflow. Anonymous Chat/Memory/Studio correctly redirected to login. Local Owner checks opened Studio, native Chat, Memory and the native new-entry editor at both widths without publishing content or making AI calls. The isolated suite passed 97 files / 401 tests before the correction, plus the new Room entry contract afterward. Screenshots exposed an obsolete, low-contrast Mobile Room notice: it now reuses the public `module-intro`, background/veil and buttons and links to existing Mobile Tea/Story/Tarot/Character routes (upstream Mobile Desk/app surfaces), rather than promising future availability. Desktop Room runtime/art remains unchanged. Real-device Wi-Fi/mobile-data validation and production content publication remain outside this browser-simulation pass.

- **Mobile startup latency — 2026-09-08:** public-only adapter now replaces the Mobile splash controller's final RAF startup (`index.html:1974–2023`) with a one-shot `continuum:home-ready` cleanup listener and clears its animation timers. The original cleanup is reused; the hidden 5.2-second minimum and progress-tail wait no longer gate public Home. The parent still requires its patch and published configuration before dispatching readiness and retaining the .72-second outer fade. Desktop timing, all scene assets, raw snapshots and Owner documents remain unchanged. Mobile public shell responses reuse content SHA-256 ETags, browser revalidation and bounded 300-second shared caching; the shell has no user/site data and published settings still arrive through the uncached parent. Route tests cover 304, stale tags, cookie invariance and raw-byte preservation. Live Chrome mobile-emulation checks measured cold 4.05s / 1.70s and warm reload 1.49s, with no second loader, early exit or node replacement; drawer interaction passed. EdgeOne returned HIT and conditional 304 with an empty body; private records remained 401/MISS and Studio redirected to login with private/no-store. These are local-network browser-emulation observations, not real-device/4G guarantees.

- **Home loading feedback — 2026-09-08 (continuity correction):** reuse the Mobile splash thin rounded gradient track (`index.html:1851–2023`) in one persistent outer loading layer. Public-only adapters hide Desktop `#preloader` and Mobile `#ib-splash` presentation while preserving their controllers/timing. The outer layer waits for the public patch, published scene configuration and native exit signal, then fades directly into the scene (Desktop 1.2s / Mobile .72s; reduced motion skips the fade). It no longer disappears on iframe load and reveals a second loader. Retry after a prolonged load remains; no artificial percentage or additional minimum delay. Resolve the responsive surface before creating its iframe. Raw snapshots, Owner source documents, visual assets, Canvas parameters and Enter transitions remain unchanged. Focused tests plus fresh-context browser sampling cover Desktop, Mobile emulation, delayed navigation/retry and reduced motion; native loader visibility, premature exit and outer node replacement are checked throughout startup.

- **EdgeOne trusted client IP — 2026-09-08:** server security adapter required for public deployment; offline Desktop/Mobile lock and local API settings have no trusted-proxy equivalent. Nginx accepts `EO-Connecting-IP` only with the exact dedicated origin key and a valid IPv4/IPv6 address. Otherwise it retains the transport peer. It overwrites both app IP headers and strips the raw origin key/EO header before proxying. No blanket trusted-proxy network, public IP debug endpoint, app rebuild, user-data change or source visual modification. The production key lives in a root-only include, never Git or access logs.

- **Cold-load delivery — 2026-09-08:** prioritize the ORIGINAL Desktop `bg-canvas.png` (including Owner overrides). A WebP trial preserved decoded RGBA, but Chrome canvas comparison found 16,027 transparent RGB channels with differences up to 2; opaque pixels and alpha were identical. Reject the format change to preserve the original presentation. Original font CSS is compressed byte-for-byte with Brotli/gzip and served by host Nginx with HTTP/2. Public adapted HTML gains ETag revalidation; no water/rain/rendering parameters or source transition durations change.

- **Public filing notice:** preserve the existing `keleoz.com` placeholder's `皖ICP备2026007914号-2` link to the MIIT site as a static Home footer. This public-hosting addition has no offline upstream equivalent; original scene, player and mobile interaction surfaces are unchanged.
- **Mobile public lock adapter correction:** production first-load screenshot exposed a remaining `#lk-preveil` layer after `#lockscr` removal. Public Home removes/hides both source-local lock layers; Owner server authentication remains unchanged. The original Mobile runtime/layout is retained and the immutable snapshot is not edited.

- **Exact typography / delivery adapter:** Desktop `InternalBeyond.html:35`, Mobile `index.html:115` and Room `game/game_module.js:283` define the authoritative Google Fonts requests. `scripts/vendor-source-fonts.mjs` vendors the same eight families, weights, italics and unicode subsets with hashes and per-family OFL notices. `source-native/fonts.ts` only rewrites delivery URLs in adapted Home/Owner/editor documents and the Room loader; raw reference responses and upstream snapshots remain untouched. No new font or visual redesign.
- **Navigation adapter:** original Desktop `navTo` and Mobile drawer/Desk data/visual entries (`index.html:2048–2057`, `:2536–2539`) route to existing public or authenticated server pages. Cross-page navigation flushes queued edits; local-only backup tools are not exposed as server backup controls. Excluded ICode/image generation/general MCP remain excluded.
- **Server backup reimplementation required:** Desktop export (`InternalBeyond.html:9481–9507`) and Mobile export (`index.html:11373+`) establish data ownership/export intent, but browser JSON cannot snapshot PostgreSQL and server media atomically. The operations adapter holds one exported PostgreSQL snapshot for dump, ready-media inventory and weekly JSON; stream-copies local media with hashes, publishes complete bundles, retains shared cadence references, and verifies in isolated DB/filesystem targets. Cloud objects and legacy DB-only backups explicitly remain outside media coverage. Restore status must match the newest backup, not an old successful drill.
- **Production configuration:** optional existing-proxy versus direct-TLS templates preserve current DNS/certificates until SSH inspection. Validated AI output caps include provider-default thinking; production gateway stays off until credentials, rates and budget are explicitly configured. No online deployment or certificate issuance occurs in this batch.
- **Evidence:** source-font hash/license/local-URL contracts, native navigation contracts, snapshot concurrency/failed-publication/corruption/isolation tests, and deployment merge tests. Runtime browser and final regression results are reported with the batch, not inferred from route existence.

| Product area | Desktop source | Mobile source | V1 strategy | Preservation contract |
|---|---|---|---|---|
| Home scene | `InternalBeyond.html` background, splash, rain, frost, theme sections | Mobile theme and safe-area patterns | Adapter reuse | Preserve atmosphere and motion; replace brand and content hierarchy |
| Desktop navigation/windows | Navbar, page overlay, Music/Chat/Calendar/Circle/ICode floating panels | Not authoritative | Adapter reuse | Preserve window language, drag/resize where appropriate |
| Mobile shell | Not authoritative | Desk, Space, Circle, drawer, dock, widget, fullscreen-app sections in `index.html` | Adapter reuse | Preserve mobile-native interaction; share domain services |
| Blog reading | Blog list, reader, search, annotations, diary/editor behavior | Mobile journal cards, reader, side sheet | Adapter reuse | Preserve reading details; replace local persistence and editor core |
| Online editor | Original Rift editor DOM/CSS/JS | Original Mobile Blog editor DOM/CSS/JS | Exact runtime + server adapter | Plain/Markdown authoring across Blog/Project/Moment/Page; preserve rich documents in their block path until adapted; server publication/versions |
| Projects | ICode `projects` is not the public Project entity | ICode `projects` is not the public Project entity | New domain module | Reuse visual language and relations, not the old storage meaning |
| Moments | Circle / InternetBeyond feed functions and UI | Mobile Circle feed and Persona cards | Adapter reuse | Preserve post/comment/repost/visibility behavior; add server moderation |
| Letters | Envelope, postal code, wax seal, open/close and AI letter flows | Beyond post-office mobile flows | Adapter reuse | Preserve ritual; add Guest submission, approval, public Owner reply |
| Music | Floating player, 48-band visualizer, analysis and chat card | Vinyl, tonearm, lyrics, queue, Listen Together | Adapter reuse | Desktop and Mobile keep their strongest native surfaces |
| Desktop Room | `game/game_module.js` and `game/` assets | No equivalent pixel Room | Exact + adapter reuse | Preserve 1672×941 room, A* pathfinding, collision and state machine |
| Wardrobe | `game_module.js` outfit/sprite system | No equivalent | Exact + adapter reuse | Preserve six-slot mechanism; replace character art before public launch |
| Sleep | `game_module.js` bed/lie/wake states | No equivalent | Exact + adapter reuse | Preserve character-state behavior |
| Tea | `game_module.js` drink/dessert matrix, prompts, dialogue and diary save | No complete equivalent | Adapter reuse | Preserve 5×5 moods and conversation behavior; new AI/local-history adapters |
| Story | `game_module.js` genres, rounds, JSON contract, moods and saves | No complete equivalent | Adapter reuse | Preserve 12–16 round branching and recovery; Mobile becomes fullscreen app |
| Tarot | `game_module.js` deck, spreads, faces, follow-ups and saves | No complete equivalent | Adapter reuse | Preserve 78 cards, reversals, five spreads, guide card and follow-ups |
| Character | Sui assets are upstream identity | Mobile profile/Persona presentation | New assets + reused mechanics | Digital Keleoz is original; preserve mechanical slots and transitions |
| About/Profile | Liquid-glass profile and gallery | Space profile card and themes | Adapter reuse | Same identity data, different shell presentation |
| Calendar | Full calendar, lunar/solar calculations, events and notes | Mobile Calendar App and widgets | Owner runtime + server adapter | Private records and AI permissions; public Timeline remains separate |
| Memory | Scoring, visibility, star map and Auto Memory | Mobile Memory and Persona dossier | Owner runtime + server adapter | Preserve source UI; fresh reads and version checks prevent stale privacy writes |
| Chat | Full chat, groups, topics, streaming, actions and summaries | Mobile Chat, side drawer and bubbles | Owner runtime + server adapter | Server-held model/key, source interaction and search-only gateway; no public general AI |
| ICode | Workspace, operations, rich files and sandbox | Mobile workspace and GitHub section | Deferred | Preserve references; do not expose Owner workspace publicly |
| AI gateway | Browser-direct provider functions | Browser-direct provider functions | Reimplementation required | Server-held keys, streaming adapters, quotas, cost cap, kill switch |
| Authentication | Local lock/password patterns are not web auth | Mobile lock screen is local privacy only | Reimplementation required | V1 one Owner account; future Member email login |
| Exposure | Local visibility fields provide semantics | Shared visibility semantics | Reimplementation required | Server-enforced Full/Summary/Hidden in V1; no client-side secrecy |
| Timeline/Archive/Search | Partial calendar/history/search references | Partial history/search references | New domain views | Derive from published entities; PostgreSQL-backed search |
| PWA | No authoritative PWA shell | `manifest.webmanifest`, `ib-sw.js`, safe-area/native bridge patterns | Adapter reuse | Rebuild caching for dynamic/authenticated site; preserve install and safe-area UX |
| Visual customization | Desktop themes and DIY assets | Mobile Visual page, presets and widget materials | Adapter reuse, phased | Owner controls the published space; do not expose unsafe client configuration |
| Data/backup | IndexedDB export/import contracts | Shared backup schema | Reimplementation required | PostgreSQL backups, readable JSON export, LightCOS media inventory |

## Per-feature evidence template

2026-09-07 appearance and regression batch (local only, no deployment): reuse Mobile `page-visual` (2569+), `_uiApply/_uiCustomApply` (4101+), `_uvThemesDraw` (4895+), Desk `_dkSave/deskApplyLayout` (14946+) and decoration renderers (4356+, 4672+). Private `/studio/appearance` keeps their controls and server-backed drafts; publication whitelists visual values, Desk ordering/visibility/pages and uploaded decoration/background media, never whole mobilePrefs. Desktop DIY (7181–7260) only documented file replacement, so source cards gain minimal upload/reset controls as the necessary server-storage adapter. Both Profile image sets use original editors and independently published validated media; missing Infernal slots fall back to Internal. Raw upstream files/routes remain unchanged; selected Home artwork overrides apply only to the public adapted HTML. Regression repairs cover original Blog font classes/match-index navigation (2789–2800, 8688–8704), blank-iframe premature patching, workspace shell stability, and versioned private record writes with fresh Memory reads to prevent revoked/deleted records being overwritten by stale Chat.

Verified locally: 331 unit/integration checks plus six browser cases, including real appearance draft/upload/publication/restore, Mobile layout and visibility, two-theme Profile media and private-bio exclusion, stale record overwrite/resurrection rejection, resize retention, original authoring/Memory/Chat regression, and synthetic article font/search controls at 1440/390px. The editor loader now locks fields from initial markup until data and autosave baseline are ready; no offscreen early input can be mistaken for saved content. Mobile published settings are applied through the source loader so late IndexedDB reads cannot overwrite them. Publication awaits queued saves and reserves the footer's measured height. Temporary fixtures were restored/removed; admin and immutable upstream files were preserved. Webpack production build passed; no server/cloud deployment was attempted. Private companion identities and lock/tool settings are not part of appearance publication; public avatar decorations use the published Owner identity.

Desktop operators can select “Mobile 布局” on the same appearance page to use the original Mobile UI in a bounded-width preview; switching waits for pending saves. Chat wallpaper stays in private `mobileBgs` and is never uploaded/projected by appearance publication. Original Google Fonts URLs are retained; the local browser observed intermittent font-network failures, so this batch does not claim offline font availability or universal pixel-identical rendering under unavailable external fonts.

2026-09-05 limited web search: user explicitly approved keyless MCP transport solely for search/page reading, not a general MCP settings or tool surface. Reuse Desktop `IBWS` switch and `_amBuildSearchCard`/`searchLog` (6083, 13954–14056, 22932–22954), Mobile `aset-web` and `searchCard`/`wsSearches` (6990–7102, 10422). Fixed server-only Parallel free endpoint permits only `web_search` and `web_fetch`; no caller-selected server/tool, credential forwarding, paid fallback, speech or ICode. Only explicit current-query text is sent, not private injected context/history; references are bounded and HTTPS-filtered. Owner authentication, origin check, cancellation, concurrency, daily/cooldown metadata ledger and source persistence adapters surround the original UI.

Search evidence: real Desktop Chat search returned six source links, persisted original searchLog/wsSearches, and DeepSeek replied with citations and default reasoning. Mobile read a specified documentation URL, saved its source card and displayed prior Desktop references as links. Simulated 429 displayed an explicit error and made no model call; anonymous POST returned 401. Tests cover explicit first-line queries, exclusion of appended private files and forged file delimiters, group name prefixes, private/credentialed URL rejection, matching SSE IDs, bounded free endpoint/tool selection, one search per Desktop continuation, cancellation and no paid fallback. Search queries remain in private Chat history; quota records retain only counts/lengths. No source snapshot changed. Local Turbopack junction creation failed despite a successful native junction probe; the official Webpack build path passed and powers the verified preview.

2026-09-05 Calendar adapter: Desktop `InternalBeyond.html:25224–26708` (IBCAL, original floating window/widget, events/notes/ledger and Chat hooks), Mobile `index.html:5938–6415`, `:17359–18414` (calendar widgets, native editor and fullscreen app). Preserve original markup, styles, clocks, animations and permission/AI-note execution. `/calendar` is Owner-only; `calEvents`, `calNotes`, `calLedger` use existing private PostgreSQL source records. Public Timeline stays separate. Refresh source Calendar data before Chat context to avoid stale cross-device state; no public calendar projection, new service or upstream edits. Contract and desktop/mobile persistence checks gate completion.

Calendar verification: original Desktop create → Mobile edit/reload → Desktop read; original minimize/restore and notes page; real DeepSeek response (default thinking) → source `processReply` → persisted note, duplicate rejected. Anonymous record/document requests return 401. Mobile retains Desktop-only selected-companion/weekday fields and executes the extracted Desktop month-end/leap-year/end-date algorithm; its original all-only AI guards are adapted to the same selected-companion visibility contract. Permission refresh failure suppresses context; original fire-and-forget ledger/settings writes are serialized before reads to preserve note quotas. Tests cover these bridges, and browser checks cover selected-companion isolation plus simulated settings failure. Seven temporary test records were removed; existing account/profile and actual AI usage ledger were retained.

2026-09-05 live AI integration: DeepSeek V4 Flash Vision runs with provider-default thinking (no `thinking` or `reasoning_effort` override). Live testing reproduced a Tea reply cut at 320 total output tokens and an unusable retry after a consumed Tarot follow-up grant. The server now distinguishes truncated output from completed turns, retains usage metadata including reasoning-token consumption, and returns consumed Story/Tarot grants only after failed calls while successful calls remain one-use. `source-relay.ts` forwards original SSE unchanged, records explicit cancellation/timeout/truncation and releases concurrency once; HTTP cancellation reaches the nonstreaming guest provider too. The known source-generated synthetic `<thinking>` preamble is removed only for DeepSeek so its native reasoning stream does not compete with a second requested draft; source Chat UI/parser and Memory/Auto Memory functions remain unchanged. Live checks covered actual Auto Memory writes, separate-thread recall of Auto Memory and manual Memory, Persona pending→approved→withdrawn, Chat cancellation followed by a successful request, Tea source UI and browser-only Save, Story next-turn JSON, and Tarot follow-up/replay rejection. Test personas/records were cleaned; cost ledger rows remain. Output limits in the environment example now allow room for reasoning without disabling it; Persona daily request identity resets on the ledger's UTC day boundary.

2026-09-05 public site configuration: original Desktop `loadAboutDisplay/openAboutEdit/saveAbout` (9044–9246) and Mobile `renderProfile/pset` (5516–5770) now run at protected `/studio/profile`. Saving keeps an Owner-only `about/main` draft; explicit publication projects only name, name color, public bio, custom text and Internal avatar/cover/gallery through validated media objects. Private bio is omitted. `_site/public` in the existing record table stores a revision-checked public snapshot, included in existing database/record exports. `/studio/settings` adapts the established source-style publication form for website-only copy/theme/playlist/default-outfit controls. Home uses the final source music library adapters (`_musicLoadLibraryD` at 24957 and `_pwLoad` at 14004) via a virtual read-only site playlist over local music; native rendering, seeking, controls and user-added tracks remain intact, and seeding never calls play. Home default theme respects an explicit browser choice. Room defaults are supplied before original asset/state loading; Mobile Character defaults apply only without a saved browser state. Public About and Owner Moments use the published identity. Referenced site media cannot be deleted until detached. No source snapshot, Member flow, image generation, ICode or new service was introduced. Deeper DIY/mobile layout presets and per-theme Profile image sets are not claimed as completed by this configuration slice.

2026-09-05 corrective authoring boundary: `source-native/bootstrap.ts` keeps Desktop `openEditor/savePost` (8383–8430) and Mobile `blogOpenEditor/m-ed-save` (12572–12613). `writer-runtime.ts` adds serial debounced server autosave, explicit failed-save retry, navigation flushing and source-styled attachment controls. Media is explicitly appended after the original text, supports upload/library selection/order/removal, and retains the existing server UUID/ready-media publication contract. Source Markdown and its native toolbar remain intact. `source-native/posts.ts` prevents flattening unrelated rich documents and stale-revision overwrites. All four public content types use the original writer when compatible. The advanced editor parses actual rendered source formatting and retains attachment JSON on first body edit; merely viewing it does not convert the stored draft. Publication settings expose immutable version history and save submitted exposure/summary before publishing. Source files remain immutable. Image generation and ICode remain excluded.

2026-09-05 block-editor shell correction: `editor-document.ts` extracts actual Desktop Rift markup (5545–5596), original toolbar SVG and all static styles; Mobile uses its separate editor markup (3792–3812) plus late editor styles (16314–16325). `original-editor-frame.tsx` mounts the existing structured editor into the source body slot and binds original metadata/toolbar controls. Source background blur and `page-overlay.show` are retained. Original local storage handlers are stripped, not executed; server persistence and block-only tools use adapters. Rich blocks have no equivalent upstream JSON editor, so their engine and secondary tools remain intentional additions, not claimed as original source behavior. The obsolete duplicate `/studio/blog/[id]` surface redirects to the canonical editor. `draft-save-queue.ts` serializes in-flight writes and never adopts a conflicting revision for silent overwrite. Verification covers original desktop/mobile layout, formatting, Markdown import, responsive editor transfer, immediate save/preview, attachments and the private publication boundary.

Before implementation, append a short entry:

```text
Feature:
Upstream paths and symbols:
Exact behavior to preserve:
Reuse classification:
Required adapters:
Contract tests:
Intentional differences and approved reason:
```

## Planned evidence: Foundation and Blog publishing slice

Feature: Blog list, reader, editor metadata, and publication boundary

Upstream paths and symbols: Desktop `InternalBeyond.html:5490`, `:5520`, `:8208-8209`, `:8377`, `:8390-8705`; Mobile `index.html:3174-3180`, `:3792-3820`, `:12125-12320`, `:12587-12620`

Exact behavior to preserve: title/subtitle/category metadata; clean list summaries; dirty-exit protection; debounced input work; reading progress; previous/next navigation; adjustable font size; paragraph/block anchors; Desktop/Mobile-specific presentation

Reuse classification: Adapter reuse for list/reader interaction contracts; reimplementation required for the Tiptap editor, public persistence, stable URLs, publication versions, caching, and server enforcement

Required adapters: Tiptap document renderer; PostgreSQL content repository; Guest projection DTO; Next.js cache tags; future legacy-post import mapper

Contract tests: long bodies absent from list DTOs; block IDs survive JSON-to-HTML; Full/Summary/Hidden projection; immutable versions; slug stability; Desktop/Mobile browser flows

Intentional differences and approved reason: Owner controls are removed from Guest pages; local AI comments and annotations are deferred; public security and SEO require server authority

Feature: Owner authentication

Upstream paths and symbols: Desktop `InternalBeyond.html:8214-8320`; Mobile `index.html:1725-1805`, `:12650` onward for local lock/diary behavior

Exact behavior to preserve: clear locked/unlocked state, explicit failure feedback, and separation between private and public surfaces

Reuse classification: Reimplementation required

Required adapters: Argon2id password verifier; opaque PostgreSQL sessions; HttpOnly cookie; DB-backed login throttle; secure DAL

Contract tests: wrong password rejected; raw token not stored; expired session rejected; sixth failed attempt blocked; direct action/handler calls require Owner

Intentional differences and approved reason: default six-digit passwords, security questions, local SHA-256 checks, and IndexedDB authorization are not valid public-web security

Feature: Shared legacy data contract

Upstream paths and symbols: Desktop `InternalBeyond.html:7886-7889`, `:9281-9485`; Mobile `index.html:3868-3875`, `:11274-11275`

Exact behavior to preserve: known post metadata fields and cross-device export meaning

Reuse classification: Deferred adapter reuse

Required adapters: future explicit mapper from IndexedDB v15 post records to Tiptap/Continuum entities

Contract tests: future fixtures must map `title`, `subtitle`, `category`, `content`, `created`, and `updated` without treating `locked` as server authorization

Intentional differences and approved reason: user confirmed there is no old data, so import execution is outside the first slice; the mapping is retained to avoid losing compatibility knowledge

## Implemented evidence: Checkpoint 2

Feature: Owner authentication core

Implemented paths and symbols: `src/modules/auth/crypto.ts` (`hashPassword`, `verifyPassword`); `session.ts` (`createSessionMaterial`, `hashSessionToken`); `throttle.ts` (`applyFailedAttempt`); `repository.ts` (`createAuthRepository`); `bootstrap.ts`; `scripts/create-owner.ts`

Contract evidence: `tests/unit/auth-crypto.test.ts`, `login-throttle.test.ts`, `owner-bootstrap.test.ts`, and `tests/integration/auth-session.test.ts`; 8 tests verify Argon2id credentials, opaque token hashing, sixth-attempt blocking, bootstrap validation, session expiry, and the single-Owner rule

Feature: Blog document, exposure, draft, and publication core

Implemented paths and symbols: `src/modules/content/document.ts` (`parseAndRenderDocument`, stable block-id extension); `slug.ts`; `projection.ts`; `repository.ts` (`createDraft`, `saveDraft`, `publishDraft`, `getPublicBySlug`, `listPublic`, `updateDraftSlug`)

Contract evidence: `tests/unit/content-document.test.ts`, `content-projection.test.ts`, `tests/integration/draft-repository.test.ts`, and `publish-repository.test.ts`; 14 tests verify sanitization, stable block IDs/slugs, Full/Summary/Hidden projection, optimistic revision conflicts, immutable versions, atomic pointer preservation, and lightweight public lists

Intentional difference: Next.js cache wrappers remain with the public Blog route implementation so cache keys and invalidation are tested with their actual consumers rather than as unused infrastructure

## Planned evidence: Home scene and responsive shells

Feature: Continuum Home scene, Desktop navigation language, Mobile Desk shell

Upstream paths and symbols: Desktop `InternalBeyond.html:60-190` (preloader, backgrounds, splash, mist controls), `:193-240` (glass navbar), `:5359-5490` (scene markup), `:7289-7292` (Music mini); Mobile `index.html:78` (safe-area variables), `:2030-2140` (topbar/drawer), `:2453-2570` (Desk hero/app matrix/widgets), `:3224` (bottom dock)

Exact behavior to preserve: fogged blue scene with butterfly/droplet atmosphere; staged splash fade/blur dissolve; left-aligned title and bilingual intro hierarchy; compact Music entry surface; glass navigation/window language; Mobile safe-area layout, topbar/drawer, Desk app tiles, widget-first home and bottom dock

Reuse classification: Adapter reuse

Required adapters: Continuum brand/link mapping; React client controls for mist/brush affordances and Music panel entry; responsive Desktop/Mobile shell components; server-backed routes for public content; no upstream local lock or browser-only persistence

Contract tests: Home renders brand and scene layers; Blog/Studio links remain reachable; Music control is keyboard accessible; Mobile shell hides desktop nav at narrow widths and preserves safe-area padding; reduced-motion mode disables decorative animation

Intentional differences and approved reason: upstream `IB`/`Sui` identity, local lock/auth, local API keys, and monolithic global startup are not public Continuum behavior; public content remains server-authoritative while the scene and shell preserve the reference atmosphere

Asset extraction evidence: copied `upstream/InternalBeyond-Desktop/bg-canvas.png` to `public/reference/internal-beyond/bg-canvas.png` without editing the immutable snapshot; copied asset SHA-256 is `2203F12F67313AA54AB2BC79BD7A108DEC5A25115680637C67001A4A353AA4AD`. A light-scene companion was copied to `public/reference/internal-beyond/bg-internal.jpg` for the later theme adapter; its copied SHA-256 is `3309416DBDC1CFA185A66E9A9305339E125153D343BF119303B52266BE1F2BB3`.
Home theme extraction evidence: copied `upstream/InternalBeyond-Desktop/bg-infernal.jpg` to `public/reference/internal-beyond/bg-infernal.jpg`; source and copied SHA-256 both equal `240315E3E74593D6B2C9163C7498BEE985F0AFABD6380AF074C3AD5CC0141F17`.

## Implemented evidence: Letters submission and review slice

Feature: Guest Letters submission, public approved wall, and Owner review/reply

Implemented paths and symbols: `src/db/schema/content.ts` (`letters`, `letter_visibility`, `letter_status`); `src/modules/letters/contracts.ts`; `src/modules/letters/repository.ts`; `src/app/api/letters/route.ts`; `src/modules/letters/letters-client.tsx`; `src/modules/letters/owner-actions.ts`; `src/app/letters/page.tsx`; Studio inbox in `src/app/studio/(protected)/page.tsx`

Contract evidence: `tests/unit/letters.test.ts` and `tests/integration/letters-repository.test.ts`; 6 tests cover normalized submission input, six-digit postal derivation, pending/public boundaries, source-hash omission from public DTOs, approval with Owner reply, and the three-per-hour source limit. Browser smoke covered submit -> postal code -> Owner review/reply -> approve -> public envelope -> open letter.

Reuse classification: Adapter reuse for the envelope/postal/seal/opened-paper interaction and Desktop/Mobile visual vocabulary; reimplementation required for server persistence, approval, privacy, rate limiting, and Owner authorization.

Intentional differences: no raw IP/contact data is stored or serialized; the public wall contains only approved public letters; private letters remain Owner-only; the upstream AI-request button is deferred until the server AI gateway and quota policy exist.

## Implemented evidence: Music local listening surface

Feature: Music fullscreen player with local queue, vinyl/tonearm, playback modes, seeking, and LRC display

Implemented paths and symbols: `src/modules/music/contracts.ts`; `src/modules/music/music-client.tsx`; `src/app/music/page.tsx`; Home Music links in `src/modules/home/home-scene.tsx`

Contract evidence: `tests/unit/music.test.ts`; 3 tests cover filename normalization, list/single/random transitions, and ordered LRC parsing. Browser smoke covered `/music` rendering at desktop and 390×844 mobile sizes plus queue open/close affordance.

Reuse classification: Adapter reuse for the Desktop playlist/mode/seek contract and Mobile fullscreen vinyl/tonearm/lyrics/queue visual contract; local-only browser media is intentional for V1.

Intentional differences: no IndexedDB library or Listen Together synchronization is enabled yet; object URLs are released on removal/unmount, and audio never crosses the server boundary.

## Implemented evidence: Home interaction parity pass

Feature: Welcome/main-scene transition, Internal/Infernal theme backgrounds, rain, fog brush, white pen, and clear controls

Implemented paths and symbols: `src/modules/home/home-scene.tsx`; `src/app/globals.css`; `public/reference/internal-beyond/bg-infernal.jpg`

Preserved behavior: welcome `bg-canvas` scene remains separate from the entered main scene; entered state crossfades to `bg-internal` or `bg-infernal`; rain is animated in a lightweight Canvas; the scene tool exposes pointer-enabled finger haze wipe, white pen strokes, clear, MIST opacity and BRUSH size controls.

Reuse classification: Adapter reuse; original Canvas behavior was ported at interaction level without bringing the monolithic upstream startup script into the Next.js bundle.

Contract evidence: Browser smoke at `/` covered initial welcome scene without visible navigation, Enter space transition, theme toggle, and pointer interaction on the enabled finger brush.

Follow-up parity evidence: Home's desktop Music mini now preserves multi-track add/remove, playback mode, previous/next, progress seek, playlist, and draggable header behavior; Blog reader now includes the source toolbar contract (Back, in-article search/count/navigation, reading progress, and three font sizes). These remain adapters over the current server-backed routes.

Home water evidence: `src/modules/home/glass-water-canvas.tsx` ports the source low-resolution height-field simulation (`DAMP`, `REFRACT`, `LIGHT`, 30fps stepping), refractive image sampling, falling drops/plips, ambient pokes, and pointer tap/stir input for the welcome scene. It remains a client-only visual adapter and is inactive after entering the main scene.

## Implemented evidence: Blog and Letters visual parity pass

Feature: Restore reference module shells without changing the public server contracts

Implemented paths and symbols: `src/modules/content/blog-list-client.tsx`, `src/app/blog/page.tsx`, `src/modules/letters/letters-client.tsx`, `src/app/globals.css`

Preserved behavior: Blog title/subtitle/category/summary search, category filtering, date-led journal cards, module intro, side actions, and Owner Studio entry; Letters module intro, postal search, public export, request/composition card, envelope flap, postal boxes, stamp, wax seal, open/close paper, and Owner reply display.

Reuse classification: Adapter reuse. Existing PostgreSQL projections, stable URLs, Letters moderation, and privacy boundaries remain unchanged; the simplified visual shells were replaced with source-derived structure and styling.

Intentional differences: Password Diary and AI-request-from-selected-provider remain outside the current public surface until their respective security/AI gateway boundaries are available; the brand and source-identifying marks use Keleoz Continuum wording.

## Implemented evidence: Source-exact frontend recovery

Feature: Desktop Home scene and responsive Mobile Desk shell

Implemented paths and symbols: `src/modules/home/home-scene.tsx`, `source-glass-canvas.tsx`, `source-mist.tsx`, `source-rain.tsx`, `src/app/source-home.css`; source Desktop `InternalBeyond.html:60-105`, `:193-240`, `:5359-5490`, `:8040-8118`, `:26780-27440`; source Mobile `index.html:172-214`, `:2453-2585`, `:416-425`, `:1356-1429`

Preserved behavior: source background layers, splash blur/dissolve, glass-window mask, image grade/frost/noise/depth layers, source water height-field/refraction/drop parameters, fog and white-pen tools, MIST/BRUSH thermometers, 45-drop rain field, glass navigation language, and Mobile safe-area Desk/topbar/drawer/dock vocabulary.

Reuse classification: Exact reuse for visual layers, animation parameters, and interaction algorithms; adapter reuse for React lifecycle, Keleoz branding, public links, and cleanup of global listeners.

Intentional differences: upstream local lock, export/import, and private identity controls are not exposed in the public Home shell; only reachable V1 routes are shown until the remaining public modules are implemented.

Feature: Desktop Music floating player and Mobile fullscreen Music app

Implemented paths and symbols: `src/modules/home/source-music-player.tsx`, `src/modules/music/source-music-client.tsx`, `src/app/source-music.css`; source Desktop `InternalBeyond.html:3308-3366`, `:7289-7306`, `:9252-9271`; source Mobile `index.html:3224-3270`, `:17359-17614`

Preserved behavior: 300px Desktop glass player, 48-band analyzer, local file queue, list/single/random playback, progress seeking, draggable panel header, Mobile vinyl/tonearm/lyrics/progress/five-control fullscreen layout, and browser-local media boundary.

Reuse classification: Exact reuse for markup hierarchy, controls, icon paths, vinyl/tonearm styling, and visualizer parameters; adapter reuse for React state and browser object URLs.

Intentional differences: Together/Member synchronization and server media storage remain deferred; no new visual treatment was added.

Feature: Blog and Letters public presentation

Implemented paths and symbols: `src/modules/content/blog-list-client.tsx`, `src/modules/letters/letters-client.tsx`, `src/modules/home/source-public-nav.tsx`, `src/app/source-public.css`; source Desktop `InternalBeyond.html:5489-5710`, `:2528-2770`, `:390-535`

Preserved behavior: source module intro, Blog dual-wing list/search/category/card layout, Letters toolbar and envelope postal/stamp/flap/seal/open-paper treatment.

Reuse classification: Exact reuse for unaffected presentation and envelope interaction; adapter reuse for server publication projections, public approval/privacy, and the separate guest composition layer.

Intentional differences: Owner-only local Password Diary and AI request controls are not exposed; public letters use a server-backed form with anonymity, visibility, moderation, and rate limits.

Feature: Blog public reader

Implemented paths and symbols: `src/app/blog/[slug]/page.tsx`, `src/modules/content/reading-progress.tsx`, `src/app/source-public.css`; source Desktop `InternalBeyond.html:2767-2800`, `:2936-3022`, `:5489-5540`

Preserved behavior: source reader toolbar, in-article search/count/navigation, three font sizes, reading progress, document typography, and adjacent-post navigation.

Reuse classification: Exact reuse for reader hierarchy and interaction vocabulary; adapter reuse for server-rendered published HTML, stable slugs, and Full/Summary/Hidden exposure.

Intentional differences: Owner edit/delete/export controls and local annotations remain outside the public reader until their server authorization boundaries are implemented.

## Corrective evidence: Home uses the immutable source runtime directly

Feature: Home source runtime boundary

Implemented paths and symbols: `src/app/reference/internal-beyond/[...path]/route.ts`, `src/modules/home/source-home-frame.tsx`, `src/app/source-home-frame.css`, `src/app/page.tsx`; source `upstream/InternalBeyond-Desktop/InternalBeyond.html` and all relative Desktop assets/scripts.

Verification: the original local file and immutable snapshot both hash to `92F8255E6B710FEA150F3F08BC51737442C6CC2F707C3DCB4A64C4AC1FBE8D28`; the live Next route `/reference/internal-beyond/InternalBeyond.html` is byte-identical to the snapshot. A fresh browser confirmed the iframe owns the original `enterSite`, `ibModeToggle`, `gw-ripple`, and `music-panel` implementations; Music computed transparency is `rgba(155,180,218,0.1)` with `blur(16px) saturate(1.15)`, matching upstream.

Reuse classification: Exact runtime reuse. The parent only injects an in-memory public adapter for Keleoz wording, reachable public routes, and hiding local-only controls; it never writes to or transforms the upstream files on disk.

Intentional differences: public branding and route/security boundaries are adapted in the iframe DOM. The raw source route remains byte-identical; only the public Home request adds `?continuum-gloss=2`, which injects a pre-runtime compatibility bootstrap that rejects the pinned source's sole Canvas readback. The unchanged source code then selects its own `REFRACT_OK=false` / `gw-gloss` fallback, including the source transparent gloss pixels, opacity, blend mode, drops, and pointer simulation. This matches the clear offline branch without rewriting the algorithm or changing the snapshot. The source's optional `bg-canvas.jpg` probe and missing `signs.js` remain source behavior.

Feature: Shared public navigation and source-responsive Home/Music routing

Implemented paths and symbols: `src/modules/home/source-public-nav.tsx`, `src/app/source-public.css`, `src/modules/home/source-home-frame.tsx`, `src/app/reference/internal-beyond-mobile/[...path]/route.ts`, `src/app/music/page.tsx`; source Desktop `InternalBeyond.html:193-240`, source Mobile `index.html:172-214`, `:2453-2585`, `:3224-3270`, `:17359-17614`

Preserved behavior: the same source glass topbar language across public Desktop Home/Blog/Room/Letters, source Mobile Desk/Drawer/Dock, source Mobile Music fullscreen app, and Desktop Music as the original floating panel rather than a new page. Public Desktop navigation uses the source `ul`/`li` hierarchy, butterfly mark, font metrics, gap/height values, and responsive breakpoints; unused Home source list items are hidden at the parent level so they cannot leave phantom flex gaps.

Reuse classification: Exact source shell/runtime reuse with thin route and branding adapters.

Intentional differences: `KC` replaces the upstream `IB` mark; public Home removes the duplicate Skip action and local lock/Owner controls; desktop `/music` redirects to Home and opens the original floating panel, while mobile opens the original `#music-app`.

Feature: Desktop Room runtime

Implemented paths and symbols: `src/modules/room/room-client.tsx`, `src/app/room/page.tsx`, `src/app/game/[...path]/route.ts`, `src/app/source-room.css`; source `upstream/InternalBeyond-Desktop/game/game_module.js` and its `game/` artwork assets.

Preserved behavior: original 1672×941 pixel room, source asset loading, character state machine, walkable area and A* pathfinding, interaction markers, sidebar actions, day/night layers, and the original Tea/Story/Tarot/Wardrobe/Sleep entry points.

Reuse classification: Exact runtime reuse through a thin host/navigation adapter and a traversal-safe immutable-source asset route.

Intentional differences: the public host does not expose the upstream local lock or browser API-key mechanisms; Mobile does not squeeze the Desktop Room into a phone viewport and will receive its own fullscreen App adapters.

Follow-up visual parity: the independent Room host now supplies the immutable Desktop root theme tokens (`--silver`, `--glass-border`, `--accent`, `--white`, and the remaining Room-used palette variables) with their exact source values. This restores source Tarot/action button text, border, and hover colors without overriding `.tarot-btn` or redesigning any Room surface.

Feature: Wardrobe and Sleep browser-local state boundary

Implemented paths and symbols: `src/modules/room/source-state.ts`, `src/modules/room/source-state-browser.ts`, `src/modules/room/room-client.tsx`; source Desktop `game/game_module.js:50-70`, `:1517-1572`, `:1725-1750`, `:2850-2888`, `:3637-3712`, `:3730-3763`.

Preserved behavior: unchanged six-outfit Wardrobe panel and dialogue; synchronized walk/idle/lie/portrait source assets; unchanged bed pathfinding, two-stage sleep dialogue, lie-frame animation, pointer wake, and source-disabled Zzz rule.

Reuse classification: Exact runtime reuse for presentation and character mechanics; adapter reuse only for the Guest browser-storage boundary.

Contract evidence: `tests/unit/room-source-state.test.ts` covers source-key isolation, unrelated-key delegation, clear behavior, state validation, and versioned records. Production browser smoke covered Casual -> JK selection, `idle_jk.png` -> `lie_jk.png` -> wake, version 1 IndexedDB updates, empty physical localStorage, clean Room-to-Blog teardown, and Room re-entry with zero console errors.

Intentional differences: the unchanged source continues to call the synchronous `localStorage.suiGameState` API, but the public host serves that one compatibility key from memory and persists it in versioned IndexedDB. Other localStorage keys retain native behavior. If IndexedDB is unavailable, Room degrades to the exact source localStorage behavior instead of blocking non-AI gameplay.

Feature: Desktop and Mobile Tea runtime with Guest AI boundary

Implemented paths and symbols: `src/modules/tea/contracts.ts`, `local-history.ts`, `local-history-browser.ts`, `source-adapter.ts`, `mobile-state.ts`, `mobile-tea-client.tsx`, `service.ts`, `http.ts`, `runtime.ts`; `src/modules/ai/provider.ts`, `quota.ts`, `repository.ts`; `src/app/api/ai/tea/route.ts`; `src/app/tea/page.tsx`; `src/app/source-tea-mobile.css`; Mobile Desk injection in `src/modules/home/source-home-frame.tsx`; `src/db/schema/ai.ts`; source Desktop `game/game_module.js:4244-4290`, `:4532-4908`, `:4917-5304`; source Mobile `index.html:2453-2595` and `:3224-3290` for Desk/fullscreen App language.

Preserved behavior: source five-drink/five-dessert matrix and 25 mood combinations; source selection labels, mottos, art and hotspots; Desktop theme-crossfade/icon animation/current-outfit sprite; companion/chat/opening message; 70-character input; round/Bye behavior; and repeatable Save interaction vocabulary. Mobile preserves its own safe-area fullscreen header and Desk App navigation instead of scaling Desktop Room.

Reuse classification: exact Desktop runtime reuse for Tea UI, animation, and chat state machine; Mobile adapter reuse for the same Tea assets/contracts inside the immutable Mobile Desk/fullscreen-App language; adapter reuse for server-held provider calls, quotas, public safety, and Guest local history.

Contract evidence: `tests/unit/tea-contracts.test.ts`, `tea-mobile-state.test.ts`, `tea-source-adapter.test.ts`, `tea-local-history.test.ts`, `ai-quota.test.ts`, `ai-provider.test.ts`, `tea-service.test.ts`, `tea-http.test.ts`, and `tests/integration/ai-quota-repository.test.ts`; `tests/e2e/tea-source-adapter.spec.ts` covers Desktop source flow; `tests/e2e/tea-mobile.spec.ts` covers Mobile Desk routing/order, short-screen selection/chat, strict gateway projection, request-reset isolation, transcript-revision Save, IndexedDB, the source departure marker, independent Bye, and overflow boundaries.

Intentional differences: source browser `apiConfigs` is replaced by a feature-scoped Room site companion; system prompts are rebuilt server-side and never trusted from the browser; provider key/model stay server-only; quota metadata is PostgreSQL-only and contains no dialogue text; Tea history stays in versioned Guest IndexedDB. Because the pinned Mobile source has no Tea engine, Mobile uses an adapter implementation composed from Desktop Tea assets/contracts and the authoritative Mobile fullscreen App shell. Mobile caps visitor rounds at 15 so Opening + all visible turns + the source Bye marker fit the strict 32-message public gateway contract; this is a public quota/protocol boundary rather than a presentation rewrite.

## Implemented evidence: Desktop Story runtime and Guest AI boundary

Feature: Desktop source Story plus Mobile fullscreen Story adapter

Upstream paths and symbols: Desktop `game/game_module.js:2344-2842` (`interactDesk`, setup/custom-script panels, `startAiGame`, `aiGameTurn`, `aiGameSend`, retry, progress/final Save, Replay/Exit) and `:5275-5647` (pixel Story window, day/night artwork, sprite frames, moods, bubble, save/error animation); Mobile `index.html` contains diary compatibility references but no complete Story engine.

Exact behavior to preserve: original five genres and horror settings; optional custom-script route; source introduction/setup/dialogue/choice hierarchy; strict JSON story/three-choice contract; 12–16 round ending target; mood animation; retry without duplicate rounds; stale-response rejection; always-available progress Save; ending Save/Replay/Exit; fallback raw-history save.

Reuse classification: exact Desktop runtime reuse with feature-scoped AI/storage adapters; Mobile adapter reuse only after the Desktop source contract is covered because the pinned Mobile snapshot has no authoritative Story implementation.

Implemented paths and adapters: `src/modules/story/contracts.ts`, `service.ts`, `http.ts`, `runtime.ts`, `source-adapter.ts`, `document-grant.ts`, `local-history.ts`, `local-history-browser.ts`, `mobile-state.ts`, and `mobile-story-client.tsx`; `src/modules/room/source-ai-adapter.ts`; `src/app/story/page.tsx`; `src/app/source-story-mobile.css`; Mobile Desk injection in `src/modules/home/source-home-frame.tsx`; `/api/ai/story`; shared provider/quota/repository modules. One Room adapter owns the original globals and scopes the companion to Tea/Story while Tarot remains unavailable.

Contract evidence: Story/provider/quota/HTTP/grant/history/source-router/mobile-state unit and integration tests cover source prompt/JSON and round bounds, exact prompt content, system-message stripping, one-time chained document authorization, shared concurrency/cost limits, whitespace-preserving long output, immutable ending snapshots, and progress/generating/document/raw records. `tests/e2e/story-source-adapter.spec.ts` covers original Desktop setup/pixel window/mood/progress Save, ending safety-write/final replacement, and disabled-AI recovery. `tests/e2e/story-mobile.spec.ts` covers Desk order/routing, short-screen setup, source assets/moods/choices, ending document replacement, stale-response rejection, four-segment truncation, IndexedDB, and overflow; final Mobile Story + Tea is 8/8 and Desktop Story + Tea is 6/6.

Intentional differences and approved reason: source browser API configuration and password-diary persistence cannot be public security/storage boundaries. Public Story uses a fixed server-held companion and browser-local versioned history; all unaffected Desktop visuals and interactions remain source-owned. Long document mode requires a server-issued, five-minute, one-time authorization chained across at most four segments; direct browser requests cannot self-select the costly document path. Custom Blog scripts remain unavailable to Guests until an explicit public-content projection exists, so private Owner posts are never exposed through `dbGetAll`. The pinned Mobile snapshot has no Story engine, so Mobile reuses the exact 608×375 Story window, five-column/two-row sprite, dialogue artwork, mood/round/save contracts and Mobile safe-area fullscreen shell; it deliberately crops the wide Desktop dialogue artwork with `cover` rather than distorting it or scaling the 1672×941 Room.

## Implemented evidence: Desktop Tarot runtime and Guest AI boundary

Feature: Desktop source Tarot plus a later Mobile fullscreen adapter

Upstream paths and symbols: Desktop `game/game_module.js:75-220` (22 majors, suits/ranks, 78-card builder, SVG face generator, two styles, five spreads), `:1761-2337` (guide, state, UI, fan picking, draw/reversal/fly animation, reading/follow-ups/save/reset/exit), and `:651-789` (source Tarot visual geometry); Mobile has no complete Tarot engine.

Exact behavior to preserve: 78 cards; two face styles; physical reversal; nearest-card fan interaction; 580ms fly/flip; Free/Single/Timeline/Cross/Star spreads; optional guide card; companion selection; initial reading; retry; three typed/preset follow-ups; action log; Reshuffle/Deck/Save/Exit.

Reuse classification: exact Desktop runtime reuse with feature-scoped AI/storage adapters; Mobile adapter reuse only after Desktop provider/history contracts pass.

Implemented paths and adapters: `src/modules/tarot/contracts.ts`, `source-adapter.ts`, `followup-grant.ts`, `service.ts`, `http.ts`, `runtime.ts`, `local-history.ts`, `local-history-browser.ts`, `mobile-state.ts`, and `mobile-tarot-client.tsx`; `/api/ai/tarot`; `/tarot`; `source-tarot-mobile.css`; Mobile Desk injection; shared Room AI adapter and AI quota/provider/repository modules. The same original global seam is feature-scoped across Tea, Story, and Tarot.

Contract evidence: Tarot contract/source/history/grant/service/HTTP tests cover all 78 unique cards, five spreads, exact fixed/free/guide slot counts, reversals, server prompts, one-time chained follow-up grants, the three-follow-up cap, quota metadata, and versioned local saves. `tests/e2e/tarot-source-adapter.spec.ts` proves the original 78-card fan, draw/fly/flip, companion selection, reading, follow-up, Save, IndexedDB, disabled-gateway retry, and Exit behavior.

Intentional differences and approved reason: browser provider configuration, Memory context, local password diary, and direct sensitive calls are invalid public boundaries. Public Tarot uses the fixed site companion and server quotas; card visuals and unaffected interaction remain source-owned. Each reading receives a ten-minute one-time follow-up capability, and each successful follow-up chains the next capability; altered/replayed history cannot spend the remaining allowance. Mobile uses the authoritative safe-area fullscreen shell and the same 78-card/spread/reversal contracts; compact generated Veil/Orrery faces replace no data or mechanics and the Desktop Room is never mounted.

Feature: Implemented-surface visual parity audit

Implemented paths and symbols: `src/modules/home/source-html-adapter.ts`, `src/app/reference/internal-beyond/[...path]/route.ts`, `src/app/source-public.css`, `src/app/source-room.css`, `src/app/blog/page.tsx`, `src/modules/content/blog-list-client.tsx`; source Desktop `InternalBeyond.html:71-89`, `:243-336`, `:2539-2785`, `:3368-3369`, `:27069-27362`; source Room `game/game_module.js:805-820`, `:1314-1347`.

Preserved behavior: source Home gloss-water branch; source Internal subpage background filter and pale overlay as separate layers; source navigation/module-intro/card/envelope blur; source Room full-height centering and game geometry; source Desktop/Mobile Music runtime surfaces.

Verification: raw route, snapshot, and original HTML all hash to `92F8255E6B710FEA150F3F08BC51737442C6CC2F707C3DCB4A64C4AC1FBE8D28`. Twelve-frame Home analysis reduced public mean luminance from `156.53` to `150.04` against source fallback `149.88`, and matched the source near-white-pixel ratio. Production browser captures: `audit-fixed-home.png`, `audit-final-blog.png`, `audit-final-letters.png`, `audit-final-room.png`, and `audit-source-room-entered.png`.

Reuse classification: exact source runtime reuse for Home/Music/Room internals; adapter reuse for server-backed Blog/Letters and public routing/identity/security.

Intentional differences: Keleoz branding and public copy replace upstream identity; Guest Blog hides local Owner/deferred controls; public Letters uses server submission/moderation; source-only clock, export/import, dock, local lock, API keys, and private identity controls are not exposed.

## Implemented evidence: Mobile Character Wardrobe and Sleep adapter

Feature: Mobile Character fullscreen App

Upstream paths and symbols: Desktop `game/game_module.js:50-70` (six exact outfits/assets), `:230-237` (fixed Wardrobe/Sleep lines), `:1517-1572` and `:1725-1750` (wake and two-stage Sleep flow), `:2850-2888` (Wardrobe flow), `:3637-3712` (idle/lie sprite rendering), `:3730-3763` (source state); Mobile `index.html:2453-2595` and its fullscreen Music/Calendar App surfaces provide the authoritative Desk/safe-area shell. The pinned Mobile snapshot contains no Wardrobe/Sleep engine.

Implemented paths and adapters: `src/modules/character/mobile-state.ts`, `mobile-character-client.tsx`, `src/app/character/page.tsx`, `src/app/source-character-mobile.css`, direct record access in `src/modules/room/source-state-browser.ts`, and Character Desk injection in `src/modules/home/source-home-frame.tsx`.

Preserved behavior: six source outfits and exact walk/idle/lie/portrait asset paths; all three random Wardrobe introductions; source Wardrobe hierarchy, labels and active styling; synchronized selected portrait/idle/lie assets; exact two-stage Sleep copy; 400ms lie transition; 800ms sleeping-frame cadence; tap wake; 800ms waking transition; source-disabled Zzz behavior; restored sleeping state briefly auto-wakes like a fresh Desktop Room load.

Reuse classification: exact reuse for source assets, labels, state schema, animation timing and Wardrobe surface values; adapter reuse for the Mobile safe-area fullscreen composition and direct versioned IndexedDB access. The 1672×941 Room engine is not mounted or scaled on Mobile.

Contract evidence: `tests/unit/character-mobile-state.test.ts` covers all six asset contracts, Wardrobe dialogue/selection, Sleep stages, wake projection, persisted hydration and corrupt fallback. `tests/e2e/character-mobile.spec.ts` covers Mobile Desk order/routing, six-item Wardrobe, selected portrait/idle/lie synchronization, shared version 1 `wardrobe-sleep` IndexedDB persistence, Sleep and wake at 390×667. Combined Mobile experience regression passed 12/12 and Desktop Room state bridge regression passed 4/4.

Intentional differences and approved reason: Keleoz replaces the upstream private character name; Mobile crops the exact Room artwork as a noninteractive stage instead of loading the Desktop pathfinding engine. Guest Character data remains entirely browser-local, with source localStorage used only as the existing degradation fallback when IndexedDB cannot operate.

## Implemented evidence: Projects, Moments, and About public skeleton

Feature: Typed public Projects / Moments / About publication and presentation

Upstream paths and symbols: Desktop Profile `InternalBeyond.html:3131-3306`, `:9041-9095`; Desktop InternetBeyond panel/card `:3725-3988`, `:16447-16540`; Mobile Space/Profile `index.html:2453-2479`, Circle markup `:2756-2775`, feed renderer `:14723-14820`, and styles `:16869-17022`; both ICode `projects` stores are explicitly not the public Project entity.

Implemented paths and adapters: typed routing/cache/action boundaries in `src/modules/content/routing.ts`, `cache.ts`, `actions.ts`, and `repository.ts`; generic Studio editor/preview under `src/app/studio/(protected)/content/[id]/`; public routes under `src/app/projects/`, `moments/`, `about/`, and `pages/`; source-backed renderers `public-projects.tsx`, `public-moments.tsx`, `public-about.tsx`, and `guest-comment-button.tsx`; shared navigation and Mobile Desk bindings in `source-public-nav.tsx` and `source-home-frame.tsx`.

Preserved behavior: Moments keeps the source Circle author/avatar/handle/time/visibility/text/comment hierarchy and mobile feed proportions. About keeps the Desktop 1.95:1 identity/bio/three-slot Profile card, switching at phone width to the Mobile Space cover/overlapping-avatar/bio/gallery stack. Projects uses source typography, glass, chronology and status vocabulary but never exposes or imitates the local ICode workspace data model.

Reuse classification: new domain presentation for Projects over the already-planned server content entity; adapter reuse for Moments/Circle and About/Profile; reimplementation remains limited to public PostgreSQL persistence, immutable versions, Full/Summary/Hidden projection, stable URLs, Owner authentication, cache invalidation and SEO metadata.

Contract evidence: `tests/unit/content-routing.test.ts` covers four-type route/slug parsing; `tests/integration/publish-repository.test.ts` proves type-isolated Project/Moment/Page list and detail queries; `tests/e2e/public-content-skeleton.spec.ts` covers the unified Desktop navigation and authoritative Mobile Desk routes. Manual real-browser evidence additionally covered non-empty Project/Moment/About rendering, Guest comment-to-Letters notice, and Owner login/create/autosave/publish/read flow.

Intentional differences and remaining scope: V1 Guests cannot post Circle comments; the visible comment action shows the agreed Member-unavailable notice and Letters alternative. This slice publishes Owner Moments only. AI Persona Moment generation, per-Persona permissions, moderation inbox, media gallery uploads and repost/location projections remain explicit later V1 work and are not claimed complete here.

## Implemented evidence: Timeline, Archive, Global Search, and Home continuity

Feature: Derived public continuity and discovery surfaces

Upstream paths and symbols: Desktop observatory Timeline styling `InternalBeyond.html:1191-1265` and Memory timeline layout/render functions around `:23573-23758`; Desktop Blog/reader/search controls `:2694-2709`, `:2947-2984`, `:5520-5534`; Mobile search controls `index.html:762-766`, `:1180-1182`, `:2038-2039`, and Mobile Desk/calendar/guide entries around `:2453-2520`. Source Archived behavior remains a mode/toggle inside owning modules rather than an independent data store.

Implemented paths and adapters: `src/modules/continuity/contracts.ts`; `listTimeline` / `searchPublic` in `src/modules/content/repository.ts`; timeline caching and publish invalidation in `cache.ts` / `actions.ts`; `/timeline` and `/search`; `src/modules/home/public-home-data.ts`, `public-home-sections.tsx`, and `src/app/source-continuity.css`; Desktop/Mobile navigation adapters in `source-public-nav.tsx` and `source-home-frame.tsx`.

Preserved behavior: observatory rail, luminous nodes, diamond month markers, italic month labels and glass records; compact glass search field, type filter, count feedback and stable result navigation; Archive as a view within Timeline; Mobile safe-area Desk entry and public-page menu language. The original source Home iframe remains the first exact `100svh` Scene and is not visually or behaviorally rewritten.

Reuse classification: exact visual-parameter reuse for the source observatory/search/glass vocabulary; adapter reuse for public navigation and Mobile Desk labels; new server projection for cross-type chronology and search because upstream local stores cannot provide stable public URLs, PostgreSQL authority, SEO or Exposure enforcement.

Contract evidence: `tests/unit/continuity-contracts.test.ts` covers chronology grouping, query bounds/CJK handling and Summary snippet isolation; `home-public-data.test.ts` covers partial-query degradation; `tests/integration/continuity-repository.test.ts` proves cross-type ordering, Hidden exclusion, Full body search and Summary metadata-only search; `tests/e2e/continuity-public.spec.ts` covers the untouched Desktop Scene boundary, below-fold continuation, Timeline/Archive/Search, Mobile Desk routing and mobile dropdown navigation.

Intentional differences and approved reason: Archive is `/timeline?view=archive`, not a primary navigation item or duplicate table. Search uses bounded PostgreSQL substring matching for the current single-server scale; Elasticsearch is intentionally absent. Mobile reassigns the source Calendar and Guide public tiles to Timeline and Search because private Calendar/Guide are outside the current public V1 boundary. Desktop renders the approved below-fold editorial sequence; Mobile keeps the authoritative Desk/App shell instead of adding an unreachable parent-page scroll behind the full-viewport iframe.

## Implemented evidence: AI Persona Moments moderation

Feature: Review-first AI Persona posts, comments/replies, and reposts

Upstream paths and symbols: Desktop Circle presentation `InternalBeyond.html:3724-3995`, post/comment/repost execution and permission language around `:16153-16800`; Mobile Circle markup/rendering `index.html:2740-2790`, `:14700-14855`, permission/operation contracts `:15165-15281`, and compact feed styling `:16850-17040`.

Implemented paths and adapters: `src/db/schema/persona.ts`; migration `drizzle/0003_spicy_jackpot.sql`; `src/modules/persona/contracts.ts`, `repository.ts`, `service.ts`, `runtime.ts`, and `actions.ts`; social Moment caches in `src/modules/content/cache.ts`; source-backed public projection in `public-moments.tsx`; Owner controls in `src/app/studio/(protected)/page.tsx`.

Preserved behavior: separate per-Persona publish, comment/reply, repost, and image-proposal permissions; clear author name/handle; source Circle body, repost quote, comment-box hierarchy, action labels, and compact Mobile feed behavior. Guest comments remain unavailable and retain the agreed Letters alternative.

Reuse classification: adapter reuse for Circle presentation and interaction contracts; reimplementation required only for Owner authentication, PostgreSQL authority, stable public URLs, immutable publication versions, cost reservation, and mandatory moderation. The source direct-write AI execution path is intentionally not reused because it would let generated operations bypass public-site review.

Contract evidence: `tests/unit/persona-review-contracts.test.ts` covers strict JSON, target binding, disabled state and four independent permissions; `persona-service.test.ts` covers review-only generation, provider isolation, cost reservation/failure and shared concurrency; `tests/integration/persona-review-repository.test.ts` covers pending non-disclosure, approval-time permission recheck, atomic post publication, source-hierarchy comments/replies/reposts, and reject/delete without public writes. Production-browser evidence covered Owner login, Persona creation, pending non-disclosure, edited approval, stable public AI identity and responsive 1440×900 / 390×844 Moments cards.

Intentional differences and remaining boundary: V1 never auto-publishes an AI operation. `imagePrompt` is a permission-gated review proposal only in this slice; it does not masquerade as a generated image. Media-backed image generation/upload and public gallery projection remain part of the later shared Media/LightCOS implementation.

## Implemented evidence: Shared Media Library and Persona Moment images

Feature: Owner image library, local/LightCOS storage boundary, and reviewed Persona attachments

Upstream paths and symbols: Desktop Circle thumbnails and public image/lightbox surfaces `InternalBeyond.html:3772`, `:3818-3819`, `:4022-4025`, `:16411-16508`; Mobile Circle upload thumbnails and one-to-three image grids `index.html:14620-14770`, `:16882`, `:17013-17020`.

Implemented paths and adapters: `src/modules/media/contracts.ts`, `storage.ts`, `repository.ts`, `service.ts`, `runtime.ts`, and `media-upload-form.tsx`; protected `/api/studio/media`; DB-gated local `/media/object/[...path]`; schema/migration `src/db/schema/media.ts` and `drizzle/0004_panoramic_scorpion.sql`; generic `content_media`; Persona review attachment and public projection in `src/modules/persona/repository.ts`; Circle media/lightbox in `source-moment-media.tsx`.

Preserved behavior: source one-to-three image grid bounds, square multi-image crops, single-image containment, source hover/zoom affordance, full-screen image viewing, and Mobile card proportions. AI image prompts remain separate from the actual ready media selected by the Owner.

Reuse classification: exact visual-parameter/interaction reuse for Circle image presentation; adapter reuse for the Owner upload/library and reviewed content attachment; reimplementation required for MIME verification, server persistence, immutable variants, stable URLs, LightCOS credentials, public cache headers, and moderation.

Contract evidence: `tests/unit/media-contracts.test.ts` covers byte-derived type/dimensions/hash, 10 MB/40 MP limits, WebP/AVIF variants and random ASCII keys; `media-storage.test.ts` covers local atomic/path-safe storage and LightCOS server-only put/delete/domain requests; `tests/integration/media-service.test.ts` covers six-variant persistence, partial-failure cleanup and hash deduplication; `persona-review-repository.test.ts` covers ready-only attachment, unready rejection and deletion of approved Persona publications. Production browser evidence covered Owner upload, six variants, Media Library, review selection, Desktop/Mobile Circle rendering, body-portal lightbox and cache-invalidating public deletion.

Intentional differences and remaining boundary: the local driver is fully exercised. The LightCOS driver uses the documented COS-compatible signature path and `<Bucket>.light-cos.com` object domain, but real cloud connectivity remains unclaimed until the user has a bucket, least-privilege credentials and custom public media domain. Original uploads are not retained; only bounded generated variants are stored. The ignored Phase 23 browser fixture directory remains locally orphaned because the host safety policy blocked deletion, while its database records are gone and its public route returns 404.

## Implemented evidence: Tiptap image and gallery blocks

Feature: Storage-independent image/gallery authoring in Blog, Project, Moment and Page drafts

Upstream paths and symbols: Desktop Circle image sizing/lightbox `InternalBeyond.html:3818-3819`, `:4022-4025`, `:16411-16508`; Mobile one-to-three grid behavior `index.html:14766-14770`, `:16882`, `:17013-17016`. The source Blog editor has no server-media entity, so its visual hierarchy is reused while public persistence is adapted.

Implemented paths and adapters: custom Tiptap nodes in `src/modules/content/extensions.ts`; validation/plain-text contracts in `media-nodes.ts`; sanitizer/static HTML in `document.ts`; editor builders and palette in `src/modules/editor/media-nodes.ts` and `blog-editor-client.tsx`; stable `/media/[id]/[variant]`; publication ready-media validation and `content_media` refresh in `src/modules/content/repository.ts`; public/editor responsive styles in `globals.css` and `source-public.css`.

Preserved behavior: one-image compact/content/wide layouts; two-to-three image source grid; alt/caption semantics; selectable/draggable block behavior; source-like square gallery crops; Desktop/Mobile reader containment. Existing source reader search, font controls and public navigation remain unchanged.

Reuse classification: adapter reuse for Tiptap authoring and server-backed media identities; exact visual-parameter reuse for image/gallery dimensions. Reimplementation is limited to ready-media authority, UUID-only JSON, stable driver-independent routes, sanitizer allowlists and immutable publication attachment tracking.

Contract evidence: `tests/unit/content-document.test.ts` covers safe image/gallery HTML, UUIDs, three-image limit, sanitized captions and searchable text; `editor-media-nodes.test.ts` proves JSON excludes filenames/storage URLs; `tests/integration/publish-repository.test.ts` proves unready media cannot move the publication pointer and ready media atomically updates `content_media`; `media-service.test.ts` covers stable variant resolution. Production browser evidence covered insertion, revision autosave, Guest Preview, Full publish, desktop/mobile public reading and Hidden republish to 404.

Intentional differences and remaining boundary: Phase 24 covers image and gallery blocks only. Audio, video and generic attachment blocks remain later media-type work and are not shown as empty editor controls. Gallery browser layout is source-backed and contract-tested; the single available ready fixture limited the live browser insertion flow to an image block without inventing duplicate media.

## Implemented evidence: Audio, video, and attachment media blocks

Feature: Verified original-object media plus native public playback/download blocks

Upstream paths and symbols: source Music/player glass-control language remains authoritative for the dedicated Music experience; Phase 25 reuses the quieter public reader/glass vocabulary rather than embedding or rewriting the source player. The source has no public server attachment entity, so only its spacing, borders and control hierarchy apply.

Implemented paths and adapters: byte contracts and safe disposition in `src/modules/media/contracts.ts`; original-object storage/service/deletion in `storage.ts`, `service.ts`, `repository.ts`; byte-range parser `http-range.ts`; stable original route `src/app/media/[id]/[variant]/route.ts`; generalized upload/delete UI and API; audio/video/attachment nodes in `content/media-nodes.ts`, `extensions.ts` and editor builders/palette; public/editor styles in `source-public.css` and `globals.css`.

Preserved behavior: existing source Music is untouched. Article media uses native accessible controls, bounded glass surfaces, captions/descriptions, stable keyboard-focusable attachment links and mobile containment. No unsupported empty buttons appear when a media kind is absent.

Reuse classification: adapter reuse for the existing Media Library/UUID/publishing boundary; reimplementation required for byte signatures, safe original-object URLs, download headers, range responses and native Tiptap nodes. No separate transcoding service, FFmpeg worker or large-video subsystem is introduced.

Contract evidence: `media-file-contracts.test.ts` covers WAV/MP4/PDF/text detection, executable rejection, limits, keys and disposition; `media-http-range.test.ts` covers bounded/open/suffix/invalid byte ranges; `media-storage.test.ts` covers LightCOS Content-Disposition; `media-service.test.ts` covers original-object persistence/deletion; `content-document.test.ts` and `editor-media-nodes.test.ts` cover UUID-only nodes and safe HTML; `publish-repository.test.ts` rejects node/MIME mismatches. Browser evidence covered WAV playback, Markdown download, generated WebM upload/playback/dimensions, mobile layout, 206 range responses and two-step physical deletion.

Intentional differences and remaining boundary: image uploads retain the 10 MB/40 MP transform rules; audio/attachments cap at 20 MB and short video at 25 MB. Audio/video originals are not transcoded, so the Owner must choose browser-compatible formats. The real video fixture was generated locally with Canvas/MediaRecorder and is retained only under ignored browser evidence; no external media was downloaded.

## Implemented evidence: Advanced editor blocks and formatting tools

Feature: Structured callout, collapsible, automatic TOC and public-content reference blocks

Upstream paths and symbols: Desktop Blog editor/reader surfaces `InternalBeyond.html:2694-2709`, `:2803-2845`, `:5490-5546`, `:8390-8705`; Desktop Guide TOC/collapse styling `:1295-1314`; Mobile Blog editor/reader flow `index.html:3792-3820`, `:12125-12320`, `:12587-12620`. Neither snapshot provides a public server-backed structured-document or stable cross-content reference entity.

Implemented paths and adapters: document normalization and validation in `src/modules/content/advanced-nodes.ts` and `document.ts`; custom Tiptap nodes in `extensions.ts`; editor builders and source-styled controls in `src/modules/editor/advanced-nodes.ts` and `blog-editor-client.tsx`; server-projected public choices in the protected editor pages; responsive public/editor styling in `source-public.css` and `globals.css`.

Preserved behavior: the existing source reader shell, typography, glass hierarchy and Mobile containment remain unchanged. Collapsibles use native disclosure behavior; TOC links resolve to stable heading IDs; formatting exposes the StarterKit capabilities already present in the editor rather than introducing another editor system.

Reuse classification: adapter reuse for the established Tiptap/autosave/publication boundary and source visual language; reimplementation required for safe nested nodes, heading-ID normalization, derived TOC state and published-only cross-content projections. No upstream private local record is exposed or copied into public choices.

Contract evidence: `content-advanced-blocks.test.ts` covers nested text, safe HTML, stable/deduplicated anchors, regenerated H2/H3 TOC entries and references; `editor-advanced-nodes.test.ts` covers insertion JSON; full regression passed 59 files / 210 tests. Production browser evidence covered H2 formatting, revision 9 autosave/reload, published Project-only reference projection before self-publication, Guest Preview, Desktop/Mobile public reading, TOC fragment binding, native disclosure interaction and revision 10 Hidden republish to a real 404.

Intentional differences and remaining boundary: reference cards target only currently published Full/Summary Blog, Project, Moment and Page routes; Hidden drafts never enter the client projection. TOC entries are regenerated from authoritative headings on save/render instead of being manually edited. Advanced blocks are complete for V1 authoring; backlinks, arbitrary embeds and collaborative editing remain outside this phase.

## Implemented evidence: Immutable publication history and restore-to-draft

Feature: Owner publication-version history, historical preview and safe draft restoration

Upstream paths and symbols: Desktop Blog editor/reader surfaces `InternalBeyond.html:2694-2709`, `:2803-2845`, `:5490-5546`, `:8390-8705`; Mobile Blog editor/reader flow `index.html:3792-3820`, `:12125-12320`, `:12587-12620`. Both snapshots remain visual/interaction references; neither provides the public server's immutable-version pointer or optimistic multi-request draft contract.

Implemented paths and adapters: ordered list/detail/restore transactions in `src/modules/content/repository.ts`; authenticated restore action in `content/actions.ts`; shared live-revision panel in `src/modules/editor/content-version-history.tsx` and the existing editor client/shell; canonical protected preview under `/studio/content/[id]/versions/[versionId]`; source-dark responsive styling in `globals.css`.

Preserved behavior: the existing Blog/Project/Moment/Page editor, source typography, dark glass hierarchy, autosave state and public readers remain unchanged. Generic and legacy Blog editor routes share the same history component; public routes receive no history API or unpublished document data.

Reuse classification: adapter reuse for the established Tiptap/autosave/Studio presentation; reimplementation required for PostgreSQL immutable versions, entry-scoped lookup, current-pointer marking, optimistic restore and Owner authorization. Restore copies one version into the mutable draft and never emulates a public pointer rollback.

Contract evidence: `publish-repository.test.ts` covers newest-first lightweight rows, current marking, entry-scoped detail, atomic draft copy, revision conflict, immutable retention and unchanged publication pointer. Full regression passed 59 files / 212 tests. Production browser evidence covered Version 1/2 publication, protected Version 1 preview, revision 5 restore, unchanged Version 2 public HTML, revision 6 autosave continuation, explicit Version 3 republish, responsive 390×844 history, Hidden Version 4 cleanup and exact public 404.

Intentional differences and remaining boundary: published versions cannot be edited or deleted from this UI. Restore does not publish automatically and stale revision forms fail rather than overwrite a newer autosave. Historical missing-media references may return to a draft, but the existing ready-media publication check prevents them from becoming a broken public version.

## Implemented evidence: Complete V1 basic editor formatting

Feature: Task lists plus complete source-backed inline/block formatting controls

Upstream paths and symbols: Desktop Blog Markdown toolbar `InternalBeyond.html:5570-5594` exposes headings, bold, italic, inline code, quote, unordered/ordered lists, code block, horizontal rule and Link; Mobile Blog editor `index.html:3792-3820` intentionally remains a simpler text/Markdown surface. Task lists are a V1 structured-editor addition rather than an upstream feature.

Implemented paths and adapters: official Tiptap task-list/task-item 3.30.3 extensions in `package.json` and `src/modules/content/extensions.ts`; searchable/sanitized static rendering in `document.ts`; safe Link/range contracts in `src/modules/editor/formatting.ts`; controls in the existing `blog-editor-client.tsx`; dark editor and source-reader styles in `globals.css` and `source-public.css`.

Preserved behavior: inline code, Link and Divider map directly to the Desktop toolbar concepts and stay inside the existing dynamically loaded Studio editor. Public Blog typography/navigation are unchanged. Task checkboxes are interactive only while editing and forced disabled in Preview/public HTML.

Reuse classification: exact interaction reuse for the Desktop formatting vocabulary; adapter reuse through the existing Tiptap/autosave/sanitizer/publication pipeline; minimal new implementation for V1 task nodes and safe delayed Link selection. No second editor, renderer or public script was introduced.

Contract evidence: `content-document.test.ts` covers checked/unchecked task HTML, disabled inputs and searchable line separation; `editor-formatting.test.ts` covers safe schemes, hostile/credentialed URL rejection, non-collapsed range retention and inline-code incompatibility. Full regression passed 60 files / 217 tests. Production browser evidence covered invalid Link rejection, task creation/checking, inline code, safe internal Link, Divider, revision autosave, Guest Preview, Full publish, 390×844 public layout, Hidden republish and exact 404.

Intentional differences and remaining boundary: the source Desktop toolbar uses Markdown insertion while Continuum invokes equivalent Tiptap commands. Task lists are added because the approved V1 block list requires them. Inline code and Link are mutually exclusive and the UI now says so instead of silently failing. Drag handles/block reordering remain a separate interaction enhancement.

## Implemented evidence: Studio lifecycle management and block ordering

Feature: Filterable Owner content catalog, reversible withdrawal/archive, password-confirmed deletion and top-level block ordering

Upstream paths and symbols: Desktop Blog list/editor `InternalBeyond.html:5490-5600`, `:8390-8705`; Mobile Blog editor/list flow `index.html:3792-3820`, `:12125-12620`. Their local-record controls inform labels and compact hierarchy, while public PostgreSQL lifecycle/auth cannot be copied from browser-local source stores.

Implemented paths and adapters: filtered catalog and lifecycle transactions in `src/modules/content/repository.ts`; authenticated cache-invalidating actions in `content/actions.ts`; bounded password form in `studio-content-controls.tsx`; top-of-Studio catalog in the protected Studio page; pure ordering in `src/modules/editor/block-order.ts` and live controls in the existing editor client; responsive Studio styling in `globals.css`.

Preserved behavior: existing source-derived public readers, editor formatting/media/advanced blocks, immutable versions, Letters, Media and Persona sections remain unchanged. Ordering moves the selected top-level JSON node as a whole, so nested callout/task/gallery content is not reauthored.

Reuse classification: adapter reuse for source visual vocabulary and the existing Tiptap/Studio shell; reimplementation required for server-side filters, publication withdrawal, Owner reauthentication, PostgreSQL cascade boundaries and cache invalidation. No client catalog API, drag library or extra service was introduced.

Contract evidence: `draft-repository.test.ts` covers bounded filters, archive-to-404, version preservation, restore-without-republish and archived-only delete; `editor-block-order.test.ts` covers immutable boundary movement and selection-position mapping; `content-document.test.ts` covers duplicate split-ID normalization. Full regression passed 61 files / 224 tests. Production browser evidence covered two content types/states, combined filters/reset, block reorder plus autosave, Full publish, archive 404, restore, wrong/correct password deletion, and 390×844 catalog/delete layouts.

Intentional differences and remaining boundary: Studio Archive is an Owner shelving/withdrawal state and removes public visibility; public `/timeline?view=archive` remains the separate derived long-term reading view. Restore returns to draft and never republishes. Permanent delete requires archive plus current password. Ordering uses explicit Move controls for keyboard/mobile reliability rather than a pointer-only drag handle.
