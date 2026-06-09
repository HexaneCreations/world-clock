export const formatTime = (zone, now) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(now);

export const formatDate = (zone, now) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: zone, weekday: "short", month: "short", day: "2-digit", year: "numeric",
  }).format(now);

export const parseOffsetMinutes = (zone, referenceDate) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, timeZoneName: "longOffset",
  }).formatToParts(referenceDate);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+00:00";
  if (offsetPart === "GMT") return 0;
  const matched = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!matched) return 0;
  const sign = matched[1] === "-" ? -1 : 1;
  return sign * (Number(matched[2] || "0") * 60 + Number(matched[3] || "0"));
};

export const formatOffsetLabel = (offsetMinutes) => {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs  = Math.abs(offsetMinutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};

export const formatDifference = (cityOffset, localOffset) => {
  const diff = cityOffset - localOffset;
  if (diff === 0) return "Same as your time";
  const abs   = Math.abs(diff);
  const h     = Math.floor(abs / 60);
  const m     = abs % 60;
  const value = m === 0 ? `${h}h` : `${h}h ${m}m`;
  return `${diff > 0 ? "+" : "-"}${value} ${diff > 0 ? "ahead of you" : "behind you"}`;
};

export const getClockHandAngles = (zone, now) => {
  const parts  = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(now);
  const hour   = Number(parts.find((p) => p.type === "hour")?.value   || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  const second = Number(parts.find((p) => p.type === "second")?.value || "0");
  return {
    hourDeg:   (hour % 12) * 30 + minute * 0.5,
    minuteDeg: minute * 6 + second * 0.1,
    secondDeg: second * 6,
  };
};
