export function getBusinessStatus(zone, now) {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hour12: false }).format(now)
  );
  if (h >= 9 && h < 17) return "work";
  if ((h >= 17 && h < 22) || (h >= 7 && h < 9)) return "evening";
  return "night";
}

export const BIZ_COLORS = {
  work:    { dot: "#4ade80", ring: "rgba(74,222,128,0.6)"    },
  evening: { dot: "#fbbf24", ring: "rgba(251,191,36,0.55)"  },
  night:   { dot: "#94a3b8", ring: "rgba(148,163,184,0.45)" },
};

export const BIZ_LABELS = {
  work:    { label: "Business Hours", advice: "Great time to connect! 🤝"     },
  evening: { label: "Evening",        advice: "Winding down for the day 🌆"   },
  night:   { label: "Night Time",     advice: "Likely asleep right now 😴"    },
};
