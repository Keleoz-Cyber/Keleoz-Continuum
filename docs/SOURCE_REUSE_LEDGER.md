# Source Reuse Ledger

This ledger is a required implementation gate. Update source pointers and evidence as modules are extracted or adapted.

| Product area | Desktop source | Mobile source | V1 strategy | Preservation contract |
|---|---|---|---|---|
| Home scene | `InternalBeyond.html` background, splash, rain, frost, theme sections | Mobile theme and safe-area patterns | Adapter reuse | Preserve atmosphere and motion; replace brand and content hierarchy |
| Desktop navigation/windows | Navbar, page overlay, Music/Chat/Calendar/Circle/ICode floating panels | Not authoritative | Adapter reuse | Preserve window language, drag/resize where appropriate |
| Mobile shell | Not authoritative | Desk, Space, Circle, drawer, dock, widget, fullscreen-app sections in `index.html` | Adapter reuse | Preserve mobile-native interaction; share domain services |
| Blog reading | Blog list, reader, search, annotations, diary/editor behavior | Mobile journal cards, reader, side sheet | Adapter reuse | Preserve reading details; replace local persistence and editor core |
| Online editor | Existing Blog editor is reference only | Existing Blog editor is reference only | Reimplementation required | Tiptap block editor, autosave, versions, preview, stable URL |
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
| Calendar | Full calendar, lunar/solar calculations, events and notes | Mobile Calendar App and widgets | Deferred V1 public depth | Preserve algorithms for later Owner integration; basic Timeline events only |
| Memory | Scoring, visibility, star map and Auto Memory | Mobile Memory and Persona dossier | Deferred | Do not delete; preserve for later Owner and Projection phases |
| Chat | Full chat, groups, topics, streaming, actions and summaries | Mobile Chat, side drawer and bubbles | Deferred except shared AI protocols | Extract protocols and cards now; complete Owner Chat later |
| ICode | Workspace, operations, rich files and sandbox | Mobile workspace and GitHub section | Deferred | Preserve references; do not expose Owner workspace publicly |
| AI gateway | Browser-direct provider functions | Browser-direct provider functions | Reimplementation required | Server-held keys, streaming adapters, quotas, cost cap, kill switch |
| Authentication | Local lock/password patterns are not web auth | Mobile lock screen is local privacy only | Reimplementation required | V1 one Owner account; future Member email login |
| Exposure | Local visibility fields provide semantics | Shared visibility semantics | Reimplementation required | Server-enforced Full/Summary/Hidden in V1; no client-side secrecy |
| Timeline/Archive/Search | Partial calendar/history/search references | Partial history/search references | New domain views | Derive from published entities; PostgreSQL-backed search |
| PWA | No authoritative PWA shell | `manifest.webmanifest`, `ib-sw.js`, safe-area/native bridge patterns | Adapter reuse | Rebuild caching for dynamic/authenticated site; preserve install and safe-area UX |
| Visual customization | Desktop themes and DIY assets | Mobile Visual page, presets and widget materials | Adapter reuse, phased | Owner controls the published space; do not expose unsafe client configuration |
| Data/backup | IndexedDB export/import contracts | Shared backup schema | Reimplementation required | PostgreSQL backups, readable JSON export, LightCOS media inventory |

## Per-feature evidence template

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

Feature: Desktop Room runtime

Implemented paths and symbols: `src/modules/room/room-client.tsx`, `src/app/room/page.tsx`, `src/app/game/[...path]/route.ts`, `src/app/source-room.css`; source `upstream/InternalBeyond-Desktop/game/game_module.js` and its `game/` artwork assets.

Preserved behavior: original 1672×941 pixel room, source asset loading, character state machine, walkable area and A* pathfinding, interaction markers, sidebar actions, day/night layers, and the original Tea/Story/Tarot/Wardrobe/Sleep entry points.

Reuse classification: Exact runtime reuse through a thin host/navigation adapter and a traversal-safe immutable-source asset route.

Intentional differences: the public host does not expose the upstream local lock or browser API-key mechanisms; Mobile does not squeeze the Desktop Room into a phone viewport and will receive its own fullscreen App adapters.
