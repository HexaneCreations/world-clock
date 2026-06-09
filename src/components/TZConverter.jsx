import { formatTime } from "../utils/time";

export default function TZConverter({ allRecords, now, tzFrom, onTzFromChange, tzTo, onTzToChange }) {
  const fromRecord = allRecords.find((r) => r.id === tzFrom) ?? allRecords[0];
  const toRecord   = allRecords.find((r) => r.id === tzTo)   ?? allRecords[1];

  const diff    = toRecord.offsetMinutes - fromRecord.offsetMinutes;
  const abs     = Math.abs(diff);
  const h       = Math.floor(abs / 60);
  const m       = abs % 60;
  const value   = m === 0 ? `${h}h` : `${h}h ${m}m`;
  const diffLabel =
    diff === 0
      ? `${fromRecord.city} and ${toRecord.city} share the same time zone`
      : diff > 0
        ? `${toRecord.city} is ${value} ahead of ${fromRecord.city}`
        : `${toRecord.city} is ${value} behind ${fromRecord.city}`;

  return (
    <section className="tz-converter" aria-label="Time zone converter">
      <h2>Time Zone Converter</h2>
      <div className="tz-row">
        <div className="tz-city">
          <select value={tzFrom} onChange={(e) => onTzFromChange(e.target.value)}>
            {allRecords.map((r) => (
              <option key={r.id} value={r.id}>{r.city}, {r.country}</option>
            ))}
          </select>
          <p className="tz-time">{formatTime(fromRecord.zone, now)}</p>
          <p className="tz-name">{fromRecord.city}</p>
          <p className="tz-offset">{fromRecord.offsetLabel}</p>
        </div>
        <div className="tz-arrow">⇄</div>
        <div className="tz-city">
          <select value={tzTo} onChange={(e) => onTzToChange(e.target.value)}>
            {allRecords.map((r) => (
              <option key={r.id} value={r.id}>{r.city}, {r.country}</option>
            ))}
          </select>
          <p className="tz-time">{formatTime(toRecord.zone, now)}</p>
          <p className="tz-name">{toRecord.city}</p>
          <p className="tz-offset">{toRecord.offsetLabel}</p>
        </div>
      </div>
      <p className="tz-diff">{diffLabel}</p>
    </section>
  );
}
