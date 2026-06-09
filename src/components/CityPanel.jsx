export default function CityPanel({ isOpen, onToggle, availableCities, onAdd }) {
  return (
    <>
      <button
        type="button"
        className="fab"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="city-panel"
        title="Add or remove cities"
      >+</button>

      {isOpen && (
        <section id="city-panel" className="city-panel" aria-label="Add cities">
          <h2>Add Cities</h2>
          <p>Select up to 8 cities for your dashboard.</p>
          <div className="city-actions">
            {availableCities.length === 0 && <span>All available cities are already added.</span>}
            {availableCities.map((city) => (
              <button key={`add-${city.id}`} type="button" onClick={() => onAdd(city.id)}>
                + {city.city}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
