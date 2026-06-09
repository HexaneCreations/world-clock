import { useState } from "react";

export default function PhotosTab({ photoItems, photoLoading, photoError, city }) {
  const [lightbox, setLightbox] = useState(null);

  if (photoLoading) {
    return <div className="card-loading"><span className="spinner" />Loading photos…</div>;
  }
  if (!photoItems?.length) {
    return (
      <div className="card-empty">
        <p>
          {photoError === "no-key"
            ? "Unsplash API key not configured."
            : `No photos found for ${city}.`}
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="photo-grid">
        {photoItems.map((p) => (
          <button key={p.id} className="photo-item" onClick={() => setLightbox(p)} aria-label={p.alt}>
            <img src={p.url} alt={p.alt} loading="lazy" />
          </button>
        ))}
      </div>
      <p className="photo-attribution">
        Photos by <a href="https://unsplash.com?utm_source=nowhere&utm_medium=referral" target="_blank" rel="noreferrer">Unsplash</a>
      </p>

      {lightbox && (
        <div className="photo-lightbox" onClick={() => setLightbox(null)}>
          <div className="photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.full} alt={lightbox.alt} />
            <div className="photo-lightbox-meta">
              <a href={`${lightbox.userLink}?utm_source=nowhere&utm_medium=referral`} target="_blank" rel="noreferrer">
                {lightbox.user}
              </a>
              <button onClick={() => setLightbox(null)}>×</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
