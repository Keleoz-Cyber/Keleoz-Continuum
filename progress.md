# Progress Log

## Session: 2026-08-26

### Phase 1: Requirements & Discovery
- **Status:** complete
- Actions taken:
  - Verified `main` tracks `origin/main` and the worktree was clean before this planning session.
  - Read repository rules, the V1 design baseline, and planning/test/Next.js skill instructions.
  - Limited the durable implementation plan to the first independently testable sub-project.
- Files created/modified:
  - `task_plan.md` (created)
  - `findings.md` (created)
  - `progress.md` (created)

### Phase 2: Upstream Evidence & Architecture
- **Status:** complete
- Actions taken:
  - Identified auth, exposure, publishing, editor, media, and data contracts as the relevant evidence areas.
  - Read the complete provenance record and existing reuse ledger.
  - Confirmed the pinned Desktop/Mobile commits and immutable snapshot rule.
  - Re-read design-baseline sections covering product scope, content entities, editor representation, exposure, interface shells, runtime architecture, and publishing flow.
  - Inventoried both upstream snapshots and performed the first cross-snapshot keyword search.
  - Narrowed the next evidence pass because the broad search output was truncated.
  - Inspected Desktop Blog list, editor, Markdown blocks, reader, navigation, reading-progress, and in-article-search behavior.
  - Inspected Mobile Blog list, reader, editor, and native subpage behavior.
  - Confirmed the shared IndexedDB v15 store list and common post record fields across Desktop and Mobile.
  - Verified local Node, pnpm, and Docker tooling; confirmed host `psql` is absent.
  - Sampled current package registry versions for the planned Next.js, persistence, password hashing, and editor stack.
  - Verified the remaining editor, validation, unit-test, and browser-test package versions.
  - Checked current primary documentation for Next.js authentication/Proxy, Drizzle PostgreSQL transactions, Tiptap SSR/static rendering, and Node LTS status.
  - Applied Vercel's relevant auth, bundle-splitting, serialization, and async rules to the planned boundaries.
  - Confirmed tag-based Next.js 16 cache invalidation for the publish flow.
  - Locked the root single-app, Drizzle/PostgreSQL, custom single-Owner session, immutable-version, dynamic-editor, and adapter boundaries.
- Files created/modified:
  - `docs/SOURCE_REUSE_LEDGER.md` (planned evidence appended)

### Phase 3: Detailed Implementation Plan
- **Status:** complete
- Actions taken:
  - Created an eleven-task TDD plan covering scaffold, environment, schema, auth, structured content, publication, Studio, editor/autosave, public reader, media boundary, E2E, and production build.
  - Added exact source pointers and intentional differences to the reuse ledger.
- Files created/modified:
  - `docs/superpowers/plans/2026-08-26-continuum-foundation-content-slice.md` (created)
  - `docs/SOURCE_REUSE_LEDGER.md` (modified)

### Phase 4: Self-Review & Verification
- **Status:** complete
- Actions taken:
  - Placeholder scan found no prohibited placeholder language.
  - Verified all four immutable upstream hashes still match the provenance record.
  - Replaced a meaningless snapshot self-diff with exact four-file SHA-256 checks.
  - Added missing `categoryLabel`, route-test, schema-test, environment-test, Docker, public-root, and responsive Blog-list files to the plan map/contracts.
  - Simplified caching to tagged `unstable_cache` plus precise tag/path invalidation without enabling Cache Components in the first slice.
  - Reformatted reuse-ledger evidence to remove trailing whitespace.
  - Defined all previously implicit domain types and aligned `categoryLabel` across schema, draft SQL, DTOs, and list filtering.
  - Added an explicit local media serving route and made public Blog routes build-safe without a live database.
- Verification evidence:
  - Plan contains Tasks 1 through 11 in order and 102 balanced Markdown code fences.
  - Prohibited placeholder/red-flag scan returned no matches.
  - `git diff --check` returned clean.
  - All four pinned upstream SHA-256 hashes matched and `git status -- upstream` was empty.
- Files created/modified:
  - `docs/superpowers/plans/2026-08-26-continuum-foundation-content-slice.md`
  - `docs/SOURCE_REUSE_LEDGER.md`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

### Phase 5: Delivery
- **Status:** complete
- Actions taken:
  - Prepared the plan handoff with inline execution as the non-delegated option for this task.
- Files created/modified:
  - `progress.md`

### Phase 6: Foundation Checkpoint Implementation
- **Status:** complete
- Actions taken:
  - User chose direct work in the current checkout with no branch/worktree proliferation.
  - Verification policy changed to targeted local tests during development and one proportional suite at the checkpoint.
  - Created the root Next.js configuration and minimal Continuum brand shell.
  - Installed production dependencies successfully; development dependency linking failed on a Windows symlink permission boundary.
  - Aborted a forced reinstall when it began fetching many unrelated platform binaries.
  - Pinned development dependency versions and limited pnpm to Windows/Linux x64 targets.
  - Dependency audit found peer incompatibilities in registry-latest ESLint/TypeScript and a narrow build-script allowlist requirement.
  - Reinstalled with peer-compatible ESLint 9 and TypeScript 5.9; pnpm still requires its current build-approval syntax.
  - Approved only `esbuild` and `unrs-resolver`; the final peer dependency check reported no issues.
  - Task 1 passed ESLint, TypeScript, and Next.js production build; `/` was statically generated.
  - Task 2 completed the environment RED/GREEN cycle with 7 passing tests.
  - Started PostgreSQL 17, created a separate `continuum_test` database, and verified the container is healthy.
  - Task 3 observed 2 expected schema-contract failures on the empty test database, generated the migration, applied it to development and test databases, then passed both schema tests.
  - Added a real `/blog` empty state so the foundation Home link does not lead to a dead route.
  - Checkpoint verification passed: no peer issues, lint clean, typecheck clean, 9/9 tests passed, Next build passed, PostgreSQL was healthy, all 7 foundation tables existed, and all 4 upstream hashes matched.
- Files created/modified:
  - `task_plan.md`
  - `findings.md`
  - `progress.md`
  - Root Next.js/pnpm/configuration files and `src/app/`
  - `src/shared/env-schema.ts`, `src/shared/env.ts`
  - `compose.dev.yml`, `.env.example`, `drizzle.config.ts`
  - `src/db/`, `src/test/db.ts`, `drizzle/`
  - `tests/unit/env.test.ts`, `tests/integration/schema.test.ts`

### Phase 7: Security and Publishing Domain
- **Status:** complete
- Actions taken:
  - Resumed Tasks 4-6 on `main` under the user's no-extra-branches and no-routine-CI constraint.
  - Re-read the execution, persistent-planning, and TDD rules plus the exact Task 4-6 plan sections.
  - Task 4 pure-auth tests first errored on missing modules, then produced 3 intended behavior failures with typed no-op scaffolds.
  - Verified the installed Argon2 library's exact option and algorithm names from local type definitions.
  - Completed Owner bootstrap input RED/GREEN cycles: username normalization, minimum password length, and blank username rejection pass 3 tests.
  - Docker Desktop processes started after the session transition, but three engine/status probes did not respond; database-dependent tests are deferred unchanged while Task 5 unit work continues.
  - Task 5 typed scaffolds produced 6 intended failures and 1 passing Hidden-projection case.
  - Verified the installed Tiptap static-renderer API and StarterKit Link availability from local package types.
  - Task 5 document, sanitizer, slug, and Full/Summary/Hidden projection tests passed 7/7.
  - Task 6 draft revision/conflict tests passed 2/2; publication/pointer/exposure/slug/list tests passed 5/5.
  - Added lightweight public list selection that excludes Hidden and never selects body/document columns.
  - Deferred the unused Next.js cache wrapper to Task 9, where its public-route consumer and invalidation behavior can be verified together.
  - Checkpoint 2 verification passed: lint clean, typecheck clean, 31/31 tests passed, Next build passed, PostgreSQL healthy, and all four upstream hashes matched.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`
  - `findings.md`
  - `scripts/create-owner.ts`
  - `src/modules/auth/`
  - `src/modules/content/`
  - Task 4-6 unit and integration tests

### Phase 8: Owner Studio and Public Blog
- **Status:** complete
- Actions taken:
  - Continued directly after Checkpoint 2 with no extra branch or remote CI.
  - Loaded the Vercel Server Action authentication, RSC serialization, and dynamic-bundle rules.
  - Implemented protected Studio login/overview, content creation, Tiptap dynamic editor, revisioned autosave route, Guest Preview, tagged public Blog list/detail pages, reading progress, font controls, and a custom Continuum icon.
  - Real-browser smoke passed on desktop-sized Chromium: login, Studio, draft creation, edit, autosave, preview, publish, and public article reading. Temporary smoke data was deleted from the development database.
  - Full local verification passed after the UI work: 11 test files / 35 tests, lint, typecheck, and Next production build.
  - The long Playwright matrix and formal draft-route integration spec remain deferred to the launch checkpoint to honor the user's short-feedback preference.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Initial repository state | `git status --short --branch` | `main` tracks `origin/main`, no changes | Matched before planning files were added | pass |
| Task 1 scaffold | `pnpm lint; pnpm typecheck; pnpm build` | All exit 0 | All exit 0; `/` prerendered | pass |
| Task 2 environment RED attempt 1 | `pnpm vitest run tests/unit/env.test.ts` | Assertion fails because short secret is accepted | Suite errored because module did not exist | adjust test scaffold |
| Task 2 environment RED attempt 2 | `pnpm vitest run tests/unit/env.test.ts` | Fails because short secret is accepted | 1 expected assertion failure | red confirmed |
| Task 2 environment GREEN attempt 1 | `pnpm vitest run tests/unit/env.test.ts` | 7 tests pass | 5 pass; URL errors lacked field names | improve implementation errors |
| Task 2 environment GREEN attempt 2 | `pnpm vitest run tests/unit/env.test.ts` | 7 tests pass | Same 2 URL-message failures | replace Zod URL primitive |
| Task 2 environment GREEN attempt 3 | `pnpm vitest run tests/unit/env.test.ts` | 7 tests pass | 7 passed | pass |
| Task 3 schema RED | `pnpm vitest run tests/integration/schema.test.ts` on empty test DB | 2 contract failures | 2 expected failures | red confirmed |
| Task 3 schema GREEN | same command after migrations | 2 tests pass | 2 passed | pass |
| Checkpoint 1 | peers + lint + typecheck + focused tests + build + DB health/schema + hashes | all pass | all pass; 9 tests, 7 tables, 4 hashes | pass |
| Task 4 auth RED | `pnpm vitest run tests/unit/auth-crypto.test.ts tests/unit/login-throttle.test.ts` | Password, token, and throttle behaviors fail | 3 expected failures | red confirmed |
| Task 4 auth pure GREEN | auth crypto + throttle + bootstrap unit tests | 6 tests pass | 6 passed | pass |
| Task 5 content RED | document/slug/projection unit tests | Public behavior fails while Hidden remains null | 6 expected failures, 1 pass | red confirmed |
| Task 5 content GREEN | same unit tests after implementation | 7 tests pass | 7 passed | pass |
| Task 6 drafts RED/GREEN | `draft-repository.test.ts` | 2 failures before implementation, then 2 pass | matched | pass |
| Task 6 publishing RED/GREEN | `publish-repository.test.ts` | 4 failures then 4 pass; lightweight list adds 1 RED/GREEN cycle | 5 passed | pass |
| Checkpoint 2 attempt 1 | lint + typecheck + full tests | all pass | 29 passed, 2 failed from cross-file DB cleanup races | fix test isolation |
| Checkpoint 2 attempt 2 | lint + typecheck + full tests + build + DB health + upstream hashes | all pass | 31/31 tests and all checks passed | pass |
| Checkpoint 3 browser smoke | Playwright CLI desktop flow | login -> create -> edit -> autosave -> preview -> publish -> public read | All route transitions and visible content confirmed | pass |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-08-26 | Combined required-reading output was truncated | 1 | Split subsequent reads by document |
| 2026-08-26 | Broad upstream keyword search was truncated | 1 | Switch to exact symbols and bounded source ranges |
| 2026-08-26 | Multi-package npm version query reached the command time limit after partial output | 1 | Keep the successful observations and reduce any follow-up query scope |
| 2026-08-26 | Docker daemon probe returned no visible result | 1 | Defer a bounded daemon verification to the first execution task |
| 2026-08-26 | Follow-up registry query returned partial output at the time boundary | 1 | Use captured required versions and let the lockfile resolve helper type packages |
| 2026-08-26 | Large self-review patch failed to match a Unicode tree line | 1 | Apply smaller patches against exact file sections |
| 2026-08-26 | `git diff --check` found trailing whitespace in reuse-ledger evidence | 1 | Reformatted the evidence block with blank lines instead of Markdown trailing spaces |
| 2026-08-26 | Initial Task 4 findings patch targeted a sentence absent from `findings.md` | 1 | Located exact sections before applying small logging patches |
| 2026-08-27 | Task 4 aggregate run hit `ECONNREFUSED 127.0.0.1:55432` | 1 | Restart the existing Docker runtime and rerun the unchanged integration tests |
| 2026-08-27 | Docker Desktop processes existed but engine/status probes stayed silent three times | 3 | Stop polling, continue database-independent work, retry once later |
| 2026-08-27 | Typecheck rejected ambient `Algorithm` const enum and matcher generic syntax | 1 | Kept Argon2id value under `Options` checking and replaced the invalid matcher generic with `satisfies` |
| 2026-08-27 | Parallel integration files deleted each other's shared test rows | 1 | Disabled Vitest file parallelism for the current small shared-database suite |
| 2026-08-27 | Browser smoke saw 403 for Next dev chunks due to host `127.0.0.1` not in `allowedDevOrigins` | 1 | Add localhost/127.0.0.1 development origins and restart dev server |
| 2026-08-27 | Two exact-path attempts to remove temporary `.playwright-cli/` artifacts were blocked by local destructive-command policy | 1 | Keep the directory ignored and untracked; do not bypass the safety boundary |
| 2026-08-26 | Second multi-section plan patch failed on a heading mismatch | 2 | Switch permanently to one-section patches for this review |
| 2026-08-26 | pnpm dev-dependency install failed with `ERR_PNPM_EPERM` while linking `uri-js` to `punycode` | 1 | Inspect partial install, then configure project-local `node-linker=hoisted` and reinstall through a different linking strategy |
| 2026-08-26 | Forced hoisted install fetched unnecessary cross-platform optional binaries | 2 | Interrupted it, pinned the manifest manually, restricted supported architectures, and switched to a normal install |
| 2026-08-26 | Peer check rejected ESLint 10 and TypeScript 7; pnpm blocked required esbuild/unrs scripts | 1 | Pin compatible majors and allow only the two required build dependencies |
| 2026-08-26 | pnpm 11.19 did not honor the legacy `onlyBuiltDependencies` block | 1 | Inspect installed pnpm help/config before changing the approval mechanism |
| 2026-08-26 | Combined scaffold-log and RED-test patch missed a plan heading | 1 | Split test creation from progress updates; detailed plan remains an immutable execution reference |
| 2026-08-26 | First environment RED run errored before executing the assertion | 1 | Added a behavior-free typed function shell so the next RED run fails for the intended validation reason |
| 2026-08-26 | Zod URL primitive ignored two custom-message attempts | 2 | Switched to explicit safe URL/protocol predicates rather than retrying configuration |
| 2026-08-26 | Task 2 config patch included a progress line that was never written | 1 | Keep all subsequent code/config patches separate from progress-log patches |
| 2026-08-26 | Docker engine pipe was absent while starting Task 2 PostgreSQL | 1 | Start local Docker Desktop and poll readiness before creating the database container |
| 2026-08-26 | Test-database existence check returned null through the Compose command wrapper | 1 | Query with direct `docker exec`, inspect output, then create only if absent |
| 2026-08-26 | Checkpoint typecheck failed because invalid environment fixtures could not satisfy Next's narrowed `ProcessEnv` | 1 | Changed only the parser input boundary to `Record<string, string | undefined>` |
| 2026-08-27 | Public-page patch attempted Delete and Add operations on the same path | 1 | Split file replacement into separate operations |
| 2026-08-27 | Playwright Bash wrapper unavailable on Windows | 1 | Used the same official CLI through `npx --package @playwright/cli` |
| 2026-08-27 | Editor mounted with an unnecessary initial autosave | 1 | Track the last saved snapshot and skip unchanged initial state |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 9: Home scene and responsive shells in progress |
| Where am I going? | Phase 9: final shells and adapted Continuum experience modules |
| What's the goal? | Build the Continuum foundation and Owner-to-Guest publishing slice |
| What have I learned? | See `findings.md` |
| What have I done? | Added Owner Studio, dynamic Tiptap editing, autosave, Guest Preview, public Blog reading, and real browser-smoke evidence |

### Phase 9 start: Home scene and responsive shells (2026-08-27)
- Re-read the design baseline, provenance, reuse ledger, and both immutable upstream snapshots.
- Confirmed the current `/` page is still a placeholder and the next implementation target is the real scene-first Home plus responsive shell.
- Searched and recorded upstream evidence for Desktop background/splash/navbar/Music and Mobile topbar/drawer/Desk/Dock.
- Copied no upstream code into the snapshot; visual extraction will use a documented asset copy and small React adapters.

### Phase 9 implementation checkpoint: Home scene shell (2026-08-27)
- Added `src/modules/home/home-scene.tsx` with scene-first hero, Desktop glass nav, Mobile Topbar/Drawer/Desk app grid, Music mini/panel, and keyboard/clickable scene controls.
- Replaced the placeholder `/` page with the Home scene while leaving Studio and public Blog routes intact.
- Copied and hash-recorded the upstream blue fog-window asset under `public/reference/internal-beyond/`.
- Fresh `pnpm lint` and `pnpm typecheck` both passed after the visual migration.
- Desktop screenshot evidence: `output/playwright/home-desktop.png` shows the copied blue fog-window/butterfly scene, left editorial hero, glass nav, MIST/BRUSH controls, and Music mini surface.
- Mobile screenshot evidence: `output/playwright/home-mobile.png` at 390×844 shows the Topbar, responsive hero, Desk app grid for Blog/Letters/Room/Tea/Story/Tarot/Wardrobe/Sleep, and compact Music surface; opening the menu exposed the responsive Drawer links in a fresh snapshot.
- One screenshot command initially failed because `output/playwright/` did not exist; the directory was created and the screenshot was captured on the next command.
- Final local verification after the shell polish: `pnpm lint`, `pnpm typecheck`, `pnpm test` (11 files / 35 tests), `pnpm build`, and `git diff --check` all passed.
- Created local checkpoint commit `28b5a9f` (`feat: restore Continuum scene-first home shell`) directly on `main`; no branch or remote CI was added. Browser screenshots remain available under `output/playwright/` and are ignored from Git.

### Phase 9 implementation checkpoint: Letters slice (2026-08-27)
- Added the `letters` schema/migration with pending/approved/rejected status, public/private visibility, postal code, Owner reply, and HMAC source hash.
- Added Guest `/letters` submission UI and `/api/letters` route with same-origin validation, input limits, HMAC source privacy, and three-per-hour rate limiting.
- Added the public approved envelope wall with postal-code display and open/close paper interaction.
- Added Owner Studio inbox actions for approve/reject and optional public reply.
- Browser smoke passed on the real dev server: submit public letter -> receive postal code -> Owner login -> review/reply -> approve -> public wall -> open letter and see reply. Smoke owner and letter were deleted afterward.
- Fresh Letters checkpoint verification: `pnpm test` passed 13 files / 41 tests; `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. Build now exposes `/letters` and `/api/letters` alongside the existing public and Studio routes.

### Phase 9 implementation checkpoint: Music slice (2026-08-27)
- Added `/music` with fullscreen vinyl/tonearm presentation, local queue, list/single/random modes, previous/next, seeking, and LRC/SRT/VTT-compatible timestamp parsing for local files.
- Kept Home Music as a compact entry surface and added direct Music links to the responsive Desk and Experience section.
- Browser smoke passed at desktop and 390×844 mobile sizes; queue drawer opened with an empty-state message.
- Fresh lint and typecheck passed after replacing the direct state-reset effect with event-driven resets; no cascading setState effect remains.
- Music screenshots: `output/playwright/music-desktop.png` and `output/playwright/music-mobile.png`.
- Fresh Music checkpoint verification: `pnpm test` passed 14 files / 44 tests; `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. Build exposes `/music` in addition to `/letters` and the existing routes.

### Phase 9 corrective visual parity pass (2026-08-27)
- Re-read the reuse rules and original Desktop Blog/Letters markup and CSS before changing the pages.
- Replaced the generic Blog list shell with the reference module intro, dual-wing sidebar/main layout, category rail, editor entry, search bar, date cards, and empty state.
- Replaced the simplified Letters shell with the reference module intro, toolbar, postal search/export, composition card, envelope flap, stamp/seal SVGs, and opened-paper treatment while retaining the server submission/review logic.
- Browser screenshot evidence: `output/playwright/blog-reference.png` and `output/playwright/letters-reference.png`.
- Fresh verification passed: 14 test files / 44 tests, lint, typecheck, build, and `git diff --check`.

### Phase 9 corrective parity pass: Home and Music (2026-08-27)
- Re-read the original Desktop Home Canvas code (`gw-draw`, `gw-fogwipe`, `gwToggle`, `enterSite`) before changing the current shell.
- Added separate welcome/main scene state, crossfade layers for `bg-internal.jpg` and `bg-infernal.jpg`, actual rain Canvas, finger haze wipe, white pen, clear control, and MIST/BRUSH sizing.
- Added a real 48-band Web Audio visualizer to the Music page; the existing local queue/mode/seek/LRC behavior remains in place.
- Browser evidence: `home-welcome-final.png`, `home-entered-parity.png`, `home-infernal-parity.png`, and `home-brush-final-2.png`.

### Phase 9 corrective parity pass: Home mini-player and Blog reader (2026-08-27)
- Restored the Home Music floating surface to a local multi-track player with queue, list/single/random controls, previous/next, seek, remove, and draggable panel header.
- Added source-style Blog reader controls for in-article search/count/navigation, reading progress, font sizes, and context navigation while retaining the server projection and adjacent-post links.
- Fresh browser smoke reloaded `/` without runtime errors after the queue refactor and opened the Home Music panel with its full control row.

### Phase 9 source water simulation pass (2026-08-27)
- Added `src/modules/home/glass-water-canvas.tsx` based on the upstream `gw-ripple` algorithm: height-field waves, refractive background sampling, ambient/rain drops, plips, and tap/stir pointer input.
- Kept the existing Canvas fog/ink controls and switched the welcome scene to the source water layer; the water layer stops after entering the main scene.
- Fresh browser console check at `/` reported 0 errors and 0 warnings after enabling `willReadFrequently` on the readback canvas.

### Phase 10 start: source-exact frontend recovery (2026-08-27)
- User rejected reference-inspired approximations across Home, Music, Blog, and Letters and required direct upstream reuse wherever public-site requirements do not change behavior.
- Recovery rule: preserve backend/auth/publication/moderation work; replace provisional presentation layers with source-extracted DOM, CSS, assets, animation parameters, and interaction algorithms.
- Work remains on `main`, with one lightweight rollback tag and short local/browser verification only.

### Phase 10 implementation checkpoint: source-exact Home/Music/Blog/Letters (2026-08-27)
- Replaced the provisional Home scene with source-derived Desktop markup/CSS and lifecycle adapters for the complete glass-window stack, source water simulation, splash mist, rain field, controls, theme transition, and staged entry.
- Added the source-derived Mobile Desk/topbar/drawer/dock shell at the source's responsive breakpoint.
- Replaced the Home floating player with the source 300px Desktop player contract and replaced `/music` with the Mobile source fullscreen vinyl/tonearm/lyrics contract; local browser media remains the only media boundary.
- Replaced Blog and Letters page shells with source module hierarchy and CSS. Letters keeps the envelope wall and moves public guest composition into an explicit public-site adapter layer.
- Real-browser evidence captured under `output/playwright/`: `source-home-welcome.png`, `source-home-entered.png`, `source-mobile-home.png`, `source-home-player.png`, `source-blog.png`, `source-letters-demo.png`, `source-letter-open.png`, `source-letter-compose.png`, `source-music-desktop.png`, and `source-music-mobile.png`.
- Fresh local verification passed: Vitest 14 files / 44 tests, ESLint, TypeScript, Next production build, and `git diff --check`.

### Phase 10 reader follow-up and final browser check (2026-08-27)
- Replaced the remaining custom Blog reader wrapper with the upstream `#blog-read-view` / `brv-top` / `brv-search` / `read-fontsize-wrap` / `brv-progress` / `post-view` structure and retained the server projection boundary.
- Fresh Playwright session opened `/`, `/blog`, `/letters`, and `/music` at desktop size and `/` at 390×844; all pages rendered without console errors. Existing source comparison screenshots and envelope/player interaction screenshots remain under `output/playwright/`.
- No public route is claimed for unimplemented Room/Tea/Story/Tarot logic; mobile Desk keeps their source-style entry positions for the next experience-module slice.
