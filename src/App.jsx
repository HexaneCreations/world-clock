import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const ytReadyCallbacks = [];
let ytApiState = "idle";

function onYTReady(cb) {
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

function YouTubeEmbed({ videoId, onEmbedError, height = "170" }) {
  const divRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    const init = () => {
      if (destroyed || !divRef.current) return;
      playerRef.current = new window.YT.Player(divRef.current, {
        videoId,
        width: "100%",
        height,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onError: () => { if (!destroyed) onEmbedError?.(); } },
      });
    };
    onYTReady(init);
    return () => {
      destroyed = true;
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, [videoId]);

  return <div ref={divRef} style={{ borderRadius: 10, overflow: "hidden" }} />;
}

function getSunPosition(date) {
  const dayOfYear = Math.round((date - new Date(date.getFullYear(), 0, 1)) / 86400000);
  const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return { lat: declination, lng: -(utcHours - 12) * 15 };
}

function sunToDir(lat, lng) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (90 - lng) * Math.PI / 180; // matches three-globe polar2Cartesian (lng=0 → +Z)
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

function formatPop(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return String(n);
}

const DEFAULT_MAP_WIDTH = 1200;
const DEFAULT_MAP_HEIGHT = 540;
const CARD_W = 310;
const CARD_W_EXPANDED = 740;
const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const cityCatalog = [
  { id: "bhubaneswar", city: "Bhubaneswar", country: "India", zone: "Asia/Kolkata", latitude: 20.2961, longitude: 85.8245, regionCode: "IN" },
  { id: "new-york", city: "New York", country: "United States", zone: "America/New_York", latitude: 40.7128, longitude: -74.006, regionCode: "US" },
  { id: "london", city: "London", country: "United Kingdom", zone: "Europe/London", latitude: 51.5074, longitude: -0.1278, regionCode: "GB" },
  { id: "tokyo", city: "Tokyo", country: "Japan", zone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503, regionCode: "JP" },
  { id: "dubai", city: "Dubai", country: "United Arab Emirates", zone: "Asia/Dubai", latitude: 25.2048, longitude: 55.2708, regionCode: "AE" },
  { id: "sydney", city: "Sydney", country: "Australia", zone: "Australia/Sydney", latitude: -33.8688, longitude: 151.2093, regionCode: "AU" },
  { id: "toronto", city: "Toronto", country: "Canada", zone: "America/Toronto", latitude: 43.6532, longitude: -79.3832, regionCode: "CA" },
  { id: "sao-paulo", city: "Sao Paulo", country: "Brazil", zone: "America/Sao_Paulo", latitude: -23.5505, longitude: -46.6333, regionCode: "BR" },
];

const initialCityIds = ["bhubaneswar", "new-york", "london", "tokyo"];

const WMO = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"], 48: ["Icy fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"], 77: ["Snow grains", "❄️"],
  80: ["Rain showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm + hail", "⛈️"], 99: ["Thunderstorm + hail", "⛈️"],
};

const weatherInfo = (code) => {
  const entry = WMO[code];
  return entry ? { label: entry[0], emoji: entry[1] } : { label: "Unknown", emoji: "🌡️" };
};

const formatTime = (zone, now) =>
  new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);

const formatDate = (zone, now) =>
  new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(now);

const parseOffsetMinutes = (zone, referenceDate) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(referenceDate);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+00:00";
  if (offsetPart === "GMT") return 0;
  const matched = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!matched) return 0;
  const sign = matched[1] === "-" ? -1 : 1;
  return sign * (Number(matched[2] || "0") * 60 + Number(matched[3] || "0"));
};

const formatOffsetLabel = (offsetMinutes) => {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};

const formatDifference = (cityOffset, localOffset) => {
  const diff = cityOffset - localOffset;
  if (diff === 0) return "Same as your time";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60), m = abs % 60;
  const value = m === 0 ? `${h}h` : `${h}h ${m}m`;
  return `${diff > 0 ? "+" : "-"}${value} ${diff > 0 ? "ahead of you" : "behind you"}`;
};

const getClockHandAngles = (zone, now) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  const second = Number(parts.find((p) => p.type === "second")?.value || "0");
  return {
    hourDeg: (hour % 12) * 30 + minute * 0.5,
    minuteDeg: minute * 6 + second * 0.1,
    secondDeg: second * 6,
  };
};

function App() {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("both");
  const [activeCityIds, setActiveCityIds] = useState(initialCityIds);
  const [isCityPanelOpen, setIsCityPanelOpen] = useState(false);
  const [mapSize, setMapSize] = useState({ width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT });
  const [card, setCard] = useState(null);
  const [tzFrom, setTzFrom] = useState("new-york");
  const [tzTo, setTzTo] = useState("london");

  const globeRef = useRef(null);
  const mapCanvasRef = useRef(null);
  const cardOpenRef = useRef(false);
  const nowRef = useRef(now);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapCanvasRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(Math.round(entry.contentRect.width), 1);
      const nextHeight = Math.max(Math.round(entry.contentRect.height), 1);
      setMapSize((prev) => (prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight }));
    });
    observer.observe(mapCanvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.9;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;
    controls.minDistance = 130;
    controls.maxDistance = 420;
    globeRef.current.pointOfView({ lat: 18, lng: 10, altitude: 2.1 }, 800);
  }, [mapSize.width, mapSize.height]);

  useEffect(() => { nowRef.current = now; }, [now]);

  const referenceDate = useMemo(() => new Date(), []);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const localOffset = useMemo(() => parseOffsetMinutes(localTimeZone, referenceDate), [localTimeZone, referenceDate]);

  const allRecords = useMemo(
    () => cityCatalog.map((item) => {
      const offsetMinutes = parseOffsetMinutes(item.zone, referenceDate);
      return { ...item, offsetMinutes, offsetLabel: formatOffsetLabel(offsetMinutes) };
    }),
    [referenceDate]
  );

  const activeRecords = useMemo(() => allRecords.filter((r) => activeCityIds.includes(r.id)), [allRecords, activeCityIds]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRecords;
    return activeRecords.filter((r) => `${r.city} ${r.country} ${r.zone} ${r.offsetLabel}`.toLowerCase().includes(q));
  }, [activeRecords, query]);

  const availableCities = useMemo(() => allRecords.filter((r) => !activeCityIds.includes(r.id)), [allRecords, activeCityIds]);
  const ringRecords = useMemo(() => (activeRecords.length === 0 ? [] : [...activeRecords, ...activeRecords]), [activeRecords]);
  const cityArcs = useMemo(() => {
    if (activeRecords.length < 2) return [];
    return activeRecords.map((r, i) => {
      const next = activeRecords[(i + 1) % activeRecords.length];
      return { startLat: r.latitude, startLng: r.longitude, endLat: next.latitude, endLng: next.longitude };
    });
  }, [activeRecords]);

  const nightOverlayData = useMemo(() => [{ lat: 0, lng: 0 }], []);

  const tzFromRecord = useMemo(() => allRecords.find((r) => r.id === tzFrom) ?? allRecords[0], [allRecords, tzFrom]);
  const tzToRecord = useMemo(() => allRecords.find((r) => r.id === tzTo) ?? allRecords[1], [allRecords, tzTo]);

  const addCity = (id) => setActiveCityIds((prev) => (prev.includes(id) || prev.length >= 8 ? prev : [...prev, id]));
  const removeCity = (id) => setActiveCityIds((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== id)));

  const closeCard = useCallback(() => {
    cardOpenRef.current = false;
    setCard(null);
    if (globeRef.current?.controls()) globeRef.current.controls().autoRotate = true;
  }, []);

  const handlePointClick = useCallback((point) => {
    if (!globeRef.current) return;
    const { x, y } = globeRef.current.getScreenCoords(point.latitude, point.longitude, 0.02);
    if (globeRef.current.controls()) globeRef.current.controls().autoRotate = false;
    cardOpenRef.current = true;
    setCard({ city: point, x, y, tab: "news", newsItems: null, newsLoading: true, weather: null, weatherLoading: true, playingId: null, videoEnlarged: false });

    const liveQ = encodeURIComponent(point.country + " news live");
    const trendQ = encodeURIComponent(point.country + " breaking news today");
    const base = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&regionCode=${point.regionCode}&maxResults=5&key=${YT_KEY}`;
    Promise.all([
      fetch(`${base}&q=${liveQ}&eventType=live`).then((r) => r.json()),
      fetch(`${base}&q=${trendQ}&order=viewCount`).then((r) => r.json()),
    ])
      .then(([live, trending]) => {
        const seen = new Set();
        const merged = [...(live.items || []), ...(trending.items || [])].filter((v) => {
          if (seen.has(v.id.videoId)) return false;
          seen.add(v.id.videoId);
          return true;
        });
        setCard((prev) => (prev ? { ...prev, newsItems: merged, newsLoading: false } : null));
      })
      .catch(() => setCard((prev) => (prev ? { ...prev, newsItems: [], newsLoading: false } : null)));

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&current_weather=true&forecast_days=1`)
      .then((r) => r.json())
      .then((data) => setCard((prev) => (prev ? { ...prev, weather: data.current_weather ?? null, weatherLoading: false } : null)))
      .catch(() => setCard((prev) => (prev ? { ...prev, weather: null, weatherLoading: false } : null)));
  }, []);

  const isExpanded = !!(card?.videoEnlarged && card?.playingId);
  const activeCardW = isExpanded ? CARD_W_EXPANDED : CARD_W;
  const cardLeft = card
    ? isExpanded
      ? Math.max(8, Math.min(card.x - activeCardW / 2, mapSize.width - activeCardW - 8))
      : card.x + 20 + CARD_W > mapSize.width ? Math.max(8, card.x - CARD_W - 20) : card.x + 20
    : 0;
  const cardTop = card ? Math.max(8, Math.min(card.y - 110, mapSize.height - 420)) : 0;

  const tzDiffLabel = (() => {
    const diff = tzToRecord.offsetMinutes - tzFromRecord.offsetMinutes;
    if (diff === 0) return `${tzFromRecord.city} and ${tzToRecord.city} share the same time zone`;
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60), m = abs % 60;
    const value = m === 0 ? `${h}h` : `${h}h ${m}m`;
    return diff > 0
      ? `${tzToRecord.city} is ${value} ahead of ${tzFromRecord.city}`
      : `${tzToRecord.city} is ${value} behind ${tzFromRecord.city}`;
  })();

  return (
    <main className="page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero">
        <h1>World Clock</h1>
        <p>Track time across the world in real-time with precision</p>
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M10.5 3a7.5 7.5 0 015.99 12.01l4.75 4.74-1.41 1.41-4.74-4.75A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search city, country, or timezone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="view-toggle" role="tablist" aria-label="Clock view mode">
          {[{ id: "both", label: "Analog + Digital" }, { id: "analog", label: "Analog" }, { id: "digital", label: "Digital" }].map((opt) => (
            <button key={opt.id} type="button" className={viewMode === opt.id ? "active" : ""} onClick={() => setViewMode(opt.id)}>
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <section className="map-panel" aria-label="3D globe preview">
        <div className="map-header">
          <h2>Interactive Globe</h2>
          <p>Click any city point to see live news &amp; weather</p>
        </div>

        <div
          ref={mapCanvasRef}
          className="map-canvas globe-canvas"
          onMouseEnter={() => globeRef.current?.controls() && (globeRef.current.controls().autoRotate = false)}
          onMouseLeave={() => { if (!cardOpenRef.current && globeRef.current?.controls()) globeRef.current.controls().autoRotate = true; }}
        >
          <div className="globe-overlay" aria-hidden="true" />

          {mapSize.width > 0 && mapSize.height > 0 && (
            <div className={isExpanded ? "globe-shift-wrap" : ""}>
            <Globe
              ref={globeRef}
              width={mapSize.width}
              height={mapSize.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
              atmosphereColor="#7aa2ff"
              atmosphereAltitude={0.18}
              pointsData={activeRecords}
              pointLat="latitude"
              pointLng="longitude"
              pointColor={() => "#b6d0ff"}
              pointAltitude={0.04}
              pointRadius={1.2}
              pointLabel={(d) => `${d.city}, ${d.country}`}
              onPointClick={handlePointClick}
              ringsData={ringRecords}
              ringLat="latitude"
              ringLng="longitude"
              ringColor={() => "rgba(122, 162, 255, 0.55)"}
              ringMaxRadius={4}
              ringPropagationSpeed={1.35}
              ringRepeatPeriod={900}
              arcsData={cityArcs}
              arcColor={() => ["rgba(122, 162, 255, 0.6)", "rgba(163, 135, 255, 0.35)"]}
              arcStroke={0.5}
              arcDashLength={0.35}
              arcDashGap={0.6}
              arcDashAnimateTime={2800}
              arcAltitudeAutoScale={0.18}
              customLayerData={nightOverlayData}
              customLayerLat="lat"
              customLayerLng="lng"
              customThreeObject={() => {
                const geo = new THREE.SphereGeometry(101, 64, 32);
                const nightTex = new THREE.TextureLoader().load(
                  "https://unpkg.com/three-globe/example/img/earth-night.jpg"
                );
                const mat = new THREE.ShaderMaterial({
                  uniforms: {
                    sunDir: { value: new THREE.Vector3(1, 0, 0) },
                    nightTex: { value: nightTex },
                  },
                  vertexShader: `
                    varying vec3 vWorldNormal;
                    void main() {
                      vWorldNormal = normalize(mat3(modelMatrix) * normal);
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  `,
                  fragmentShader: `
                    uniform vec3 sunDir;
                    uniform sampler2D nightTex;
                    varying vec3 vWorldNormal;
                    void main() {
                      float sun = dot(vWorldNormal, sunDir);
                      float nightBlend = smoothstep(0.1, -0.1, sun);
                      // three-globe world space: lng=0→+Z, lng=90→+X, lng=180→-Z, lng=-90→-X
                      float u = 0.75 - atan(vWorldNormal.z, vWorldNormal.x) / (2.0 * 3.14159265);
                      float v = asin(clamp(vWorldNormal.y, -1.0, 1.0)) / 3.14159265 + 0.5;
                      vec4 city = texture2D(nightTex, vec2(u, v));
                      gl_FragColor = vec4(city.rgb, nightBlend * 0.95);
                    }
                  `,
                  transparent: true,
                  depthWrite: false,
                });
                return new THREE.Mesh(geo, mat);
              }}
              customThreeObjectUpdate={(obj) => {
                obj.position.set(0, 0, 0);
                obj.rotation.set(0, -Math.PI / 2, 0); // align with globe mesh rotation
                if (!obj.material?.uniforms?.sunDir) return;
                const { lat, lng } = getSunPosition(nowRef.current);
                const [x, y, z] = sunToDir(lat, lng);
                obj.material.uniforms.sunDir.value.set(x, y, z);
              }}
            />
            </div>
          )}

          {card && (
            <div className={`info-card${isExpanded ? " info-card--expanded" : ""}`} style={isExpanded ? {} : { left: cardLeft, top: cardTop }}>
              <div className="info-card-header">
                <div className="info-card-title">
                  <span className="info-card-city">{card.city.city}</span>
                  <span className="info-card-country">{card.city.country}</span>
                </div>
                <div className="info-card-header-actions">
                  {card.tab === "news" && card.playingId && (
                    <button
                      className={`info-card-expand${isExpanded ? " active" : ""}`}
                      onClick={() => setCard((prev) => prev ? { ...prev, videoEnlarged: !prev.videoEnlarged } : null)}
                      aria-label={isExpanded ? "Collapse video" : "Expand video"}
                      title={isExpanded ? "Collapse" : "Expand side by side"}
                    >
                      {isExpanded ? "⊡" : "⛶"}
                    </button>
                  )}
                  <button className="info-card-close" onClick={closeCard} aria-label="Close">×</button>
                </div>
              </div>

              <div className="info-card-tabs">
                {["news", "weather", "more"].map((t) => (
                  <button
                    key={t}
                    className={card.tab === t ? "active" : ""}
                    onClick={() => {
                      if (t === "more" && !card.countryInfo && !card.countryLoading) {
                        const regionCode = card.city.regionCode;
                        setCard((prev) => prev ? { ...prev, tab: "more", countryLoading: true } : null);
                        fetch(`https://restcountries.com/v3.1/alpha/${regionCode}`)
                          .then((r) => r.json())
                          .then((data) => {
                            const c = data[0];
                            setCard((prev) => prev ? {
                              ...prev,
                              countryInfo: {
                                flag: c.flags?.svg ?? "",
                                capital: c.capital?.[0] ?? "N/A",
                                population: c.population ?? 0,
                                currency: Object.values(c.currencies ?? {})[0]?.name ?? "N/A",
                                languages: Object.values(c.languages ?? {}).slice(0, 3).join(", "),
                                region: c.region ?? "N/A",
                              },
                              countryLoading: false,
                            } : null);
                          })
                          .catch(() => setCard((prev) => prev ? { ...prev, countryInfo: null, countryLoading: false } : null));
                      } else {
                        setCard((prev) => prev ? { ...prev, tab: t, playingId: null, videoEnlarged: false } : null);
                      }
                    }}
                  >
                    {t === "news" ? "📰 News" : t === "weather" ? "🌤 Weather" : "🌍 More"}
                  </button>
                ))}
              </div>

              <div className="info-card-body">
                {card.tab === "news" && (
                  card.playingId ? (
                    <div className="player-wrap">
                      {!isExpanded && (
                        <button className="back-btn" onClick={() => setCard((prev) => prev ? { ...prev, playingId: null } : null)}>← Back</button>
                      )}
                      <YouTubeEmbed
                        videoId={card.playingId}
                        onEmbedError={() =>
                          setCard((prev) => {
                            if (!prev) return null;
                            const remaining = prev.newsItems?.filter((v) => v.id.videoId !== prev.playingId) ?? [];
                            const next = remaining[0];
                            return next
                              ? { ...prev, playingId: next.id.videoId, newsItems: remaining }
                              : { ...prev, playingId: null, newsItems: [], allBlocked: true, videoEnlarged: false };
                          })
                        }
                      />
                      <a className="yt-fallback-link" href={`https://www.youtube.com/watch?v=${card.playingId}`} target="_blank" rel="noreferrer">
                        ▶ Open on YouTube
                      </a>
                    </div>
                  ) : card.newsLoading ? (
                    <div className="card-loading"><span className="spinner" />Loading news…</div>
                  ) : card.allBlocked || !card.newsItems?.length ? (
                    <div className="card-empty">
                      <p>Videos restricted in this region.</p>
                      <a className="yt-fallback-link" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(card.city.country + " news today")}&sp=EgJAAQ%3D%3D`} target="_blank" rel="noreferrer">
                        ▶ Search on YouTube
                      </a>
                    </div>
                  ) : (
                    <ul className="news-list">
                      {card.newsItems.map((item) => (
                        <li key={item.id.videoId} className="news-item" onClick={() => setCard((prev) => prev ? { ...prev, playingId: item.id.videoId } : null)}>
                          <img src={item.snippet.thumbnails.medium?.url} alt="" className="news-thumb" />
                          <div className="news-meta">
                            <p className="news-title">{item.snippet.title}</p>
                            <p className="news-channel">{item.snippet.channelTitle}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}

                {card.tab === "weather" && (
                  card.weatherLoading ? (
                    <div className="card-loading"><span className="spinner" />Loading weather…</div>
                  ) : !card.weather ? (
                    <div className="card-empty">Weather data unavailable.</div>
                  ) : (() => {
                    const { temperature, windspeed, winddirection, weathercode, is_day } = card.weather;
                    const { label, emoji } = weatherInfo(weathercode);
                    return (
                      <div className="weather-body">
                        <div className="weather-hero">
                          <span className="weather-emoji">{emoji}</span>
                          <span className="weather-temp">{Math.round(temperature)}°C</span>
                        </div>
                        <p className="weather-label">{label}</p>
                        <div className="weather-details">
                          <div className="weather-stat"><span>Wind</span><strong>{windspeed} km/h</strong></div>
                          <div className="weather-stat"><span>Direction</span><strong>{winddirection}°</strong></div>
                          <div className="weather-stat"><span>Time of day</span><strong>{is_day ? "☀️ Day" : "🌙 Night"}</strong></div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {card.tab === "more" && (
                  card.countryLoading ? (
                    <div className="card-loading"><span className="spinner" />Loading…</div>
                  ) : !card.countryInfo ? (
                    <div className="card-empty">Country data unavailable.</div>
                  ) : (
                    <div className="country-info">
                      {card.countryInfo.flag && <img src={card.countryInfo.flag} alt="flag" className="country-flag" />}
                      <div className="country-stats">
                        {[
                          ["Capital", card.countryInfo.capital],
                          ["Population", formatPop(card.countryInfo.population)],
                          ["Currency", card.countryInfo.currency],
                          ["Languages", card.countryInfo.languages],
                          ["Region", card.countryInfo.region],
                        ].map(([label, value]) => (
                          <div key={label} className="country-stat-row">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="tz-converter" aria-label="Time zone converter">
        <h2>Time Zone Converter</h2>
        <div className="tz-row">
          <div className="tz-city">
            <select value={tzFrom} onChange={(e) => setTzFrom(e.target.value)}>
              {allRecords.map((r) => <option key={r.id} value={r.id}>{r.city}, {r.country}</option>)}
            </select>
            <p className="tz-time">{formatTime(tzFromRecord.zone, now)}</p>
            <p className="tz-name">{tzFromRecord.city}</p>
            <p className="tz-offset">{tzFromRecord.offsetLabel}</p>
          </div>
          <div className="tz-arrow">⇄</div>
          <div className="tz-city">
            <select value={tzTo} onChange={(e) => setTzTo(e.target.value)}>
              {allRecords.map((r) => <option key={r.id} value={r.id}>{r.city}, {r.country}</option>)}
            </select>
            <p className="tz-time">{formatTime(tzToRecord.zone, now)}</p>
            <p className="tz-name">{tzToRecord.city}</p>
            <p className="tz-offset">{tzToRecord.offsetLabel}</p>
          </div>
        </div>
        <p className="tz-diff">{tzDiffLabel}</p>
      </section>

      {filteredRecords.length === 0 ? (
        <p className="empty-state">No matching cities in your current selection.</p>
      ) : (
        <section className="clock-grid" aria-label="World clocks">
          {filteredRecords.map((cityRecord) => {
            const { hourDeg, minuteDeg, secondDeg } = getClockHandAngles(cityRecord.zone, now);
            return (
              <article key={cityRecord.id} className="clock-card">
                <button type="button" className="remove-city" onClick={() => removeCity(cityRecord.id)} aria-label={`Remove ${cityRecord.city}`} title="Remove city">×</button>
                {(viewMode === "both" || viewMode === "analog") && (
                  <div className="dial-clock" aria-hidden="true">
                    <span className="dial-ring" />
                    <span className="dial-ring inner" />
                    <span className="dial-mark top" />
                    <span className="dial-mark right" />
                    <span className="dial-mark bottom" />
                    <span className="dial-mark left" />
                    <span className="dial-center" />
                    <span className="dial-hand hour-hand" style={{ transform: `rotate(${hourDeg}deg)` }} />
                    <span className="dial-hand minute-hand" style={{ transform: `rotate(${minuteDeg}deg)` }} />
                    <span className="dial-hand second-hand" style={{ transform: `rotate(${secondDeg}deg)` }} />
                  </div>
                )}
                <h3>{cityRecord.city}</h3>
                <p className="meta-country">{cityRecord.country}</p>
                {(viewMode === "both" || viewMode === "digital") && <p className="time">{formatTime(cityRecord.zone, now)}</p>}
                <p className="date">{formatDate(cityRecord.zone, now)}</p>
                <p className="timezone">{cityRecord.offsetLabel}</p>
                <p className="difference">{formatDifference(cityRecord.offsetMinutes, localOffset)}</p>
              </article>
            );
          })}
        </section>
      )}

      <button type="button" className="fab" onClick={() => setIsCityPanelOpen((prev) => !prev)} aria-expanded={isCityPanelOpen} aria-controls="city-panel" title="Add or remove cities">+</button>

      {isCityPanelOpen && (
        <section id="city-panel" className="city-panel" aria-label="Add cities">
          <h2>Add Cities</h2>
          <p>Select up to 8 cities for your dashboard.</p>
          <div className="city-actions">
            {availableCities.length === 0 && <span>All available cities are already added.</span>}
            {availableCities.map((city) => (
              <button key={`add-${city.id}`} type="button" onClick={() => addCity(city.id)}>+ {city.city}</button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
