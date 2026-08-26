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
