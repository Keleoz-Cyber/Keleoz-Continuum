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
