# Strain Sense

Make sense of what you're smoking.

A local cannabis product analyzer — paste a terpene profile or photograph a product label and get plain-language guidance on timing, effect type, potency, and what to expect.

## Features

- **Paste or photo** — type in THC/terpene data or upload a product label photo (uses Claude Vision)
- **Terpene engine** — classifies terpene profiles into relaxing / uplifting / balanced buckets with spectrum scoring
- **Experience level** — New / Regular / Daily tolerance settings adjust potency cautions
- **CBD:THC ratio** — calculated and factored into the explanation when CBD is present
- **Terpene sanity check** — flags unusually high individual or total terpene values
- **Take to Counter** — one-tap clean card to show a budtender (timing, effect, top terpenes in plain English)
- **Save & compare** — save products locally, rate them (👍 😐 👎), and compare profiles side-by-side
- **Mood matching** — pick how you want to feel and get terpene recommendations

## Setup

```bash
npm install
```

Create a `.env` file:
```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

The API key is only needed for photo analysis. Paste mode works without it.

## Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

## Stack

- React + Vite
- All analysis runs locally (no backend)
- Photo parsing via Anthropic Claude API (direct browser access)
- Storage via localStorage
