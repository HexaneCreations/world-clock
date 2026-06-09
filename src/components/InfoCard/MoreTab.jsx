import { formatPop } from "../../utils/weather";

export default function MoreTab({ countryInfo, countryLoading }) {
  if (countryLoading) {
    return <div className="card-loading"><span className="spinner" />Loading…</div>;
  }
  if (!countryInfo) {
    return <div className="card-empty">Country data unavailable.</div>;
  }
  return (
    <div className="country-info">
      {countryInfo.flag && <img src={countryInfo.flag} alt="flag" className="country-flag" />}
      <div className="country-stats">
        {[
          ["Capital",    countryInfo.capital],
          ["Population", formatPop(countryInfo.population)],
          ["Currency",   countryInfo.currency],
          ["Languages",  countryInfo.languages],
          ["Region",     countryInfo.region],
        ].map(([label, value]) => (
          <div key={label} className="country-stat-row">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
