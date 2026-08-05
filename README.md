# ACNH Critter Hunt Companion

A second-screen tool for Animal Crossing: New Horizons players completing their museum.

> Implementation detail lives in [`plans/01-prompt.md`](plans/01-prompt.md). This file is the _why_.

## The positioning problem

"Museum checklist" is a crowded, largely solved category. A liveness scan on 2026-08-04 found it is
also _decaying_:

- **nook.plus is gone** — no DNS record at all. It was the best-loved no-account tracker.
- **VillagerDB is down** — 521, origin unreachable.
- **acnhapi.com is domain-parked** — resolves with a fresh TLS cert, returns `200 text/html` full of
  ad-redirect JavaScript, zero JSON. It still shows "up" in uptime checkers, so it is an active trap.
- Survivors split into _browse-only reference sites that save no progress_ (ACNH Critterpedia,
  Critterpedia Plus) and _account-required suites_ (NookTraqr).

Building another checklist means competing on the axis everyone already lost interest in.

## The value proposition

**Not a checklist. An identification and hunt companion** — used _while the game is running_,
answering three questions a checklist cannot:

1. **"What can I catch right now?"**
   Current hour + month + hemisphere, filtered to what _this player still needs_, with location and
   sell price. Zero taps to an answer.

2. **"What am I looking at?"**
   Reverse lookup from an in-game observation. A large shadow off the pier at 9pm in July narrows to
   a handful of candidates. **This is the differentiator** — no surveyed competitor does shadow-first
   reverse lookup.

3. **"What am I about to lose?"**
   What leaves at month end, and what leaves at end of _hour_, ranked by irreversibility.

Ownership state exists only to power #1 and #3. It is an input, not the product.

## Scope

**MVP: critters only** — bugs, fish, sea creatures (200 entries).

- Audience: the completionist grinder hunting their last missing entries.
- Ownership via manual tap-to-check grid, persisted in `localStorage`. No accounts, no server.
- **Deferred to phase 2:** fossils (73) and artwork (70, including 27 fakes with per-fake images that
  enable side-by-side real/fake comparison). The data ships from the same source.
- **Deferred:** OCR Critterpedia screenshot import. The data layer is built batch-shaped so adding it
  later requires only an image→ids parser.

## Non-negotiable constraints

- **No runtime third-party API dependency.** Two of this ecosystem's main data APIs died; the tool
  must keep working when the next one does. Data is vendored at build time and ships inline
  (~78KB raw, 7.6KB gzipped) so the app works fully offline.
- **Never show a confident wrong answer.** Availability is subtle enough that a plausible-but-wrong
  answer is worse than none — see the schema landmines in the implementation plan.
- **Non-commercial.** Critter data is CC BY 4.0 (attribution required in-app); images are Nintendo IP.

## Success test

If a player standing on a beach at 11pm cannot get a useful answer without typing anything, the
product has failed regardless of how many features it has.

## Attribution

Critter data from [`Norviah/animal-crossing`](https://github.com/Norviah/animal-crossing) (MIT),
derived from the community ACNH spreadsheet, licensed **CC BY 4.0**. Images are the property of
Nintendo and are used here for non-commercial, educational purposes only.
