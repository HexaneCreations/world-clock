import { useEffect, useRef } from "react";
import { onYTReady } from "../../utils/youtube";

export default function YouTubeEmbed({ videoId, onEnded, onEmbedError, height = "170" }) {
  const divRef       = useRef(null);
  const playerRef    = useRef(null);
  const readyRef     = useRef(false);
  const onEndedRef   = useRef(onEnded);
  const onErrorRef   = useRef(onEmbedError);

  // Keep callbacks fresh without recreating the player
  useEffect(() => { onEndedRef.current = onEnded;      }, [onEnded]);
  useEffect(() => { onErrorRef.current = onEmbedError; }, [onEmbedError]);

  // Create the player once — never recreate it
  useEffect(() => {
    let destroyed = false;
    const init = () => {
      if (destroyed || !divRef.current) return;
      playerRef.current = new window.YT.Player(divRef.current, {
        videoId,
        width: "100%",
        height,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1 },
        events: {
          onReady:       ()  => { readyRef.current = true; },
          onError:       ()  => { if (!destroyed) onErrorRef.current?.(); },
          onStateChange: (e) => { if (!destroyed && e.data === 0) onEndedRef.current?.(); },
        },
      });
    };
    onYTReady(init);
    return () => {
      destroyed = true;
      readyRef.current = false;
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When videoId changes, load the new video in the existing player (autoplays)
  useEffect(() => {
    if (readyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);

  return <div ref={divRef} style={{ borderRadius: 10, overflow: "hidden" }} />;
}
