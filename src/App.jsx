import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useClock from "./hooks/useClock";
import useGlobe from "./hooks/useGlobe";

import { cityCatalog, initialCityIds } from "./data/cities";
import { parseOffsetMinutes, formatOffsetLabel }             from "./utils/time";
import { fetchCardNews, fetchCardWeather, fetchCardMusic, fetchCardCountry, fetchCardPhotos, fetchCardWiki } from "./utils/cardFetcher";

import Hero          from "./components/Hero";
import GlobeView     from "./components/GlobeView";
import InfoCard      from "./components/InfoCard/InfoCard";
import ClockCard     from "./components/ClockCard";
import TZConverter   from "./components/TZConverter";
import CityPanel     from "./components/CityPanel";
import FloatingPlayer from "./components/FloatingPlayer";

function App() {
  const now = useClock();

  const [query,          setQuery]          = useState("");
  const [viewMode,       setViewMode]       = useState("both");
  const [activeCityIds,  setActiveCityIds]  = useState(initialCityIds);
  const [isCityPanelOpen, setIsCityPanelOpen] = useState(false);
  const [card,           setCard]           = useState(null);
  const [nowPlaying,     setNowPlaying]     = useState(null); // survives InfoCard close
  const [tzFrom,         setTzFrom]         = useState("new-york");
  const [tzTo,           setTzTo]           = useState("london");

  const nowRef  = useRef(now);
  const cardRef = useRef(card);
  useEffect(() => { nowRef.current  = now;  }, [now]);
  useEffect(() => { cardRef.current = card; }, [card]);

  const { globeRef, mapCanvasRef, mapSize, cardOpenRef, getPointColor, getRingColor } = useGlobe(nowRef);

  // ── Derived data ──────────────────────────────────────────────────────────
  const referenceDate = useMemo(() => new Date(), []);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const localOffset   = useMemo(
    () => parseOffsetMinutes(localTimeZone, referenceDate),
    [localTimeZone, referenceDate]
  );

  const allRecords = useMemo(
    () => cityCatalog.map((item) => {
      const offsetMinutes = parseOffsetMinutes(item.zone, referenceDate);
      return { ...item, offsetMinutes, offsetLabel: formatOffsetLabel(offsetMinutes) };
    }),
    [referenceDate]
  );

  const activeRecords   = useMemo(() => allRecords.filter((r) => activeCityIds.includes(r.id)), [allRecords, activeCityIds]);
  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRecords;
    return activeRecords.filter((r) =>
      `${r.city} ${r.country} ${r.zone} ${r.offsetLabel}`.toLowerCase().includes(q)
    );
  }, [activeRecords, query]);

  const availableCities  = useMemo(() => allRecords.filter((r) => !activeCityIds.includes(r.id)), [allRecords, activeCityIds]);
  const ringRecords      = useMemo(() => (activeRecords.length === 0 ? [] : [...activeRecords, ...activeRecords]), [activeRecords]);
  const cityArcs         = useMemo(() => {
    if (activeRecords.length < 2) return [];
    return activeRecords.map((r, i) => {
      const next = activeRecords[(i + 1) % activeRecords.length];
      return { startLat: r.latitude, startLng: r.longitude, endLat: next.latitude, endLng: next.longitude };
    });
  }, [activeRecords]);

  const nightOverlayData = useMemo(() => [{ lat: 0, lng: 0 }], []);

  const playingTitle = useMemo(() => {
    if (!nowPlaying?.videoId) return "";
    return nowPlaying.items.find((v) => v.id.videoId === nowPlaying.videoId)?.snippet.title || "Now Playing";
  }, [nowPlaying]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const addCity    = (id) => setActiveCityIds((prev) => (prev.includes(id) || prev.length >= 8 ? prev : [...prev, id]));
  const removeCity = (id) => setActiveCityIds((prev) => (prev.length <= 1  ? prev : prev.filter((x) => x !== id)));

  const closeCard = useCallback(() => {
    cardOpenRef.current = false;
    setCard(null);
    if (globeRef.current?.controls()) globeRef.current.controls().autoRotate = true;
  }, [cardOpenRef, globeRef]);

  const handlePointClick = useCallback((point) => {
    if (!globeRef.current) return;
    const { x, y } = globeRef.current.getScreenCoords(point.latitude, point.longitude, 0.02);
    if (globeRef.current.controls()) globeRef.current.controls().autoRotate = false;
    cardOpenRef.current = true;
    setCard({ city: point, x, y, tab: "news", newsItems: null, newsLoading: true, weather: null, weatherLoading: true, playingId: null });
    fetchCardNews(point, setCard);
    fetchCardWeather(point, setCard);
  }, [globeRef, cardOpenRef]);

  const handleTabClick = useCallback((t) => {
    setCard((prev) => {
      if (!prev || t === prev.tab) return prev;
      if (t === "music" && !prev.musicItems && !prev.musicLoading) {
        fetchCardMusic(prev.city, setCard);
        return { ...prev, tab: "music", playingId: null, musicLoading: true };
      }
      if (t === "photos" && !prev.photoItems && !prev.photoLoading) {
        fetchCardPhotos(prev.city, setCard);
        return { ...prev, tab: "photos", playingId: null, photoLoading: true };
      }
      if (t === "more" && !prev.countryInfo && !prev.countryLoading) {
        fetchCardCountry(prev.city.regionCode, setCard);
        fetchCardWiki(prev.city.city, setCard);
        return { ...prev, tab: "more", playingId: null, countryLoading: true, wikiLoading: true };
      }
      return { ...prev, tab: t, playingId: null };
    });
  }, []);

  const handlePlay = useCallback((videoId) => {
    setCard((prev) => prev ? { ...prev, playingId: videoId } : null);
    const c = cardRef.current;
    if (!c) return;
    const items = c.tab === "music" ? (c.musicItems || []) : (c.newsItems || []);
    setNowPlaying({ videoId, city: c.city, tab: c.tab, items });
  }, []);

  const handleStop = useCallback(() => {
    setNowPlaying(null);
    setCard((prev) => prev ? { ...prev, playingId: null } : null);
  }, []);

  const autoNextCooldown = useRef(false);
  const handleAutoNext = useCallback(() => {
    if (autoNextCooldown.current) return;
    autoNextCooldown.current = true;
    setTimeout(() => { autoNextCooldown.current = false; }, 1500);
    setNowPlaying((prev) => {
      if (!prev?.items?.length) return null;
      const idx  = prev.items.findIndex((v) => v.id.videoId === prev.videoId);
      const next = prev.items[idx + 1];
      if (!next) return null;
      setCard((c) => c ? { ...c, playingId: next.id.videoId } : null);
      return { ...prev, videoId: next.id.videoId };
    });
  }, []);

  const handleEmbedError = useCallback(() => handleAutoNext(), [handleAutoNext]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="page" style={card?.playingId ? { paddingBottom: 100 } : undefined}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Hero
        query={query}
        onQueryChange={setQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="map-panel">
        <div className="map-header">
          <h2>Interactive Globe</h2>
          <p>Click any city point to explore live news, music, weather, photos &amp; country info · Dots glow green in business hours</p>
        </div>

        <GlobeView
          globeRef={globeRef}
          mapCanvasRef={mapCanvasRef}
          mapSize={mapSize}
          activeRecords={activeRecords}
          ringRecords={ringRecords}
          cityArcs={cityArcs}
          nightOverlayData={nightOverlayData}
          nowRef={nowRef}
          getPointColor={getPointColor}
          getRingColor={getRingColor}
          onPointClick={handlePointClick}
          onMouseEnter={() => globeRef.current?.controls() && (globeRef.current.controls().autoRotate = false)}
          onMouseLeave={() => { if (!cardOpenRef.current && globeRef.current?.controls()) globeRef.current.controls().autoRotate = true; }}
        />

        {card && (
          <InfoCard
            card={card}
            onClose={closeCard}
            onTabClick={handleTabClick}
            onPlay={handlePlay}
          />
        )}
      </div>

      <TZConverter
        allRecords={allRecords}
        now={now}
        tzFrom={tzFrom}
        onTzFromChange={setTzFrom}
        tzTo={tzTo}
        onTzToChange={setTzTo}
      />

      {filteredRecords.length === 0 ? (
        <p className="empty-state">No matching cities in your current selection.</p>
      ) : (
        <section className="clock-grid" aria-label="World clocks">
          {filteredRecords.map((cityRecord) => (
            <ClockCard
              key={cityRecord.id}
              cityRecord={cityRecord}
              now={now}
              viewMode={viewMode}
              localOffset={localOffset}
              onRemove={removeCity}
            />
          ))}
        </section>
      )}

      <CityPanel
        isOpen={isCityPanelOpen}
        onToggle={() => setIsCityPanelOpen((prev) => !prev)}
        availableCities={availableCities}
        onAdd={addCity}
      />

      <FloatingPlayer
        nowPlaying={nowPlaying}
        playingTitle={playingTitle}
        onStop={handleStop}
        onAutoNext={handleAutoNext}
        onEmbedError={handleEmbedError}
      />
    </main>
  );
}

export default App;
