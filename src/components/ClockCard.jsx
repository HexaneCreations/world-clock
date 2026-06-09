import { getBusinessStatus, BIZ_LABELS } from "../utils/business";
import { getClockHandAngles, formatTime, formatDate, formatDifference } from "../utils/time";

export default function ClockCard({ cityRecord, now, viewMode, localOffset, onRemove }) {
  const { hourDeg, minuteDeg, secondDeg } = getClockHandAngles(cityRecord.zone, now);
  const status                            = getBusinessStatus(cityRecord.zone, now);
  const { label: bizLabel, advice: bizAdvice } = BIZ_LABELS[status];

  return (
    <article className="clock-card">
      <button
        type="button"
        className="remove-city"
        onClick={() => onRemove(cityRecord.id)}
        aria-label={`Remove ${cityRecord.city}`}
        title="Remove city"
      >×</button>

      <div className="card-inner">
        {/* ── Front ── */}
        <div className="card-front">
          {(viewMode === "both" || viewMode === "analog") && (
            <div className="dial-clock" aria-hidden="true">
              <span className="dial-ring" />
              <span className="dial-ring inner" />
              <span className="dial-mark top" />
              <span className="dial-mark right" />
              <span className="dial-mark bottom" />
              <span className="dial-mark left" />
              <span className="dial-center" />
              <span className="dial-hand hour-hand"   style={{ transform: `rotate(${hourDeg}deg)`   }} />
              <span className="dial-hand minute-hand" style={{ transform: `rotate(${minuteDeg}deg)` }} />
              <span className="dial-hand second-hand" style={{ transform: `rotate(${secondDeg}deg)` }} />
            </div>
          )}
          <h3>{cityRecord.city}</h3>
          <p className="meta-country">{cityRecord.country}</p>
          {(viewMode === "both" || viewMode === "digital") && (
            <p className="time">{formatTime(cityRecord.zone, now)}</p>
          )}
          <p className="date">{formatDate(cityRecord.zone, now)}</p>
          <p className="timezone">{cityRecord.offsetLabel}</p>
          <p className="difference">{formatDifference(cityRecord.offsetMinutes, localOffset)}</p>
          <span className="flip-hint">Hover to flip ↻</span>
        </div>

        {/* ── Back ── */}
        <div className="card-back">
          <p className="back-city-name">{cityRecord.city}</p>
          <div className={`biz-status biz-${status}`}>
            <span className="biz-pulse" />
            {bizLabel}
          </div>
          <p className="biz-advice">{bizAdvice}</p>
          <p className="back-timediff">{formatDifference(cityRecord.offsetMinutes, localOffset)}</p>
          <span className="back-offset-badge">{cityRecord.offsetLabel}</span>
          <p className="back-local-time">{formatTime(cityRecord.zone, now)}</p>
        </div>
      </div>
    </article>
  );
}
