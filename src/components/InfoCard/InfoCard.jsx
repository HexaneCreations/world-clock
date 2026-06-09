import NewsTab    from "./NewsTab";
import MusicTab   from "./MusicTab";
import WeatherTab from "./WeatherTab";
import MoreTab    from "./MoreTab";
import PhotosTab  from "./PhotosTab";

const TABS = [
  { id: "news",    label: "🔴 Live News"   },
  { id: "weather", label: "🌤 Weather"     },
  { id: "music",   label: "🔴 Live Music"  },
  { id: "photos",  label: "📷 Photos"      },
  { id: "more",    label: "🌍 More"        },
];

export default function InfoCard({ card, onClose, onTabClick, onPlay }) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <div className="info-card-title">
          <span className="info-card-city">{card.city.city}</span>
          <span className="info-card-country">{card.city.country}</span>
        </div>
        <div className="info-card-header-actions">
          <button className="info-card-close" onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>

      <div className="info-card-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={card.tab === id ? "active" : ""}
            onClick={() => onTabClick(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="info-card-body">
        {card.tab === "news"    && (
          <NewsTab
            newsItems={card.newsItems}
            newsLoading={card.newsLoading}
            newsError={card.newsError}
            country={card.city.country}
            playingId={card.playingId}
            onPlay={onPlay}
          />
        )}
        {card.tab === "music"   && (
          <MusicTab
            musicItems={card.musicItems}
            musicLoading={card.musicLoading}
            musicError={card.musicError}
            country={card.city.country}
            playingId={card.playingId}
            onPlay={onPlay}
          />
        )}
        {card.tab === "weather" && (
          <WeatherTab weather={card.weather} weatherLoading={card.weatherLoading} />
        )}
        {card.tab === "photos"  && (
          <PhotosTab
            photoItems={card.photoItems}
            photoLoading={card.photoLoading}
            photoError={card.photoError}
            city={card.city.city}
          />
        )}
        {card.tab === "more"    && (
          <MoreTab countryInfo={card.countryInfo} countryLoading={card.countryLoading} />
        )}
      </div>
    </div>
  );
}
