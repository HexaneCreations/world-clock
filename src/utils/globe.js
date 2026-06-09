export function getSunPosition(date) {
  const dayOfYear    = Math.round((date - new Date(date.getFullYear(), 0, 1)) / 86400000);
  const declination  = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  const utcHours     = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return { lat: declination, lng: -(utcHours - 12) * 15 };
}

export function sunToDir(lat, lng) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (90 - lng) * Math.PI / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}
