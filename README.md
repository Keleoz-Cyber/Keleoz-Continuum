# Keleoz Continuum

### *A Personal Digital Space.*

> 一个持续生长的个人数字空间。

Keleoz Continuum is a noncommercial personal digital space currently in the design and foundation stage. It combines long-form writing, projects, moments, spatial interaction, music, letters, time, and AI-assisted experiences without reducing the product to a conventional blog template or AI dashboard.

## Current status

The repository currently contains:

- the approved V1 design baseline;
- immutable Desktop and Mobile upstream reference snapshots;
- source provenance and a mandatory reuse ledger;
- agent instructions that require reuse-first implementation.

Product implementation has not started yet.

## Design baseline

Read [Keleoz Continuum V1 设计基线](docs/design/Keleoz_Continuum_V1_设计基线_2026-08-26.md) before planning or implementation.

Key decisions:

- content-first atmospheric personal website;
- new public architecture with adapter-based reuse;
- one codebase and shared product core with distinct Desktop and Mobile shells;
- Next.js, React, TypeScript, PostgreSQL, Tiptap, and LightCOS;
- Desktop Room plus Tea, Story, Tarot, Wardrobe, and Sleep;
- Owner-first online publishing; Guest private interaction history remains local in V1;
- noncommercial deployment with explicit upstream attribution.

## Upstream references

- `upstream/InternalBeyond-Desktop/`
- `upstream/InternalBeyond-Mobile/`

These directories are immutable source references. Do not implement the new product by destructively trimming or editing them.

Before working on a feature, read:

- [AGENTS.md](AGENTS.md)
- [Source provenance](docs/SOURCE_PROVENANCE.md)
- [Source reuse ledger](docs/SOURCE_REUSE_LEDGER.md)

## Licensing and attribution

This repository contains material under multiple terms. See [NOTICE.md](NOTICE.md), the license files within each `upstream/` snapshot, and the future Credits / License surface before reuse or redistribution.

Keleoz Continuum is an unofficial modified noncommercial work and is not endorsed by Sui or the Internal Beyond project.
