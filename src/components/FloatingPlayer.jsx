import { useCallback, useRef, useState } from "react";
import YouTubeEmbed from "./InfoCard/YouTubeEmbed";

function DraggablePlayer({ nowPlaying, playingTitle, onStop, onAutoNext, onEmbedError }) {
  const playerRef    = useRef(null);
  const embedWrapRef = useRef(null);
  const [pos, setPos] = useState(null);

  const startDrag = useCallback((clientX, clientY) => {
    const rect    = playerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const move = (cx, cy) => setPos({
      left: Math.max(0, Math.min(window.innerWidth  - rect.width,  cx - offsetX)),
      top:  Math.max(0, Math.min(window.innerHeight - rect.height, cy - offsetY)),
    });

    const onMouseMove = (e) => move(e.clientX, e.clientY);
    const onTouchMove = (e) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); };
    const stop = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  stop);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   stop);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  stop);
  }, []);

  const handleMouseDown  = (e) => { if (e.button === 0) { e.preventDefault(); startDrag(e.clientX, e.clientY); } };
  const handleTouchStart = (e) => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); };

  const handleFullscreen = () => {
    const iframe = embedWrapRef.current?.querySelector("iframe");
    if (!iframe) return;
    (iframe.requestFullscreen ?? iframe.webkitRequestFullscreen ?? iframe.mozRequestFullScreen)?.call(iframe);
  };

  const style = pos ? { left: pos.left, top: pos.top, bottom: "auto", right: "auto" } : undefined;
  const label = nowPlaying.tab === "music" ? "Music" : "News";

  return (
    <div className="floating-player" ref={playerRef} style={style}>
      <div className="fp-header fp-draggable" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
        <div className="fp-meta">
          <span className="fp-label">{nowPlaying.city.city} · {label}</span>
          <span className="fp-title" title={playingTitle}>{playingTitle}</span>
        </div>
        <div className="fp-actions">
          <button className="fp-btn" onClick={onAutoNext} title="Next">⏭</button>
          <button className="fp-btn" onClick={handleFullscreen} title="Fullscreen">⛶</button>
          <a
            className="fp-btn fp-btn-link"
            href={`https://www.youtube.com/watch?v=${nowPlaying.videoId}`}
            target="_blank"
            rel="noreferrer"
            title="Open on YouTube"
          >↗</a>
          <button className="fp-btn fp-btn-stop" onClick={onStop} title="Stop">■</button>
        </div>
      </div>
      <div ref={embedWrapRef}>
        <YouTubeEmbed
          videoId={nowPlaying.videoId}
          onEnded={onAutoNext}
          onEmbedError={onEmbedError}
          height="155"
        />
      </div>
    </div>
  );
}

export default function FloatingPlayer(props) {
  if (!props.nowPlaying?.videoId) return null;
  return <DraggablePlayer {...props} />;
}
