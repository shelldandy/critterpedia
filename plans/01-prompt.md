# ACNH Critter Hunt Companion — Plan

## Context

`animal-crossing-lib` is an empty repo (git init'd on `main`, no commits, only `plans/01-prompt.md`).
The original ask was "a visual frontend tool to help players complete their museum," with a request to
sharpen the value proposition first. That sharpening happened, and it changed the product.

**The positioning problem.** "Museum checklist" is a crowded, largely solved category. But a liveness
scan on 2026-08-04 found the category is also _decaying_:

- **nook.plus is gone** — no DNS record at all. It was the best-loved no-account tracker.
- **VillagerDB is down** — 521, origin unreachable.
- **acnhapi.com is domain-parked** — it resolves with a fresh TLS cert and returns `200 text/html`
  full of ad-redirect JavaScript. Zero JSON. It still shows "up" in uptime checkers and API
  directories, so it is an active trap for anyone re-verifying.
- Survivors split into _browse-only reference sites that save no progress_ (ACNH Critterpedia,
  Critterpedia Plus) and _account-required suites_ (NookTraqr).

**The chosen value proposition.** Not another checklist. A **second-screen identification and hunt
companion** — used while the game is running, answering three questions a checklist cannot:

1. **"What can I catch right now?"** — current hour + month + hemisphere, filtered to what this
   player still needs, with location and value.
2. **"What am I looking at?"** — reverse lookup from an in-game observation. A large shadow off the
   pier at 9pm in July narrows to a short candidate list. This is the differentiator; no surveyed
   competitor does shadow-first reverse lookup.
3. **"What am I about to lose?"** — what leaves at month end, ranked by irreversibility.

Ownership state exists only to power #1 and #3 — it is an input, not the product.

**Scope decisions (user-set):** completionist-grinder audience; critters only (bugs, fish, sea
creatures) for the MVP; fossils and art explicitly deferred to phase 2; ownership via manual
tap-to-check grid in `localStorage`; **OCR screenshot import deferred** but the data layer must not
foreclose it.

## Verified findings that drive the design

All checked directly on 2026-08-04, not taken from search results.

**Data source: vendor `Norviah/animal-crossing`** (MIT, actively maintained — last push Feb 2025,
also on npm as `animal-crossing`). Raw JSON:
`https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/{Fish,Insects,Sea Creatures,Fossils,Artwork}.json`

Counts: **80 fish, 80 insects, 40 sea creatures**, plus 73 fossils and 70 artwork (43 genuine +
27 fake) held in reserve for phase 2.

The Nookipedia API is live but **key-gated** (401 without `X-API-KEY`, free key by manual-approval
form). A browser-side key would leak, so it needs a proxy — which is why static vendored JSON wins.
Given that acnhapi.com and nook.plus both died, **no runtime third-party API dependency** is the
single most important architectural constraint here.

**The dataset is tiny once slimmed.** Stripping translations/description/HHA bloat takes the critter
set from **460KB → 78KB raw, 7.6KB gzipped** (measured, including the display strings below). The
entire dataset ships inline: no loading state, no fetch, fully offline — which matters for a tool
used on a couch next to a Switch.

**⚠️ Never render availability from array endpoints — keep the upstream display strings.** 63 of 200
hour arrays are non-contiguous, so `Math.min/max` on angelfish's `[16..23, 0..8]` yields "0:00–23:00",
i.e. **"all day" — for a critter that vanishes at 9 AM.** Measured: **23 of 80 fish would render
wrongly** this way, showing a confident wrong answer, which is worse than showing nothing. Upstream
already ships correct human-formatted strings (`"4 PM – 9 AM"`, `"May - Oct"`); keep them for display
and use the arrays _only_ for predicate logic. They cost ~12KB raw / 0.4KB gzipped. One gotcha: those
strings contain **non-breaking spaces** (`\xa0`) — normalize at ingest or text search breaks.

**⚠️ Schema landmine — nested availability arrays.** `hemispheres.{north,south}.timeArray` is
_usually_ a flat int array, but **8 entries nest one level per window**:

| Critter                | timeArray                                    |
| ---------------------- | -------------------------------------------- |
| fish **piranha**       | `[[9,10,11,12,13,14,15],[21,22,23,0,1,2,3]]` |
| bug **evening cicada** | `[[4,5,6,7],[16,17,18]]`                     |
| bug **walking stick**  | `[[4,5,6,7],[17,18]]`                        |
| sea **giant isopod**   | `[[9..15],[21,22,23,0,1,2,3]]`               |

A naive `timeArray.includes(hour)` returns **false** for all 8 — silently wrong on exactly the rare
critters completionists hunt. Normalize at ingest; verified across all 200 entries with 0 failures.

Precisely scoped: across all 400 entry/hemisphere pairs, **`timeArray` nests in 8 pairs and
`monthsArray` never nests (0)**. Normalize both anyway — the cost is nil and it guards upstream drift.

Two corollaries: midnight-spanning windows are **pre-expanded** (`[21,22,23,0,1,2,3]`), so no
wraparound arithmetic is needed once flattened — membership testing suffices.

**How "always available" is actually encoded.** There are **zero empty arrays** in the dataset
(verified). Year-round is a full 12-length month array (**38 critters**) and all-day is a full
24-length hour array (**91 critters**). So the `length === 12` / `length === 24` checks are the
load-bearing guards — treating an empty array as "unconstrained" is a harmless defensive fallback,
not the real mechanism. Getting this backwards flags all 38 year-round critters as "leaving this
month," every month.

**Bugs also carry a `weather` field** (undocumented in the original brief): `Any weather` (45),
`Any except rain` (34), `Rain only` (1 — the rainy-day-only bug). Worth keeping and surfacing, since
"it's raining, what's out now?" is a real hunt question.

**Field shapes for the reverse lookup** (measured distributions):

- fish `shadow` — clean 8-value enum: `X-Small, Small, Medium, Large, X-Large, X-Large w/Fin, XX-Large, Long`. Note **`Long` and `X-Large w/Fin` are shapes, not sizes** — they must sit outside the size ramp as separate chips, or the picker teaches the wrong mental model.
- sea `shadow` — 5 values; sea `movementSpeed` — 6 values (`Stationary … Very fast`)
- **bugs have no `shadow`** (all null) — the shadow lookup is fish+sea only, and the UI must not imply otherwise
- fish `whereHow` — clean 7-value enum (`Sea, River, Pond, Pier, River (clifftop), River (mouth), Sea (rainy days)`)
- **bug `whereHow` — 25 free-text strings** ("Flying near blue/purple/black flowers", "On rotten turnips or candy"). Must be bucketed into ~6 groups (trees / flowers / ground / flying / water / special) before use as a filter; using it raw produces a useless 25-item dropdown. Use an **explicit hand-written map, not regex** — 25 strings is small enough to enumerate, and a mis-bucketed critter is silently unfindable. Assert at build time that all 25 map to a bucket.
- **sea `whereHow` is all null** — correct, they're all dive-caught. Speed is the discriminator instead.

**Images.** `acnhcdn.com` hotlinks work (verified 200s), but critterpedia PNGs are **~375KB each**
(~75MB across 200 critters) while menu icons are ~15KB.

The resolution: **store only the filename stem** (`"Fish43"`), never a full URL, and rebuild links at
runtime through a single `imageUrl()` helper. Given that sibling domain acnhapi.com is already parked,
treat the CDN as impermanent — if it dies, one function changes and the app degrades to a
text-and-silhouette tool instead of breaking, because nothing in the engine, lookup, or ownership
ever depended on images. Use the 15KB icon in grids and lists; load the 375KB art only in a detail
view, lazily, with an `onError` silhouette fallback.

**Licensing.** JSON data is **CC BY 4.0** — attribution required in-app. Images are **Nintendo IP**,
non-commercial fan use only. This is the ecosystem norm, but it hard-caps monetization: never sell
this, and if it were ever commercialized the sprites must be replaced with original art.

## Approach

Static, no-backend SPA. **Vite + React + TypeScript (strict) + Tailwind + Zustand + Vitest**,
deployed as static files. No accounts, no server, no runtime data fetch — this directly occupies the
niche nook.plus vacated.

Zustand rather than Context because the whole state is "ownership set + filters," and Context would
re-render the tree on every checkbox tap across a 200-item grid. Next.js is rejected outright: SSR
and server components are pure overhead for an app with no backend.

**Ship it as a PWA** (`vite-plugin-pwa`). Offline is a real product feature here, not a checkbox —
this is a phone tool used next to a Switch on flaky Wi-Fi, and since the data is bundled, offline
costs almost nothing.

### Directory tree

```
animal-crossing-lib/
├─ scripts/
│  └─ build-data.ts          # fetch upstream JSON → normalize → emit slim typed dataset
├─ src/
│  ├─ data/
│  │  ├─ critters.generated.json   # ~78KB, committed (build reproducible, app offline)
│  │  └─ types.ts
│  ├─ domain/
│  │  ├─ availability.ts     # THE core engine — pure, no React, no Date.now() inside
│  │  ├─ availability.test.ts  # co-located; the pinned regressions live here
│  │  ├─ urgency.ts          # leaving-soon / leaving-in-N-hours / arriving-next
│  │  ├─ lookup.ts           # reverse shadow/location/speed narrowing
│  │  └─ buckets.ts          # bug whereHow → 6 groups (explicit hand map)
│  ├─ store/
│  │  ├─ useCollection.ts    # Zustand + persist, versioned schema
│  │  └─ useSettings.ts      # hemisphere, clock override
│  ├─ hooks/useNow.ts        # ticking clock + manual override
│  ├─ components/            # NowPanel, IdentifyPanel, UrgencyPanel,
│  │                         # CollectionGrid, ShadowPicker, CritterCard, DetailSheet
│  └─ App.tsx
└─ package.json
```

### Data pipeline

`scripts/build-data.ts` runs at build time (committed output so the app never depends on network):

1. Fetch the three critter JSON files.
2. Keep only: `id (=kind-num), kind, name, num, sell, shadow, movementSpeed, whereHow, weather, catchDifficulty, vision, iconFilename`, plus normalized `{n,s}{M,H}` arrays **and** the `{n,s}{Ms,Hs}` display strings.
3. **Flatten nested arrays** (the landmine above) and normalize non-breaking spaces.
4. Bucket bug `whereHow` into groups via the explicit map.
5. Emit typed JSON + a `DATA_VERSION` stamp.

**Fail the build loudly** on any invariant violation — counts ≠ 80/80/40, an hour outside 0–23, a
month outside 1–12, a surviving nested array, or an unmapped bug location. All pass today (verified);
the guard exists for the day upstream changes shape. A silent regression here means rare critters
vanish from results, which is the worst possible failure for this audience.

Commit the generated file so builds are reproducible, work offline, and survive upstream deletion.

### The availability engine

Pure functions taking an explicit `now` — never reading the clock internally, which is what makes
time-dependent logic testable.

```ts
type Hemisphere = "north" | "south";
type Kind = "fish" | "bug" | "sea";
type Shadow =
  | "X-Small"
  | "Small"
  | "Medium"
  | "Large"
  | "X-Large"
  | "X-Large w/Fin"
  | "XX-Large"
  | "Long";
type Speed =
  | "Stationary"
  | "Very slow"
  | "Slow"
  | "Medium"
  | "Fast"
  | "Very fast";

type Window = {
  months: number[];
  hours: number[]; // normalized, flat — for LOGIC
  monthsText: string[];
  hoursText: string[]; // upstream strings — for DISPLAY
};

type Critter = {
  id: string; // `${kind}-${num}`, num unique 1..N per kind (verified)
  kind: Kind;
  name: string;
  num: number;
  sell: number;
  shadow?: Shadow; // fish + sea only — bugs have none
  movementSpeed?: Speed; // sea only
  whereHow?: string; // fish + bugs — null on sea
  whereGroup?: string; // bugs, bucketed
  weather?: string; // bugs only
  catchDifficulty?: string;
  vision?: string;
  icon: string; // filename stem, NOT a URL
  north: Window;
  south: Window;
};

// empty = unconstrained (defensive; the real dataset has no empty arrays)
const inSet = (set: number[], v: number) => set.length === 0 || set.includes(v);

function isAvailableNow(c: Critter, now: Date, hemi: Hemisphere): boolean {
  const w = hemi === "north" ? c.north : c.south;
  return inSet(w.months, now.getMonth() + 1) && inSet(w.hours, now.getHours());
}

// Month wraparound is needed HERE and nowhere else.
function isLeavingThisMonth(c: Critter, now: Date, hemi: Hemisphere): boolean {
  const { months } = hemi === "north" ? c.north : c.south;
  if (months.length === 0 || months.length === 12) return false; // 38 year-round critters
  const m = now.getMonth() + 1;
  const next = m === 12 ? 1 : m + 1; // Dec -> Jan
  return months.includes(m) && !months.includes(next);
}
```

Validated against real data: at month 7 this flags tadpole/honeybee/seaweed; at month 12 it flags
pike/mussel/spiny lobster/turban shell; **none of the 38 year-round critters flag in any month**; and
multi-window blue marlin (`[1,2,3,4,7,8,9,11,12]`) correctly flags after Apr and Sep but not Dec.

Also compute **"leaving in N hours"** by walking forward through the flat `hours` array. For a window
ending at 21:00, urgency at 20:00 is far higher than a month-end flag conveys — and this is the
signal that makes the Now screen feel alive rather than like a filtered list.

Ingest-side normalization (the fix, verified on all 200 entries):

```ts
const norm = (a: unknown): number[] =>
  !Array.isArray(a) || a.length === 0
    ? []
    : Array.isArray(a[0])
      ? (a as number[][]).flat()
      : (a as number[]);
```

**Urgency** (`urgency.ts`): rank by `(leaving, hours-until-gone, narrowness of window)` so a
one-month-two-hour critter outranks a one-month-all-day one. Surface "arriving next month" as a
separate, clearly-labeled signal — it's a different action (wait) from "leaving" (hurry).

**Reverse lookup** (`lookup.ts`): progressive narrowing over `{shadow?, whereGroup?, speed?, onlyMissing?}`
intersected with current availability — a plain predicate filter, not a search index, since 200 items
filter in microseconds. Must gate on `kind`: offering a shadow filter for bugs is a correctness bug.

Two UX decisions that make this screen work: **show candidate counts on every filter option**
("Large — 7 candidates"), and **default `onlyAvailableNow` to on**, because the user is standing in
front of the shadow right now. Together these collapse "large shadow off the pier at 9pm in July" to a
handful instantly. Render shadow sizes as **visual silhouettes, not a text dropdown** — users are
matching shapes, not reading labels.

### State

Zustand `persist` middleware under key `acnh-hunt`, with `version` + `migrate` wired in **from v1
onward** — retrofitting migrations after users have data is painful.

```ts
{ version: 1,
  hemisphere: 'north',
  caught:  Record<CritterId, true>,          // sparse map, O(1) writes
  donated: Record<CritterId, true>,          // museum vs. merely caught — distinct for completionists
  source:  Record<CritterId, 'manual'|'ocr'>, // provenance, for later OCR diff/undo
  updatedAt: string }
```

Three deliberate choices. Ids are `${kind}-${num}` — **`num` is unique 1..N within each kind**
(verified), and numeric ids avoid the locale-dependence of names. A sparse `Record` rather than an
array makes merging manual taps with a future OCR batch a trivial spread. And ownership actions are
**batch-shaped from day one**:

```ts
markCaught(ids: CritterId[], source: 'manual' | 'ocr'): void
```

so the OCR phase adds only an image→ids parser and calls the same action — no UI or engine change.
Add JSON export/import early: ~20 lines, protects against localStorage loss, and doubles as the OCR
ingest format.

### Screens

1. **Now** (default, the money screen) — catchable this hour, missing-only by default, grouped
   _Leaving soon → New this month → Rest_. Rows carry icon, location, price, and a "leaves in Nh" /
   "last month!" badge. Must answer the question at a glance with **zero taps**.
2. **Identify** — silhouette-based shadow picker, plus speed (sea) and location (fish); live candidate
   counts. Fish/sea only; the shadow control is hidden for bugs and the location control for sea.
3. **Leaving** — month-boundary urgency, plus "arriving next month" as a distinct signal.
4. **Collection** — the tap-to-check grid, per-kind progress rings; bugs show a `weather` badge
   (rain-only / not-in-rain), which is a real catch blocker.
5. **Detail sheet** — shared modal: lazy full-size art, and all windows drawn as a 12-month × 24-hour
   heat strip, which communicates a critter's availability faster than any prose.

Persistent header: hemisphere toggle + a **clock-override control**. ACNH follows the console clock
and this audience time-travels, so trusting device time silently is wrong; the override also doubles
as the fastest way to verify "what's leaving at 11pm on Aug 31."

## Build order

Each milestone is independently demoable. **M1 carries all the real correctness risk, so it ships
before any UI exists to rewrite.**

1. **M1 — Data spine, no UI.** Scaffold; `build-data.ts` with normalization, bucketing, and fail-fast
   validation; generated dataset committed; full engine test suite. _Demo: `npm test` green,
   including the piranha regression._
2. **M2 — Now screen.** Engine + hemisphere toggle + clock override + list. _Demo: job #1 works._
3. **M3 — Collection grid + persistence.** Tap-to-check, versioned localStorage, `onlyNeeded` wired
   back into M2. _Demo: personalized results surviving reload._
4. **M4 — Identify.** Silhouette picker, speed/location narrowing, live candidate counts. _Demo: job #2._
5. **M5 — Leaving + detail sheet.** Urgency views, availability heat strip. _Demo: job #3._
6. **M6 — Polish.** PWA/offline, JSON export/import, empty and error states, CDN image fallback,
   CC BY attribution footer.

## Verification

- **Build-time**: `npm run build:data` asserts 80/80/40, hours ∈ 0–23, months ∈ 1–12, zero surviving
  nested arrays, all 25 bug locations mapped, all ids unique.
- **Unit tests on the engine** — pure functions taking an explicit `now`, so most need no mocking:
  - **Nested-array regression naming the 4 species.** Pinned, verified expectations: piranha north
    catchable at 12pm / 11pm / 2am and **not** 6pm; evening cicada the inverse. These fail on naive `.includes()`.
  - All **38 year-round critters never flag as "leaving"** in any of the 12 months; Dec→Jan wraparound;
    blue marlin flags after Apr and Sep but not Dec.
  - All-day critters available at all 24 hours; midnight-spanning window true at 23:00 and 02:00.
  - Hemisphere inversion — Napoleonfish north `[7,8]` vs south `[1,2]`.
  - A **snapshot of the catchable count** at a few fixed timestamps × both hemispheres, to catch
    broad pipeline drift cheaply.
  - Persistence round-trip and a v1→v2 migration fixture.
- **Manual end-to-end**: `npm run dev`, set hemisphere, mark a few caught, then use the clock override
  to step across an hour boundary and a month boundary and confirm the Now list and badges change.
- **Offline check**: load, kill the network, reload — the app must fully work, proving there is no
  runtime data dependency. This is the property that outlives the next community-API shutdown.
- One Playwright smoke test (load → check a critter → reload → still checked) once the UI settles.

## First deliverable: rewrite `plans/01-prompt.md`

The original ask was to improve that doc so the value proposition is established before any code.
Step one of implementation is therefore to replace its two lines with the **Context** section above —
the positioning problem, the three jobs, the competitive gap, and the scope decisions. It becomes the
project's README-in-waiting and the thing that keeps the build from drifting back into "another
checklist."

## Deferred (explicitly not in this build)

Fossils (73) and artwork (70, incl. 27 fakes with per-fake images enabling side-by-side real/fake
comparison) — the data is already in the same source and the pipeline will be built to reach it.
OCR Critterpedia import. Accounts and cross-device sync.
