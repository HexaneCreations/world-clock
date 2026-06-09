export const WMO = {
  0:  ["Clear sky",           "☀️"],
  1:  ["Mainly clear",        "🌤️"],
  2:  ["Partly cloudy",       "⛅"],
  3:  ["Overcast",            "☁️"],
  45: ["Foggy",               "🌫️"],
  48: ["Icy fog",             "🌫️"],
  51: ["Light drizzle",       "🌦️"],
  53: ["Drizzle",             "🌦️"],
  55: ["Heavy drizzle",       "🌧️"],
  61: ["Light rain",          "🌧️"],
  63: ["Rain",                "🌧️"],
  65: ["Heavy rain",          "🌧️"],
  71: ["Light snow",          "🌨️"],
  73: ["Snow",                "❄️"],
  75: ["Heavy snow",          "❄️"],
  77: ["Snow grains",         "❄️"],
  80: ["Rain showers",        "🌦️"],
  81: ["Showers",             "🌧️"],
  82: ["Heavy showers",       "⛈️"],
  85: ["Snow showers",        "🌨️"],
  86: ["Heavy snow showers",  "❄️"],
  95: ["Thunderstorm",        "⛈️"],
  96: ["Thunderstorm + hail", "⛈️"],
  99: ["Thunderstorm + hail", "⛈️"],
};

export const weatherInfo = (code) => {
  const e = WMO[code];
  return e ? { label: e[0], emoji: e[1] } : { label: "Unknown", emoji: "🌡️" };
};

export const formatPop = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "K";
  return String(n);
};
