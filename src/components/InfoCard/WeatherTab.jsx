import { weatherInfo } from "../../utils/weather";

export default function WeatherTab({ weather, weatherLoading }) {
  if (weatherLoading) {
    return <div className="card-loading"><span className="spinner" />Loading weather…</div>;
  }
  if (!weather) {
    return <div className="card-empty">Weather data unavailable.</div>;
  }
  const { temperature, windspeed, winddirection, weathercode, is_day } = weather;
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
}
