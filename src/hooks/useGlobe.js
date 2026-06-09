import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT } from "../utils/constants";
import { getBusinessStatus, BIZ_COLORS } from "../utils/business";

export default function useGlobe(nowRef) {
  const globeRef     = useRef(null);
  const mapCanvasRef = useRef(null);
  const cardOpenRef  = useRef(false);
  const [mapSize, setMapSize] = useState({ width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT });

  useEffect(() => {
    if (!mapCanvasRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth  = Math.max(Math.round(entry.contentRect.width),  1);
      const nextHeight = Math.max(Math.round(entry.contentRect.height), 1);
      setMapSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    });
    observer.observe(mapCanvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls          = globeRef.current.controls();
    controls.enableRotate   = true;
    controls.enableZoom     = true;
    controls.enablePan      = false;
    controls.autoRotate     = true;
    controls.autoRotateSpeed = 5;
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.1;
    controls.rotateSpeed    = 0.9;
    controls.minPolarAngle  = 0.15;
    controls.maxPolarAngle  = Math.PI - 0.15;
    controls.minDistance    = 130;
    controls.maxDistance    = 420;
    globeRef.current.pointOfView({ lat: 18, lng: 10, altitude: 2.1 }, 800);
  }, [mapSize.width, mapSize.height]);

  const getPointColor = useCallback(
    (d) => BIZ_COLORS[getBusinessStatus(d.zone, nowRef.current)].dot,
    [nowRef]
  );

  const getRingColor = useCallback(
    (d) => BIZ_COLORS[getBusinessStatus(d.zone, nowRef.current)].ring,
    [nowRef]
  );

  return { globeRef, mapCanvasRef, mapSize, cardOpenRef, getPointColor, getRingColor };
}
