# grokbuildcompare

Sister site to **eXpressO News**. Same UI/interaction model. Different curator: stories are produced by Grok-Build with direct X-tool access instead of the eXpressO pipeline.

Live: https://grokpress.netlify.app

## How it stays in sync (you do nothing)

```
~/Desktop/grokbuildcompare-data/updates/
       ↓ (launchd watcher on your Mac)
this repo (data/stories.json)
       ↓ (GitHub Actions on push)
https://grokpress.netlify.app
```

End-to-end, ~30 seconds from Grok dropping a file to live site update.

## Data schema (`data/stories.json`)

Top-level keys (any subset; missing ones render an empty state):
`main`, `elon`, `sports`, `ifollow`, `free`, `msm`, `earlier`, `last_updated`.

### `main` — World · Nation · Business tab

**Config:** "3 stories on top / 6 perspectives below / honesty + post on
click." Per cron run, Grok provides up to 3 stories per category. They
render as a **row-major** grid (Row 1 = W#1·N#1·B#1, etc.); when only
1 story per category is provided, you just see 1 row of 3 cards.

**Per card (3 rows × 3 cols layout):**

```
┌────────────────────────────────────────────┐
│ Tight newspaper headline (≤65 chars)       │  ← Playfair, prominent; CLICK HEADLINE to open main X post
│ 828K views · ↑ HIGH VELOCITY · 1h ago      │  ← meta + velocity badge
│                                            │
│ ┌────────────┐ ┌────────────┐              │
│ │ CONSERV    │ │ INDEP      │              │  ← 2 perspective TEASERS (red/white/blue only)
│ │ Punchy     │ │ Short      │              │     (label + very short punchy headline body
│ │ headline…  │ │ headline…  │              │      + "tap for full + honesty")
│ └────────────┘ └────────────┘              │
│  ── click teaser to reveal full + honesty ──
│  [full post + X embed + 8.5/10 Honesty note]│
└────────────────────────────────────────────┘
```
Exactly 9 stories (3 world + 3 nation + 3 biz) = 18 perspectives (exactly 2 per story). Teaser bodies must be short punchy newspaper-style headlines (≤65 chars) for phone readability. No "Supportive/Critical/Skeptical/Bullish" etc — only Conservative (red), Independent (white), Democrat (blue). Main story headline is clickable to the source X post.

```json
"main": {
  "world": {
    "tops": [
      {
        "headline": "Tight newspaper headline (≤ ~75 chars)",
        "velocity": "high velocity",            ⟵ OPTIONAL free-text badge.
                                                  Inferred from rank if absent:
                                                  1st="high velocity",
                                                  2nd="rising fast",
                                                  3rd="climbing".
        "main": {
          "url": "https://x.com/handle/status/<id>",
          "handle": "@handle",
          "text": "Verbatim post body",
          "views": "382K"
        },
        "perspectives": [                       ⟵ EXACTLY 2 rendered (cap is hard).
          {                                       Honesty + note are per-perspective,
            "side": "Supportive",                 hidden until the user clicks.
            "handle": "@…",
            "url": "https://x.com/.../status/…", ⟵ REQUIRED. No URL → tile dropped.
            "text": "Full backing post text…",
            "views": "276K",
            "honesty": "8.5/10",                ⟵ shown only after click
            "note": "Why this score."           ⟵ shown only after click
          },
          { "side": "Skeptical", "handle": "@…", "url": "…", "text": "…", "views": "373K",
            "honesty": "7/10", "note": "…" }
        ]
      },
      { /* story 2, same shape */ },
      { /* story 3, same shape */ }
    ],
    "more": [
      { "headline": "Next-most-viewed headline", "url": "…", "views": "648K" }
    ]
  },
  "nation": { "tops": [ … 3 stories … ], "more": [ … ] },
  "business": { "tops": [ … 3 stories … ], "more": [ … ] }
}
```

**Compat:** legacy `top: {…}` (singular) still works; wraps into a 1-item
array. Story-level `honesty` / `note` are accepted by the schema but
ignored on Main tab (honesty is per-perspective by design).

**Perspectives — only three labels, only three colors:**

| `side` | Color | Meaning |
|---|---|---|
| `Conservative` | RED | right-leaning / hawkish / pro-enforcement / market-cautious |
| `Independent` | WHITE | neutral / fact-reporting / market-data / OSINT |
| `Democrat` | BLUE | left-leaning / pro-aid / anti-escalation / regulatory |

Every story has **exactly 2** of these. The three valid pairings are
**Conservative + Independent**, **Independent + Democrat**, and
**Conservative + Democrat** — no two-of-the-same-side and no third side.

Any non-canonical label (Skeptical, Bullish, Supportive, etc.) gets
coerced to one of the three on render via aliases — a label of
`"Skeptical"` will render as a red **Conservative** tile, `"Bullish"`
as a blue **Democrat** tile, `"Neutral"` as a white **Independent**
tile. Best practice: just use the three canonical labels in the JSON
so the data file matches what's displayed.

**Hard rule:** every perspective MUST have a real `x.com|twitter.com/<handle>/status/<id>` URL. No URL → tile silently dropped. Editorialised text-only counter-views are NOT rendered anywhere.

### `elon` — flat array of Elon posts (top 3 rendered)
```json
"elon": [
  {
    "headline": "…", "text": "…", "url": "…", "views": "251K",
    "honesty": "8/10", "note": "…",
    "counter": {                                ⟵ OPTIONAL counter-post tile.
      "side": "Critic",                         ⟵ NO URL = NO TILE. Hand-written
      "handle": "@…",                           ⟵ summaries are dropped on render.
      "text": "…",                              ⟵ Must be a real X post URL.
      "url": "https://x.com/.../status/<id>",
      "views": "…",
      "honesty": "…", "note": "…"
    }
  }
]
```
**Hard rule:** the `opposing` string field is DEAD. Counter views are only
rendered when `counter` (or `opposing_post`) is a real X post object whose
`url` matches `x.com|twitter.com/.../status/<id>`. Anything else: nothing
shows. This applies to every perspective tile across every tab — no URL,
no tile, no exceptions.

### `sports` — flat array (top 3; no perspectives, no honesty)
```json
"sports": [{ "headline": "…", "url": "…", "views": "1.96M" }]
```

### `ifollow` — handles + justification + optional top post
```json
"ifollow": [
  {
    "handle": "@EricLDaugh",
    "justification": "Why follow them, one line.",
    "honesty": "8.5/10",
    "topPost": { "url": "https://x.com/EricLDaugh/status/<id>", "views": "276K" }  // optional; when present the card becomes an expandable accordion that embeds the post
  }
]
```

### `free` — Marc Andreessen always first, then 0-10 today
```json
"free": [
  { "isMarc": true, "headline": "…", "url": "https://x.com/pmarca/...", "text": "…", "views": "High", "honesty": "9/10", "note": "…" },
  { "headline": "…", "url": "…", "text": "…", "views": "…", "honesty": "…", "note": "…" }
]
```

### `earlier` — W/N/B stories that rotated off the front page

Flat array of stories that were on a previous cron's `main` grid but
got bumped by a fresher one. Render groups them by `category`
(World / Nation / Business) and uses the same card layout as the main
tab, so the perspectives + honesty + X embed all work identically.

**Aging rule:** drop entries whose `main.url` resolves to a tweet
older than 24h (the X snowflake decoder handles this on render, but
also drop them at curation time so the JSON doesn't bloat).

```json
"earlier": [
  {
    "category": "World",                          ⟵ REQUIRED. World | Nation | Business.
    "headline": "Story that was on front page at 18:00Z, demoted at 19:00Z",
    "main":         { /* same shape as main.world.tops[].main */ },
    "perspectives": [ /* same exactly-2 rule as main */ ]
  }
]
```

How it flows: at each hourly cron, take the World/Nation/Business
stories from the *previous* run that are NOT in the new run and that
are still `<24h` old, and append them to `earlier[]`. Drop entries
already aged out. The site sorts each category by views inside the
Earlier tab.

### `msm` — stories MSM is ignoring (same shape as a main top story)
```json
"msm": [
  {
    "headline": "…",
    "main": { "url": "…", "text": "…", "views": "422K" },
    "perspectives": [ { "side": "Conservative", … }, { "side": "Independent", … }, { "side": "Democrat", … } ]
  }
]
```

### Time fields
Every post URL embeds a timestamp (X snowflake: `id >> 22 + 1288834974657`). The site decodes this automatically and shows "5h ago" / "2d ago". Don't write `"recent"` or `"now"` — they get dropped. Just provide a real `url` and the age renders itself.

Non-negotiable (Grok curates; match prototype + this README 1:1):
- Exactly 9 stories: 3 World + 3 Nation + 3 Biz (tier-ranked by views into 3 rows)
- Each story has exactly 2 perspectives (Conservative/Independent/Democrat only; red/white/blue)
- Perspective "text" in JSON must be short punchy newspaper headline (≤65 chars)
- Main story headline clickable to the X post
- Honesty + note per-perspective, revealed on teaser click only
- All posts strictly <24h; real x.com/.../status/ URLs only (no URL = drop tile)
- 18 perspectives total per drop. Use the first-prototype.html as visual/layout ref.

## Deploys

Every push to `main` triggers `.github/workflows/deploy.yml` which deploys to Netlify via the digest API (no Netlify CLI needed). Requires repo secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (already set).
