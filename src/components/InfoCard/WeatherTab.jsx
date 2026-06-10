import { weatherInfo } from "../../utils/weather";

function aqiLabel(aqi) {
  if (aqi <= 50)  return { label: "Good",        color: "#4caf50" };
  if (aqi <= 100) return { label: "Moderate",    color: "#ffb300" };
  if (aqi <= 150) return { label: "Unhealthy*",  color: "#ff7043" };
  if (aqi <= 200) return { label: "Unhealthy",   color: "#e53935" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#9c27b0" };
  return              { label: "Hazardous",      color: "#7b1fa2" };
}

export default function WeatherTab({ weather, weatherLoading, aqi }) {
  if (weatherLoading) {
    return <div className="card-loading"><span className="spinner" />Loading weather…</div>;
  }
  if (!weather) {
    return <div className="card-empty">Weather data unavailable.</div>;
  }
  const { temperature, windspeed, winddirection, weathercode, is_day } = weather;
  const { label, emoji } = weatherInfo(weathercode);
  const aqiVal = aqi?.us_aqi;
  const aqiInfo = aqiVal != null ? aqiLabel(aqiVal) : null;
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
      {aqiInfo && (
        <div className="aqi-row">
          <span className="aqi-label">Air Quality (AQI)</span>
          <span className="aqi-value" style={{ color: aqiInfo.color }}>
            {aqiVal} — {aqiInfo.label}
          </span>
          {aqi.pm2_5 != null && <span className="aqi-sub">PM2.5: {aqi.pm2_5.toFixed(1)} · PM10: {aqi.pm10?.toFixed(1)}</span>}
        </div>
      )}
    </div>
  );
}
