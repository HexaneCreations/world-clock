export default function NowPlayingBar({ card, playingTitle, onStop }) {
  if (!card?.playingId) return null;

  return (
    <div className="now-playing-bar">
      <div className="now-playing-icon">▶</div>
      <div className="now-playing-info">
        <span className="now-playing-city">
          {card.city.city} · {card.tab === "music" ? "Music" : "News"}
        </span>
        <span className="now-playing-title">{playingTitle}</span>
      </div>
      <button className="now-playing-stop" onClick={onStop} title="Stop">■</button>
      <a
        className="now-playing-yt"
        href={`https://www.youtube.com/watch?v=${card.playingId}`}
        target="_blank"
        rel="noreferrer"
        title="Open on YouTube"
      >↗</a>
    </div>
  );
}
