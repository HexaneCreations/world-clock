import { useRef } from "react";
import YouTubeEmbed from "./YouTubeEmbed";

export default function PlayerView({ playingId, onBack, onEmbedError }) {
  const embedWrapRef = useRef(null);

  const handleFullscreen = () => {
    const iframe = embedWrapRef.current?.querySelector("iframe");
    if (!iframe) return;
    (iframe.requestFullscreen ?? iframe.webkitRequestFullscreen ?? iframe.mozRequestFullScreen)?.call(iframe);
  };

  return (
    <div className="player-wrap">
      <div className="player-controls">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className="fullscreen-btn" onClick={handleFullscreen} title="Fullscreen">⛶</button>
      </div>
      <div ref={embedWrapRef}>
        <YouTubeEmbed videoId={playingId} onEmbedError={onEmbedError} height="220" />
      </div>
      <a
        className="yt-fallback-link"
        href={`https://www.youtube.com/watch?v=${playingId}`}
        target="_blank"
        rel="noreferrer"
      >
        ▶ Open on YouTube
      </a>
    </div>
  );
}
