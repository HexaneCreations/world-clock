import { useEffect, useState } from "react";

export default function Hero({ query, onQueryChange, viewMode, onViewModeChange }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <header className="hero">
      <button
        className="theme-toggle"
        onClick={() => setIsDark((d) => !d)}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
      <h1><span style={{ color: "var(--accent)" }}>Now</span>Here</h1>
      <p>The world's pulse, right now, right here.</p>
      <div className="hero-features">
        {["🕐 Time", "🔴 Live News", "🎵 Music", "🌤 Weather", "📷 Photos", "🌍 Country Info"].map((f) => (
          <span key={f} className="hero-feature-chip">{f}</span>
        ))}
      </div>

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
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="view-toggle" role="tablist" aria-label="Clock view mode">
        {[
          { id: "both",    label: "Analog + Digital" },
          { id: "analog",  label: "Analog"           },
          { id: "digital", label: "Digital"          },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={viewMode === opt.id ? "active" : ""}
            onClick={() => onViewModeChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </header>
  );
}
