import { formatPop } from "../../utils/weather";

export default function MoreTab({ countryInfo, countryLoading, wikiSummary, wikiLoading, currencyRates }) {
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
      {currencyRates?.rates && Object.keys(currencyRates.rates).length > 0 && (
        <div className="currency-rates">
          <p className="currency-title">1 {currencyRates.base} =</p>
          <div className="currency-grid">
            {Object.entries(currencyRates.rates).map(([code, rate]) => (
              <div key={code} className="currency-row">
                <span>{code}</span>
                <strong>{rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {wikiLoading && <p className="wiki-summary wiki-loading"><span className="spinner" /></p>}
      {!wikiLoading && wikiSummary && (
        <p className="wiki-summary">{wikiSummary}</p>
      )}
    </div>
  );
}
