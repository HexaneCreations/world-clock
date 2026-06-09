export const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const ytReadyCallbacks = [];
let ytApiState = "idle";

export function onYTReady(cb) {
  if (ytApiState === "ready") { cb(); return; }
  ytReadyCallbacks.push(cb);
  if (ytApiState === "loading") return;
  ytApiState = "loading";
  window.onYouTubeIframeAPIReady = () => {
    ytApiState = "ready";
    ytReadyCallbacks.forEach((fn) => fn());
    ytReadyCallbacks.length = 0;
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MEM = new Map(); // in-memory layer (survives re-renders, not refreshes)

function cacheGet(url) {
  if (MEM.has(url)) return MEM.get(url);
  try {
    const raw = localStorage.getItem("ytc:" + url);
    if (!raw) return null;
    const { items, exp } = JSON.parse(raw);
    if (Date.now() > exp) { localStorage.removeItem("ytc:" + url); return null; }
    MEM.set(url, items);
    return items;
  } catch { return null; }
}

function cacheSet(url, items) {
  MEM.set(url, items);
  try {
    localStorage.setItem("ytc:" + url, JSON.stringify({ items, exp: Date.now() + CACHE_TTL }));
  } catch { /* localStorage full — mem cache still works */ }
}

export function fetchYT(base, queries) {
  return Promise.all(
    queries.map(({ q, params }) => {
      const url = `${base}&q=${encodeURIComponent(q)}${params ? "&" + params : ""}`;
      const cached = cacheGet(url);
      if (cached) return Promise.resolve(cached);
      return fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw Object.assign(new Error(data.error.message), { ytCode: data.error.code });
          const items = data.items || [];
          cacheSet(url, items);
          return items;
        });
    })
  ).then((results) => {
    const seen = new Set();
    return results
      .flatMap((items) => items)
      .filter((v) => {
        if (seen.has(v.id.videoId)) return false;
        seen.add(v.id.videoId);
        return true;
      });
  });
}
