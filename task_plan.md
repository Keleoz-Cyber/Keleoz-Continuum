# Task Plan: Continuum 第一子项目实施规划

## Goal
为 Keleoz Continuum 制定可执行、可验证的第一子项目实施计划，覆盖工程基础、Owner 登录和内容发布闭环，同时固化上游复用证据。

## Current Phase
Checkpoint 3 complete

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
- [ ] Build final Home/Desktop/Mobile shells while preserving the current public content core
- [x] Adapt Letters submission, public wall, Owner review, and reply in a focused slice
- [ ] Adapt Music, Room, Tea, Story, Tarot, Wardrobe, Sleep, and Moments in focused slices
- [ ] Keep one local checkpoint suite per usable milestone; defer full release matrix until launch preparation
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

## Notes
- Do not edit, rename, format, or generate files inside either upstream snapshot.
- Before every feature task, search both snapshots and update the reuse ledger.
