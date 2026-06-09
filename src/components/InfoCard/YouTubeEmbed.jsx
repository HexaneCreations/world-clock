import { useEffect, useRef } from "react";
import { onYTReady } from "../../utils/youtube";

export default function YouTubeEmbed({ videoId, onEnded, onEmbedError, height = "170" }) {
  const divRef    = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    const init = () => {
      if (destroyed || !divRef.current) return;
      playerRef.current = new window.YT.Player(divRef.current, {
        videoId,
        width: "100%",
        height,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onError:       () => { if (!destroyed) onEmbedError?.(); },
          onStateChange: (e) => { if (!destroyed && e.data === 0) onEnded?.(); },
        },
      });
    };
    onYTReady(init);
    return () => {
      destroyed = true;
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, [videoId]);

  return <div ref={divRef} style={{ borderRadius: 10, overflow: "hidden" }} />;
}
