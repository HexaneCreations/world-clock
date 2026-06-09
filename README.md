# World Clock

An interactive world clock with a live 3D globe, real-time news, music, and weather — built with React, Vite, and `react-globe.gl`.

## Features

- **3D interactive globe** with city markers, propagating rings, and arc connections
- **Day/night shadow** rendered via a custom Three.js ShaderMaterial using real sun position
- **City clock cards** with analog + digital display and a 3D flip showing business-hours status
- **Business hours indicator** — globe dots and card badges glow green (work), amber (evening), or grey (night)
- **Info card** per city with four tabs:
  - **News** — live and breaking YouTube videos for the city's country
  - **Weather** — current conditions from Open-Meteo
  - **Music** — popular YouTube music for the region
  - **More** — country facts (capital, population, currency, languages)
- **YouTube player** embedded in-card with expand-to-fullwidth mode
- **Now playing bar** — fixed bottom bar showing the current video title with stop and open-in-YouTube controls
- **Time zone converter** — side-by-side live times for any two cities in the catalog
- **City panel** — FAB button to add / remove cities (up to 8)
- **Search** — filter active cities by name, country, or UTC offset
- **Animated hero title** with Plus Jakarta Sans font and CSS shimmer gradient
- **Alternate YouTube theme** saved in `src/styles-v2-youtube.css` (red/black/white)

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 |
| Build tool | Vite |
| 3D globe | react-globe.gl + Three.js |
| Weather API | Open-Meteo (free, no key needed) |
| Video API | YouTube Data API v3 |
| Country data | RestCountries v3.1 |
| Deployment | GitHub Actions → GitHub Pages |

## Project Structure

```
src/
├── main.jsx                  # Entry point — imports styles.css
├── App.jsx                   # Lean orchestration (~120 lines)
│
├── data/
│   └── cities.js             # cityCatalog (8 cities) + initialCityIds
│
├── hooks/
│   ├── useClock.js           # 1-second setInterval → returns live `now` Date
│   └── useGlobe.js           # Globe ref, ResizeObserver, controls setup,
│                             # stable getPointColor / getRingColor callbacks
│
├── utils/
│   ├── constants.js          # Layout constants (card widths, map defaults)
│   ├── time.js               # formatTime, formatDate, parseOffsetMinutes,
│   │                         # formatOffsetLabel, formatDifference, getClockHandAngles
│   ├── business.js           # getBusinessStatus → "work"|"evening"|"night"
│   │                         # BIZ_COLORS, BIZ_LABELS
│   ├── globe.js              # getSunPosition, sunToDir (sun direction vector)
│   ├── weather.js            # WMO code map, weatherInfo, formatPop
│   ├── youtube.js            # onYTReady singleton, fetchYT (parallel + dedup)
│   └── cardFetcher.js        # fetchCardNews, fetchCardWeather,
│                             # fetchCardMusic, fetchCardCountry
│
├── components/
│   ├── Hero.jsx              # Search bar + view-mode toggle
│   ├── GlobeView.jsx         # Full Globe canvas with Three.js night overlay
│   │                         # accepts `children` for InfoCard overlay
│   ├── ClockCard.jsx         # Analog/digital clock card with 3D CSS flip
│   ├── TZConverter.jsx       # Side-by-side timezone picker + diff label
│   ├── CityPanel.jsx         # FAB + slide-in panel to add cities
│   ├── NowPlayingBar.jsx     # Fixed bottom bar while a video is playing
│   │
│   └── InfoCard/
│       ├── InfoCard.jsx      # Card shell: header, tabs, body router
│       ├── PlayerView.jsx    # Back button + YouTubeEmbed + fallback link
│       ├── YouTubeEmbed.jsx  # Manages YT.Player lifecycle (never remounts)
│       ├── NewsTab.jsx       # News video list or empty/loading state
│       ├── MusicTab.jsx      # Music video list or empty/loading state
│       ├── WeatherTab.jsx    # Current weather display
│       └── MoreTab.jsx       # Country facts display
│
└── styles.css                # Active theme (blue/purple v1)
    styles-v2-youtube.css     # Alternate YouTube theme (red/black/white)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [YouTube Data API v3](https://console.cloud.google.com/) key with the **YouTube Data API v3** enabled

### Local development

```bash
# 1. Install dependencies
npm install

# 2. Create a .env file (never commit this)
echo "VITE_YOUTUBE_API_KEY=your_key_here" > .env

# 3. Start the dev server
npm run dev
```

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the dist/ build locally
```

## Deployment (GitHub Pages)

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that:

1. Triggers on every push to `main`
2. Runs `npm run build` with `VITE_YOUTUBE_API_KEY` injected from **GitHub Secrets**
3. Publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`

**Setup once:**
Go to `Settings → Secrets and variables → Actions` and add:

| Secret name | Value |
|---|---|
| `VITE_YOUTUBE_API_KEY` | Your YouTube Data API v3 key |

> **Security note:** The API key must only exist in `.env` (gitignored) and as a GitHub Actions secret. It must never be committed to the repository.

## Adding a city

Edit [`src/data/cities.js`](src/data/cities.js) and add an entry to `cityCatalog`:

```js
{
  id:         "berlin",
  city:       "Berlin",
  country:    "Germany",
  zone:       "Europe/Berlin",
  latitude:   52.5200,
  longitude:  13.4050,
  regionCode: "DE",   // ISO 3166-1 alpha-2 — used for YouTube regionCode filter
}
```

Add the `id` to `initialCityIds` if you want it shown by default.

## Switching to the YouTube theme

Copy the contents of [`src/styles-v2-youtube.css`](src/styles-v2-youtube.css) into [`src/styles.css`](src/styles.css) to activate the red/black/white YouTube-style palette.

## Key implementation notes

- **Globe width prop** must never change dynamically — Three.js renderer crashes. Visual shifts on card-expand are done via CSS `.globe-shift-wrap { transform: translateX(-29%) }`, leaving the `width` prop untouched.
- **YouTubeEmbed** must stay at the same React tree position while playing. Moving it between JSX branches unmounts the iframe and crashes the IFrame API. The player is always rendered at the top of `InfoCard`'s body when `card.playingId` is set.
- **getPointColor / getRingColor** use `useCallback` with a `nowRef` (not `now`) so the function references stay stable and don't trigger a globe re-render every second.
