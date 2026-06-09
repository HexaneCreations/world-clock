export default function MusicTab({ musicItems, musicLoading, musicError, country, playingId, onPlay }) {
  if (musicLoading) {
    return <div className="card-loading"><span className="spinner" />Finding music…</div>;
  }
  if (!musicItems?.length) {
    return (
      <div className="card-empty">
        <p>
          {musicError === "quota"
            ? "YouTube API quota reached for today. Try again tomorrow or search directly."
            : "No results found for this region."}
        </p>
        <a
          className="yt-fallback-link"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(country + " music live")}`}
          target="_blank"
          rel="noreferrer"
        >
          ▶ Search on YouTube
        </a>
      </div>
    );
  }
  return (
    <ul className="news-list">
      {musicItems.map((item) => (
        <li key={item.id.videoId} className={`news-item${item.id.videoId === playingId ? " playing" : ""}`} onClick={() => onPlay(item.id.videoId)}>
          <img src={item.snippet.thumbnails.medium?.url} alt="" className="news-thumb" />
          <div className="news-meta">
            <p className="news-title">{item.snippet.title}</p>
            <p className="news-channel">{item.snippet.channelTitle}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
