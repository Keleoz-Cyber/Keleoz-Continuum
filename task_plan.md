# Task Plan: Continuum 第一子项目实施规划

## Goal
为 Keleoz Continuum 制定可执行、可验证的第一子项目实施计划，覆盖工程基础、Owner 登录和内容发布闭环，同时固化上游复用证据。

## Current Phase
Phase 16 in progress: source-exact Tea with a public server AI and quota adapter

## Phases

### Phase 1: Requirements & Discovery
- [x] Read repository rules and V1 design baseline
- [x] Confirm this plan covers only the first independently testable sub-project
- [x] Capture current repository state
- **Status:** complete

### Phase 2: Upstream Evidence & Architecture
- [x] Read the complete provenance and reuse ledger
- [x] Search both upstream snapshots for relevant auth, editor, content, media, search, and data contracts
- [x] Lock the first-subproject file structure and technology choices
- **Status:** complete

### Phase 3: Write Implementation Plan
- [x] Create the detailed TDD implementation plan under `docs/superpowers/plans/`
- [x] Include exact files, commands, expected failures, implementation snippets, and commits
- [x] Append first-subproject decisions to the reuse ledger
- **Status:** complete

### Phase 4: Self-Review & Verification
- [x] Check plan coverage against the V1 baseline
- [x] Scan for placeholders and inconsistent types or paths
- [x] Verify repository diff and Markdown structure
- **Status:** complete

### Phase 5: Delivery
- [x] Log final results in `progress.md`
- [x] Present execution choices without starting unapproved implementation
- **Status:** complete

### Phase 6: Implement Foundation Checkpoint
- [x] Execute Tasks 1-3 in the current `main` checkout
- [x] Use targeted local tests during development
- [x] Run one proportional checkpoint verification after scaffold and schema are complete
- **Status:** complete

### Phase 7: Implement Security and Publishing Domain
- [x] Execute Tasks 4-6 without adding branches or remote CI
- [x] Use focused RED/GREEN tests for auth, projections, drafts, and publishing
- [x] Run one proportional checkpoint verification
- **Status:** complete

### Phase 8: Implement Owner Studio and Public Blog
- [x] Execute Tasks 7-9 in the current checkout
- [x] Add Owner login, autosaving Tiptap Studio, Guest Preview, and public Blog reader
- [x] Run one proportional browser-visible checkpoint verification
- **Status:** complete

### Phase 9: Continue Continuum Experience Modules
- [x] Build final Home/Desktop/Mobile shells while preserving the current public content core
- [x] Adapt Letters submission, public wall, Owner review, and reply in a focused slice
- [x] Adapt source-exact Music and Desktop Room, including Wardrobe and Sleep
- [ ] Adapt Desktop/Mobile Tea, Story, Tarot, and Moments in focused slices
- [ ] Keep one local checkpoint suite per usable milestone; defer full release matrix until launch preparation
- **Status:** in_progress

### Phase 10: Source-exact Frontend Recovery
- [x] Preserve a single rollback tag without creating another branch
- [x] Replace the custom Home visual/interaction layer with source-extracted Desktop behavior and assets
- [x] Replace Music, Blog, and Letters presentation with source-extracted structures while retaining public adapters
- [x] Restore the authoritative Mobile shell from the Mobile source instead of shrinking the Desktop shell
- [x] Verify source parity in a real browser at desktop and mobile viewport sizes
- **Status:** complete

### Phase 11: Room Source Runtime Adapter
- [x] Serve the immutable Room engine and assets through a traversal-safe Next route
- [x] Run the source game module inside a host page without rewriting its engine or artwork
- [x] Preserve the 1672×941 Desktop Room behavior and avoid squeezing it into Mobile
- [x] Verify Room interactions and production build together with the public shells
- **Status:** complete

### Phase 12: Home Exact Runtime Boundary
- [x] Prove the local source, immutable snapshot, and live source route are byte-identical
- [x] Run the original Home runtime inside the public route instead of a second visual implementation
- [x] Apply only in-memory branding, public navigation, and local-only control adapters
- [x] Verify original mode toggle, enter timeline, Canvas stack, and Music transparency in a real browser
- **Status:** complete

### Phase 13: Implemented-Surface Source Parity Audit
- [x] Capture comparable source/public screenshots and computed-style evidence for Desktop Home, Blog, Letters, Room, and Music
- [x] Classify every visible difference as exact-source behavior, public-site-required adaptation, or unintended drift
- [x] Diagnose Home brightness and ripple sparkle from the actual layer/compositing branches before changing parameters
- [x] Diagnose Blog/Letters background brightness from source overlay and page-layer values before changing colors
- [x] Correct confirmed unintended drift with source values or the thinnest compatible adapter
- [x] Re-run desktop/mobile browser checks and the proportional local verification suite
- **Status:** complete

### Phase 14: Completion-Review Hardening
- [x] Revalidate adapted-source cache semantics and bust the previously immutable query URL
- [x] Make optional Owner decoration fail closed without blocking public content
- [x] Remove non-standard stack dependence from the source gloss bootstrap and test idempotence
- [x] Exclude Mobile Room boundary note from the Desktop background overlay
- [x] Re-run browser smoke and full local verification after review fixes
- **Status:** complete

### Phase 15: Wardrobe and Sleep Source Contract
- [x] Capture the original Wardrobe and Sleep interaction/state contracts from the immutable Desktop source
- [x] Reproduce both flows in the public Room host and identify only host/storage/identity incompatibilities
- [x] Add contract coverage before introducing any adapter behavior
- [x] Preserve the source UI, six-outfit sprite synchronization, bed dialogue, sleep frames, and wake flow
- [x] Move Guest Wardrobe/Sleep persistence behind a versioned browser-local adapter without editing the snapshot
- [x] Verify source/public behavior in a real browser and run one proportional local checkpoint
- **Status:** complete

### Phase 16: Tea Source Runtime and Guest AI Boundary
- [x] Capture the immutable source Tea selection, 25-combination, animation, chat, and save contracts
- [x] Define the shared server-held AI provider and quota contracts with focused RED/GREEN tests
- [x] Add PostgreSQL request reservations for per-source, per-session, cooldown, concurrency, and daily-budget enforcement
- [x] Inject only the public `apiConfigs` / `callApiChat` / local-history seams while keeping source Tea UI and animation untouched
- [x] Keep Tea history in versioned browser IndexedDB and never persist Guest dialogue text on the server
- [x] Verify original Desktop selection/animation/chat behavior and failure states in a real browser
- [x] Run one proportional local checkpoint and source-reuse review
- [ ] Add the Mobile fullscreen Tea adapter from the same contracts (the pinned Mobile source has no complete Tea equivalent)
- **Status:** in_progress

## Key Questions
1. What is the smallest complete vertical slice that proves Owner creation and Guest reading?
2. Which behaviors and contracts from Desktop and Mobile should be reused in this first slice?
3. Which storage, auth, publishing, and media boundaries must be new for a public site?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Plan only the first independently testable sub-project | The V1 baseline explicitly rejects one giant implementation plan |
| Preserve both `upstream/` snapshots unchanged | Repository rules make them immutable reuse evidence |
| Use TDD for production behavior in the execution plan | Auth, exposure, publishing, and versioning carry meaningful regression risk |
| Root-level single Next.js application | Avoids workspace/monorepo overhead for one deployable process |
| Drizzle ORM with `pg` and PostgreSQL | Provides typed SQL and transactions with a small runtime surface |
| Custom single-Owner Argon2id authentication with opaque DB sessions | Meets the chosen V1 identity model without bringing future Member flows forward |
| Immutable content versions with a draft pointer and published-version pointer | Failed publishing cannot damage the currently visible article |
| Tiptap is dynamically loaded only in Studio | Keeps the heavy editor out of public page bundles |
| Local media adapter first, LightCOS adapter in its own later subproject | Proves the boundary without blocking local development on domain/credential setup |
| Work directly in the current `main` checkout | User explicitly requested no proliferation of branches or worktrees |
| Group commits and avoid routine remote CI | User prefers short local feedback loops; full E2E, Docker matrix, and pressure tests remain later release gates |
| Treat source-exact presentation as the default for unaffected UI | The previous reference-inspired rewrite lost upstream detail; only public data, auth, moderation, routing, and branding justify adapters |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Combined required-reading output was truncated | 1 | Re-read the relevant documents in focused calls before making architecture decisions |
| Docker daemon probe returned no output before the command boundary | 1 | Treat Docker CLI presence as confirmed but verify daemon availability at execution Task 1 before database work |
| Large self-review patch did not match the plan's Unicode tree context | 1 | Split corrections into focused patches after reading exact surrounding lines |
| First Markdown diff check found trailing spaces in reuse-ledger evidence | 1 | Reformat evidence fields as separated paragraphs and rerun `git diff --check` |
| Second multi-section consistency patch missed an `Expose:` heading | 2 | Stop using large patches; edit one exact plan section per patch |
| pnpm development dependency install failed with Windows `EPERM` while creating a transitive symlink | 1 | Inspect partial state, then switch to `node-linker=hoisted` rather than repeating isolated-linker installation |
| Forced hoisted reinstall began downloading many irrelevant platform binaries | 2 | Abort the process, pin dev dependencies in the manifest, restrict supported architectures to Windows/Linux x64, and reinstall without `--force` |
| Latest ESLint 10 and TypeScript 7 violate current Next ESLint peer ranges; pnpm blocked required native helper builds | 1 | Pin ESLint 9 and TypeScript 5.9, allow only `esbuild` and `unrs-resolver` build scripts, then reinstall normally |
| pnpm 11.19 ignored the legacy `onlyBuiltDependencies` declaration | 1 | Inspect the installed pnpm 11 help/config and use its current narrow allow mechanism |
| Combined Task 1 log and Task 2 test patch missed a changed plan heading | 1 | Separate code/test patches from execution-log patches and stop editing detailed-plan checkboxes inline |
| Zod `z.url()` ignored two attempted custom error overrides | 2 | Replace the URL primitive with explicit safe URL/protocol predicates and stable field-specific messages |
| Task 2 config patch again included a stale progress-log context | 1 | Apply only product/config files in code patches; append progress separately after verification |
| Docker CLI could not reach the Docker Desktop Linux engine | 1 | Start the installed Docker Desktop background service, then use a bounded readiness check |
| Cleanup of ignored `.playwright-cli/` was blocked by the local destructive-command policy | 1 | Keep the exact temporary directory ignored and leave it untracked; do not bypass the safety policy |
| PowerShell did not capture the composed `psql` existence query and `.Trim()` hit null | 1 | Separate the read-only database existence query from the conditional create command |
| First checkpoint typecheck rejected invalid-environment fixtures against Next-augmented `ProcessEnv` | 1 | Accept a generic string/undefined environment record at the parser boundary; keep strict validated return type |
| Initial Task 4 findings patch targeted a nonexistent sentence | 1 | Locate exact persistent-file sections before applying small log-only patches |
| Task 4 aggregate run could not reach PostgreSQL after the host crossed sessions | 1 | Restore the existing Docker Desktop/container runtime, then rerun unchanged integration tests |
| Docker Desktop processes started but three engine/status probes did not respond | 3 | Stop polling; continue Task 5 unit work and retry the database once after useful progress |
| Phase 7 typecheck rejected an ambient Argon2 const enum and a generic Vitest matcher | 1 | Use the Argon2id numeric literal under `Options` type checking and a `satisfies` assertion object |
| Checkpoint 2 full test run exposed cross-file database cleanup races | 1 | Serialize the small Vitest file set so integration files can safely share the dedicated test database |
| Playwright CLI opened the dev server through `127.0.0.1` and Next blocked dev chunks as cross-origin | 1 | Add explicit local `allowedDevOrigins` and restart the dev server |
| Phase 9 Letters RED test could not import the new contracts module | 1 | Add a typed no-op scaffold, rerun to obtain behavior failures, then implement the contract |
| Phase 9 Letters repository RED test could not import the repository module | 1 | Add a typed no-op repository scaffold, rerun to obtain persistence behavior failures, then implement the repository |
| Playwright `goto` was invoked after the prior browser session had closed | 1 | Start a fresh CLI browser with `open`, then navigate and snapshot |
| A composed Playwright command was malformed in the orchestration wrapper | 1 | Split the interaction into a simpler command and re-snapshot before using refs |
| PowerShell `git add` parsed `src/app/studio/(protected)/page.tsx` as an expression | 1 | Quote the parenthesized path and stage the intended files explicitly |
| Phase 9 Music RED test could not import the contracts module | 1 | Add a typed no-op scaffold, rerun to obtain playback-rule failures, then implement the contracts |
| Dev server briefly reported a missing Letters client during the delete/re-add replacement window | 1 | Complete the file replacement before browsing; final HMR compilation and `/letters` response succeeded |
| Home queue refactor left an old `track` JSX reference during HMR | 1 | Replace all old single-track references with `currentTrack`; fresh `/` reload returned 200 and rendered the welcome scene |
| Source-exact Canvas adapters lost DOM null narrowing inside nested animation callbacks | 1 | Keep the guarded DOM acquisition but bind non-null lifecycle-local aliases before declaring callbacks |
| `SourceMist` reran after the hidden state removed its canvas and accessed a null ref | 1 | Check the ref before acquiring the context, then bind explicit non-null aliases for the animation callbacks |
| Room engine initialized but its original navigation hook had no-op page activation in the new host | 1 | Provide a minimal host `navTo` adapter that toggles the injected page active before the source engine opens the page |
| React development remounts could leave a source Canvas RAF alive after effect cleanup | 1 | Add an explicit stopped guard to every source animation loop before scheduling its next frame |
| Public Home initially had no source `ibModeToggle` state and mounted its signature above the title | 1 | Restore the source two-layer splash swap, measured signature translation, and independent glass-board toggle |
| Signature measurement computed correctly but CSS `splashFadeUp` animation overrode the inline transform | 1 | Disable the source entrance animation before applying the measured brand-mode translation, matching `ibModeToggle` |
| First iframe adapter string contained literal newlines inside an injected single-quoted CSS string | 1 | Remove the unnecessary line breaks so the in-memory adapter script parses as valid JavaScript |
| HTTP same-origin Canvas readback made the source refracted 320-grid layer replace the high-resolution image, unlike the offline file fallback | 1 | Keep the raw source route byte-identical; only the public Home query injects a pre-runtime adapter that forces the source's own `REFRACT_OK=false` / `gw-gloss` branch, removing the incorrect CSS overlay simulation |
| Public ripple was too subtle after the sharp-image adapter set `gw-ripple` to `0.2` | 1 | Test opacity, then use the source fallback's `overlay` blend at opacity `1` after the opacity-only trial blurred the HTTP presentation |
| Home still loaded the Desktop source at mobile width, so Mobile was only a responsive crop | 1 | Select the immutable Desktop or Mobile source route from the viewport and apply a separate in-memory public adapter for each shell |
| Home topbar kept large gaps after hiding unused anchors because the source flex gap belongs to their parent `<li>` items | 1 | Hide unused parent list items and make public subpage navigation use the same `ul`/`li` hierarchy, font loading, and responsive breakpoints as the source |
| Playwright audit session was no longer open | 1 | Start a fresh headed CLI browser before collecting comparable source/public screenshots |
| First browser audit navigation hit `ERR_CONNECTION_REFUSED` because the dev server had stopped | 1 | Restart `pnpm dev`, confirm Next 16.3.3 is ready on port 3000, then repeat the source capture |
| Raw source Blog/Letters screenshots still showed the splash after direct `navTo()` | 1 | Keep the computed-style evidence, but recapture visual evidence after completing the source entry transition before switching pages |
| Playwright `run-code` examples used a stale raw-`await page` form and produced a syntax error | 1 | Use the installed CLI's reported contract: pass a JavaScript function that receives `page`, or avoid `run-code` when ordinary commands suffice |
| Combined fallback/public 12-frame capture reached the 30-second command boundary after finishing fallback frames | 1 | Keep the completed fallback set and run the public 12-frame capture as a separate bounded command |
| Combined Room component/CSS patch used an invalid multi-file hunk boundary | 1 | Keep the successful component edit and apply the Room CSS correction as a separate exact patch |
| Turn interruption stopped the prior dev-server and Playwright process IDs | 1 | Start fresh bounded server/browser sessions and rerun all post-fix visual evidence rather than relying on pre-interruption state |
| Windows Turbopack dev runtime entered an HMR panic loop while recreating existing `.next/dev/node_modules` junctions | 1 | Stop the unstable dev process and perform post-fix browser verification against a fresh production build/server, without deleting user/source data |
| Production Blog/Letters browser routes returned 500 during visual verification | 1 | Server trace shows `ECONNREFUSED 127.0.0.1:55432`; restore the existing development PostgreSQL container, then repeat unchanged route checks |
| Docker Compose start used the guessed service name `postgres` | 1 | Read `compose.dev.yml`; the existing service is `continuum-db`, so start that exact service instead |
| Completion review found adapted HTML inherited one-year immutable caching | 1 | Add adapter version `continuum-gloss=2`, mark only adapted HTML `no-cache`, and test raw/adapted headers separately |
| Completion review found optional Owner lookup could turn a DB outage into a public Blog 500 | 1 | Add a failure-closed optional identity resolver and keep `requireOwner` strict for protected actions |
| Completion review found the gloss bootstrap depended on `Error().stack` text | 1 | Confirm the pinned Desktop snapshot has exactly one `getImageData()` call and intercept that readback directly; add execution/idempotence coverage |
| Completion review found the Desktop overlay selector affected the Mobile Room boundary note | 1 | Scope the pseudo-layer to `.source-room-page:not(.source-room-mobile-note)` |
| Phase 15 inspection guessed a Room `host.html` path that does not exist | 1 | Follow the actual Next host chain: `RoomClient` mounts the immutable `/game/game_module.js` route directly |
| Phase 15 asset inventory searched a nonexistent `public/game` directory | 1 | Treat `/game/*` as a traversal-safe runtime route over the immutable Desktop snapshot rather than copied public assets |
| Phase 15 RED test initially failed at the missing `source-state` module boundary | 1 | Add a typed no-op scaffold, then rerun until the test fails on the intended storage behavior rather than import resolution |
| First Phase 15 Playwright IndexedDB inspection had one extra closing parenthesis | 1 | Reduce the browser expression to a single `page.evaluate` return and rerun with balanced delimiters |
| Room re-entry smoke used a guessed `f2e21` ref after a fresh Blog snapshot | 1 | Use the actual current snapshot ref `f1e106` instead of carrying a ref from another page tree |
| Review-hardening lint rejected three bridge method bindings under `prefer-const` | 1 | Break the fallback/restore closure cycle with one reassigned restore callback and declare the actual bridged methods as `const` |
| Focused Playwright spec could not launch the package-version headless shell because that browser binary is not installed | 1 | Run this local lifecycle spec against the already installed Chrome channel instead of downloading another browser bundle |
| Live-failover E2E stopped at the first non-null fallback record while the async Salome assets were still loading | 1 | Poll the actual persisted `outfitIdx === 3` contract instead of treating any earlier source state as completion |
| First three SPA-back regression attempts missed the intended inner-wake assertion due to source timing/setup | 3 | Drive the original Sleep flow, wait briefly after each completed typewriter line before activating its replaced Next handler, then extend the wake timer and leave during `waking` |
| Phase 15 SPA regression fell back to `next dev` and Blog returned DB connection errors because Docker Desktop was no longer running | 1 | Restore the existing Docker Desktop engine and `continuum-db`, rebuild/start production once, then rerun the focused test against that stable server |
| First Docker-error log patch used a stale wording variant for the SPA row | 1 | Locate the exact current row and apply the log-only patch against that text |
| Docker Desktop did not expose its Linux engine within the first bounded 20-second readiness window | 1 | Continue useful build/static verification, then perform one later engine check instead of polling continuously |
| SPA-back test still assumed one Next click always advances after visible text | 1 | Model the source typewriter contract explicitly: boundedly click until the requested next state is visible, because the first click may only finish typing |
| Dialogue helper retried a removed Next button during the source's 400 ms lie transition | 1 | When Next disappears, wait for the requested target state instead of attempting another click; give this single timing test a 45-second ceiling |
| SPA-back test targeted guessed `#game-viewport`, but the immutable source creates `.game-viewport` without an id | 1 | Use the exact source class from `createViewport()` and keep the runtime untouched |
| Playwright actionability rejected the transformed Room viewport because scaled ancestor layers intercept the synthetic pointer | 1 | Dispatch a real bubbling `MouseEvent` at the source viewport's measured coordinates, exercising its registered click handler without changing layout |
| Phase 16 inspection guessed a nonexistent `tests/helpers/database.ts` path | 1 | Follow the actual `@/test/db` import and inspect `src/test/db.ts` instead |
| Phase 16 Tea contract RED test first stopped at the missing module boundary | 1 | Add a typed no-op Tea contract scaffold, then rerun until assertions fail on the intended source matrix and validation behavior |
| Tea contract replacement patch combined delete/add operations for the same file and was rejected | 1 | Update the existing scaffold in place rather than replacing the path twice in one patch |
| Phase 16 quota RED test first stopped at the missing shared AI module boundary | 1 | Add a typed no-op quota scaffold, then rerun for policy assertion failures before implementing limits |
| Phase 16 provider RED test first stopped at the missing adapter module boundary | 1 | Add a typed no-op provider scaffold, then rerun for HTTP contract assertion failures |
| Phase 16 Tea service RED test first stopped at the missing orchestration module boundary | 1 | Add typed error/service scaffolding, then rerun for ordering, cleanup, and prompt ownership failures |
| Phase 16 Tea HTTP RED test first stopped at the missing boundary module | 1 | Add a typed no-op handler scaffold, then rerun for origin, validation, response, and error-mapping failures |
| Phase 16 local-history RED test first stopped at the missing codec boundary | 1 | Add a typed no-op codec, then rerun for versioning and source-payload validation failures |
| Phase 16 source-adapter RED test first stopped at the missing module boundary | 1 | Add a pure payload scaffold before browser globals, then rerun for system-stripping and incomplete-state failures |
| First Tea browser flow lost the active feature when Start was clicked because the capture listener treated every non-marker click as `other` | 1 | Change feature state only for explicit Room interaction buttons/markers; preserve Tea across its internal controls |
| Story isolation smoke expected the No-API panel immediately, but the immutable source intentionally shows its multi-page Story introduction first | 1 | Assert the active Story introduction plus `apiConfigs.length === 0`; do not skip or rewrite the source introduction |
| First Phase 16 aggregate typecheck found a Window index-signature cast and Vitest generic matcher/table inference issues | 1 | Use an explicit unknown bridge for browser globals, remove unsupported matcher generics, and narrow the quota usage patch structurally |
| First clean lint pass warned that Room's Tea companion prop was omitted from the effect dependency list | 1 | Include the primitive `companionName` dependency; the server-provided value is stable and remount-safe |
| Phase 16 quota repository RED test first stopped at the missing repository boundary | 1 | Add the typed reservation scaffold and schema/migration, then rerun until failures describe quota behavior |
| Drizzle migration command exited 1 for both existing dev/test databases without printing the underlying SQL error | 1 | Inspect migration journal and live schema read-only before choosing a non-destructive repair; do not rerun the same opaque command |
| First direct migrator diagnostic used top-level await in `tsx -e` CJS output | 1 | Wrap the diagnostic in an async IIFE so the real database error can be observed |

## Notes
- Do not edit, rename, format, or generate files inside either upstream snapshot.
- Before every feature task, search both snapshots and update the reuse ledger.
