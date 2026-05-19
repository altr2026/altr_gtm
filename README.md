# altr_gtm

GTM waitlist page for **altr** — the live activation platform connecting venues and brands across APAC and GCC.

> "Every brand wants a stage. Every venue needs a story."

## What this is

A single-file static landing page that collects two-sided waitlist signups:

- **Venues + Events** → "Be the stage"
- **Brands + Content IP** → "Find my stage"

No framework. No build step. Pure HTML + vanilla JS + Supabase for data storage.

Runs independently from [`altr_sponsorship_mvp`](https://github.com/altr2026/altr_sponsorship_mvp) (hackathon/demo build).

## Setup

### 1. Supabase

Use your existing Supabase project. Run `supabase_migration.sql` in the SQL Editor to add the `gtm_waitlist` table.

### 2. Add your keys

In `index.html`, replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

Both values are in your Supabase project → Settings → API.

### 3. Deploy

**GitHub Pages** (fastest):
1. Repo → Settings → Pages → Branch: `main` → Folder: `/root`
2. Live at `altr2026.github.io/altr_gtm`

**Custom domain** (recommended):
- Point `altrstage.com` or `stage.altr.haus` to GitHub Pages via CNAME

**Vercel** (alternative):
- Import repo → Framework: Other → Deploy

### 4. Fallback (no Supabase yet)

If `SUPABASE_URL` is still `YOUR_SUPABASE_URL`, form submissions open a `mailto:` to `hello@altr.haus` with the payload. Safe to deploy before keys are in.

## Viewing signups

Supabase → Table Editor → `gtm_waitlist`

Filter by `mode` to see venues vs brands separately.

## Relationship to altr_sponsorship_mvp

| | `altr_sponsorship_mvp` | `altr_gtm` |
|---|---|---|
| Purpose | Hackathon demo / investor | GTM waitlist |
| Stack | Next.js 14 + XRPL + Supabase | Static HTML |
| Deploy | Vercel | GitHub Pages / Vercel |
| Touch? | No — leave as submitted | Active dev |

## Contact

hello@altr.haus · [@altr2026](https://twitter.com/altr2026)
