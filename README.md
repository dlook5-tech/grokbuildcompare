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
`main`, `elon`, `sports`, `ifollow`, `free`, `msm`, `last_updated`.

### `main` — World · Nation · Business tab
Each section (`world`, `nation`, `business`) supports **3 stories** via
`tops` array. The site auto-derives "X hours ago" from each post URL's
snowflake, so the `time` field is optional.

```json
"main": {
  "world": {
    "tops": [
      {
        "headline": "Tight newspaper headline (≤ ~75 chars)",
        "main": {
          "url": "https://x.com/handle/status/<id>",
          "handle": "@handle",
          "text": "Verbatim post body",
          "views": "382K"
        },
        "perspectives": [
          { "side": "Conservative", "handle": "@…", "url": "…", "text": "…", "views": "276K", "honesty": "9/10",   "note": "One-line justification." },
          { "side": "Independent",  "handle": "@…", "url": "…", "text": "…", "views": "2.77M","honesty": "8.5/10", "note": "…" },
          { "side": "Democrat",     "handle": "@…", "url": "…", "text": "…", "views": "373K", "honesty": "7/10",   "note": "…" }
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

**Compat:** legacy `top: {…}` (singular) still works; gets wrapped into a 1-item array.

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

Non-negotiable per `CLAUDE-READ-THIS-FIRST.md`:
- Exactly 3 World + 3 USA stories
- Each story has 3 perspectives (Conservative / Independent / Democrat)
- Each perspective has honesty 1-10 + a one-sentence notes field
- Posts < 24h old

## Deploys

Every push to `main` triggers `.github/workflows/deploy.yml` which deploys to Netlify via the digest API (no Netlify CLI needed). Requires repo secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (already set).
