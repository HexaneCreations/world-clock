import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;
    let stars = [];

    const buildStars = (w, h) => {
      stars = Array.from({ length: 320 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.15 + 0.15,
        baseOpacity: Math.random() * 0.6 + 0.25,
        speed: Math.random() * 0.014 + 0.004,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildStars(canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const a1 = Math.sin(t * 0.008)       * 0.5 + 0.5;
      const a2 = Math.sin(t * 0.005 + 2.1) * 0.5 + 0.5;
      const a3 = Math.sin(t * 0.006 + 4.3) * 0.5 + 0.5;

      // Left aurora pool — deep blue
      const g1 = ctx.createRadialGradient(w * 0.1, h * 0.55, 0, w * 0.1, h * 0.55, w * 0.48);
      g1.addColorStop(0,   `rgba(28, 85, 255, ${0.1 + a1 * 0.08})`);
      g1.addColorStop(0.5, `rgba(40, 55, 200, ${0.05 + a1 * 0.04})`);
      g1.addColorStop(1,   "rgba(15, 25, 130, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Right aurora pool — violet
      const g2 = ctx.createRadialGradient(w * 0.9, h * 0.38, 0, w * 0.9, h * 0.38, w * 0.44);
      g2.addColorStop(0,   `rgba(140, 55, 255, ${0.11 + a2 * 0.08})`);
      g2.addColorStop(0.5, `rgba(100, 35, 220, ${0.05 + a2 * 0.04})`);
      g2.addColorStop(1,   "rgba(55, 15, 160, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Centre top — electric blue sweep
      const g3 = ctx.createLinearGradient(w * 0.28, 0, w * 0.72, h * 0.65);
      g3.addColorStop(0,   `rgba(70, 180, 255, ${0.045 + a3 * 0.03})`);
      g3.addColorStop(0.4, `rgba(35, 115, 240, ${0.03  + a3 * 0.02})`);
      g3.addColorStop(1,   "rgba(15, 50, 170, 0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Stars with twinkling
      for (const s of stars) {
        const o = s.baseOpacity * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 228, 255, ${o})`;
        ctx.fill();
      }

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
