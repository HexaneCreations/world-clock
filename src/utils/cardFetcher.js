import { YT_KEY, fetchYT } from "./youtube";

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const photoCache = new Map();

async function fetchUnsplashPhotos(query) {
  if (photoCache.has(query)) return photoCache.get(query);
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=squarish&client_id=${UNSPLASH_KEY}`
  );
  if (!res.ok) throw new Error("unsplash-error");
  const data = await res.json();
  const photos = (data.results || []).map((p) => ({
    id:       p.id,
    url:      p.urls.small,
    full:     p.urls.full,
    alt:      p.alt_description || query,
    user:     p.user.name,
    userLink: p.user.links.html,
  }));
  photoCache.set(query, photos);
  return photos;
}
import REGION_MUSIC from "../data/regionMusicQueries.json";

// eventType=live is unreliable in the API — rely on "live" keywords in queries instead
// videoEmbeddable=true excluded — most major news/music channels disable embedding, which empties results
const regionBase = (regionCode) => `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&regionCode=${regionCode}&maxResults=8&key=${YT_KEY}`;
const globalBase = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&key=${YT_KEY}`;
const recentBase = (regionCode) => `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&regionCode=${regionCode}&order=date&maxResults=6&key=${YT_KEY}`;

const GENERIC_LIVE = ["live music concert", "live concert stream"];

function getRegionMusicQueries(regionCode) {
  const queries = REGION_MUSIC[regionCode] ?? GENERIC_LIVE;
  return queries.map((q) => ({ q }));
}

// Tier 1: region-specific (live keywords) → Tier 2: global (always-on streams) → Tier 3: recent popular
async function fetchLive(regionCode, liveQueries, globalLiveQueries, fallbackQueries) {
  const tier1 = await fetchYT(regionBase(regionCode), liveQueries);
  if (tier1.length) return tier1;

  const tier2 = await fetchYT(globalBase, globalLiveQueries);
  if (tier2.length) return tier2;

  return fetchYT(recentBase(regionCode), fallbackQueries);
}

export function fetchCardNews(point, setCard) {
  fetchLive(
    point.regionCode,
    [
      { q: point.country + " news live"          },
      { q: point.country + " breaking news live" },
    ],
    [
      { q: "world news live stream"  },
      { q: "live news channel today" },
    ],
    [
      { q: point.country + " news today", params: "order=date" },
    ]
  )
    .then((items) => setCard((prev) => prev ? { ...prev, newsItems: items, newsLoading: false, newsError: null } : null))
    .catch((err)  => setCard((prev) => prev ? { ...prev, newsItems: [], newsLoading: false, newsError: err?.ytCode === 403 ? "quota" : "error" } : null));
}

export function fetchCardWeather(point, setCard) {
  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&current_weather=true&forecast_days=1`
  )
    .then((r) => r.json())
    .then((data) => setCard((prev) => prev ? { ...prev, weather: data.current_weather ?? null, weatherLoading: false } : null))
    .catch(()    => setCard((prev) => prev ? { ...prev, weather: null,                          weatherLoading: false } : null));

  fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${point.latitude}&longitude=${point.longitude}&current=us_aqi,pm2_5,pm10`
  )
    .then((r) => r.json())
    .then((data) => setCard((prev) => prev ? { ...prev, aqi: data.current ?? null } : null))
    .catch(() => {});
}

export function fetchCardMusic(point, setCard) {
  fetchLive(
    point.regionCode,
    getRegionMusicQueries(point.regionCode),
    [
      { q: "lofi hip hop radio beats to study" },
      { q: "24/7 chill music live stream"      },
      { q: "live music radio stream"           },
    ],
    [
      { q: point.country + " popular songs 2025", params: "order=viewCount" },
    ]
  )
    .then((items) => setCard((prev) => prev ? { ...prev, musicItems: items, musicLoading: false, musicError: null } : null))
    .catch((err)  => setCard((prev) => prev ? { ...prev, musicItems: [], musicLoading: false, musicError: err?.ytCode === 403 ? "quota" : "error" } : null));
}

export function fetchCardPhotos(point, setCard) {
  fetchUnsplashPhotos(point.city)
    .then((photos) => setCard((prev) => prev ? { ...prev, photoItems: photos, photoLoading: false, photoError: null } : null))
    .catch(() => setCard((prev) => prev ? { ...prev, photoItems: [], photoLoading: false, photoError: "error" } : null));
}

export function fetchCardCurrency(currencyCode, setCard) {
  if (!currencyCode || currencyCode === "N/A") return;
  fetch(`https://api.frankfurter.dev/v1/latest?from=${currencyCode}&to=USD,EUR,GBP,JPY,INR`)
    .then((r) => r.json())
    .then((data) => setCard((prev) =>
      prev ? { ...prev, currencyRates: { base: currencyCode, rates: data.rates || {} } } : null
    ))
    .catch(() => {});
}

export function fetchCardWiki(city, setCard) {
  fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
  )
    .then((r) => r.json())
    .then((data) => setCard((prev) =>
      prev ? { ...prev, wikiSummary: data.extract || null, wikiLoading: false } : null
    ))
    .catch(() => setCard((prev) => prev ? { ...prev, wikiSummary: null, wikiLoading: false } : null));
}

export function fetchCardCountry(regionCode, setCard) {
  fetch(`https://restcountries.com/v3.1/alpha/${regionCode}`)
    .then((r) => r.json())
    .then((data) => {
      const c = data[0];
      const currencyCode = Object.keys(c.currencies ?? {})[0] ?? null;
      setCard((prev) =>
        prev
          ? {
              ...prev,
              countryInfo: {
                flag:         c.flags?.svg ?? "",
                capital:      c.capital?.[0] ?? "N/A",
                population:   c.population ?? 0,
                currency:     Object.values(c.currencies ?? {})[0]?.name ?? "N/A",
                currencyCode: currencyCode ?? "N/A",
                languages:    Object.values(c.languages  ?? {}).slice(0, 3).join(", "),
                region:       c.region ?? "N/A",
              },
              countryLoading: false,
            }
          : null
      );
      if (currencyCode) fetchCardCurrency(currencyCode, setCard);
    })
    .catch(() => setCard((prev) => prev ? { ...prev, countryInfo: null, countryLoading: false } : null));
}
