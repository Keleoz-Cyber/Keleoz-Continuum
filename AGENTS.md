# Keleoz Continuum Agent Rules

## Required reading before product work

Before planning, implementing, reviewing, or refactoring Keleoz Continuum, read:

1. `docs/design/Keleoz_Continuum_V1_设计基线_2026-08-26.md`
2. `docs/SOURCE_PROVENANCE.md`
3. `docs/SOURCE_REUSE_LEDGER.md`
4. The relevant Desktop and Mobile upstream modules under `upstream/`.

## Upstream snapshots are immutable

- `upstream/InternalBeyond-Desktop/` and `upstream/InternalBeyond-Mobile/` are read-only reference snapshots.
- Do not edit, format, rename, delete, optimize, or generate build output inside either snapshot.
- Do not implement the new product by destructively trimming either monolithic HTML file.
- When a newer upstream version is needed, add a separately identified snapshot or use a documented refresh procedure. Never silently overwrite the evidence baseline.

## Reuse-first gate

For every feature or visual change:

1. Search both upstream snapshots first with `rg`.
2. Identify matching HTML, CSS, JavaScript, prompts, assets, interactions, and data contracts.
3. Record the source paths and chosen reuse strategy in `docs/SOURCE_REUSE_LEDGER.md`.
4. Classify the work as one of:
   - **Exact reuse** — copy/extract behavior and visuals without redesign.
   - **Adapter reuse** — preserve behavior behind new storage, auth, AI, or UI adapters.
   - **Reimplementation required** — only for public security, server persistence, stable URLs, SEO, moderation, quotas, or another documented incompatibility.
   - **Deferred** — not part of the current release; do not delete the upstream implementation.
5. Explain why exact or adapter reuse is not possible before designing a replacement.

“Cleaner to rewrite” is not sufficient justification. Existing behavior, visual polish, and interaction details are product requirements unless the design baseline explicitly changes them.

## Functional preservation

- Add contract tests for reused behavior before retiring or omitting the old execution path.
- Desktop and Mobile are equally authoritative for their own interaction surfaces.
- The target is one product and one codebase with shared domain logic, plus distinct Desktop and Mobile shells.
- Do not force the 1672×941 Desktop Room into the Mobile shell. Mobile Tea, Story, and Tarot are fullscreen apps; Character carries Wardrobe and Sleep.
- Do not claim a module is complete because a route or placeholder opens. Verify the original interaction contract.

## Product boundaries

- Public content and Owner data use the new server architecture.
- Guest Tea, Story, Tarot, Wardrobe, and Sleep history stays local in versioned IndexedDB for V1.
- Site API keys never go to the browser.
- Guest AI calls go through the server gateway with feature quotas, concurrency limits, a daily cost cap, and a kill switch.
- Upstream local lock screens, local API-key storage, and direct sensitive-tool calls are references, not public security mechanisms.

## Visual and language rules

- Preserve the reference project's atmosphere where it remains compatible with Keleoz Continuum.
- Do not turn Home into a dashboard, generic blog template, card grid, or SaaS admin UI.
- Language follows context: use Chinese, English, or selective bilingual treatment according to readability, efficiency, visual quality, and meaning.
- Public branding is Keleoz Continuum. Do not present Internal Beyond, Sui, IB, or upstream logos as the new product identity.

## Licensing

- The project is noncommercial unless a new explicit decision and appropriate permissions are documented.
- Preserve upstream code and asset license files and required notices.
- Maintain a Credits / License surface and state that Keleoz Continuum is a modified, unofficial noncommercial work using portions of Internal Beyond.
- Never imply endorsement by Sui or the upstream project.
