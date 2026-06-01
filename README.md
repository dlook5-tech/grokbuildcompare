# grokbuildcompare

Sister site to **eXpressO News**. Same UI/interaction model. Different curator: stories are produced by Grok-Build with direct X-tool access instead of the eXpressO pipeline.

Live: https://grokbuildcompare.netlify.app

## How it stays in sync (you do nothing)

```
~/Desktop/grokbuildcompare-data/updates/
       ↓ (launchd watcher on your Mac)
this repo (data/stories.json)
       ↓ (GitHub Actions on push)
https://grokbuildcompare.netlify.app
```

End-to-end, ~30 seconds from Grok dropping a file to live site update.

## Data schema (`data/stories.json`)

```json
{
  "last_updated": "2026-06-02T00:00:00Z",
  "world": [
    {
      "id": "stable-slug",
      "headline": "Block headline",
      "main_post": {
        "url": "https://x.com/handle/status/123",
        "handle": "@handle",
        "body": "Verbatim post text",
        "views": "2.77M",
        "posted": "2026-06-02T00:00:00Z"
      },
      "perspectives": [
        { "label": "Conservative", "url": "...", "handle": "...", "body": "...", "views": "...", "posted": "...", "honesty": 9, "notes": "..." },
        { "label": "Independent",  "url": "...", "handle": "...", "body": "...", "views": "...", "posted": "...", "honesty": 8, "notes": "..." },
        { "label": "Democrat",     "url": "...", "handle": "...", "body": "...", "views": "...", "posted": "...", "honesty": 7, "notes": "..." }
      ]
    }
    // exactly 3 World stories
  ],
  "usa": [
    // exactly 3 USA stories, same schema
  ]
}
```

Non-negotiable per `CLAUDE-READ-THIS-FIRST.md`:
- Exactly 3 World + 3 USA stories
- Each story has 3 perspectives (Conservative / Independent / Democrat)
- Each perspective has honesty 1-10 + a one-sentence notes field
- Posts < 24h old

## Deploys

Every push to `main` triggers `.github/workflows/deploy.yml` which deploys to Netlify via the digest API (no Netlify CLI needed). Requires repo secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (already set).
