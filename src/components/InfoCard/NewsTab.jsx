export default function NewsTab({ newsItems, newsLoading, newsError, country, playingId, onPlay }) {
  if (newsLoading) {
    return <div className="card-loading"><span className="spinner" />Finding news…</div>;
  }
  if (!newsItems?.length) {
    return (
      <div className="card-empty">
        <p>
          {newsError === "quota"
            ? "YouTube API quota reached for today. Try again tomorrow or search directly."
            : "No results found for this region."}
        </p>
        <a
          className="yt-fallback-link"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(country + " news live today")}`}
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
      {newsItems.map((item) => (
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
