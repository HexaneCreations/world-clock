import Globe from "react-globe.gl";
import * as THREE from "three";
import { getSunPosition, sunToDir } from "../utils/globe";
import GlobeMosaic from "./GlobeMosaic";

export default function GlobeView({
  globeRef,
  mapCanvasRef,
  mapSize,
  activeRecords,
  ringRecords,
  cityArcs,
  nightOverlayData,
  nowRef,
  getPointColor,
  getRingColor,
  onPointClick,
  onMouseEnter,
  onMouseLeave,
  children,
}) {
  return (
    <div
      ref={mapCanvasRef}
      className="map-canvas globe-canvas"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <GlobeMosaic />
      <div className="globe-overlay" aria-hidden="true" />

      {mapSize.width > 0 && mapSize.height > 0 && (
          <Globe
            ref={globeRef}
            width={mapSize.width}
            height={mapSize.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#7aa2ff"
            atmosphereAltitude={0.18}
            pointsData={activeRecords}
            pointLat="latitude"
            pointLng="longitude"
            pointColor={getPointColor}
            pointAltitude={0.04}
            pointRadius={1.4}
            pointLabel={(d) => `${d.city}, ${d.country}`}
            onPointClick={onPointClick}
            ringsData={ringRecords}
            ringLat="latitude"
            ringLng="longitude"
            ringColor={getRingColor}
            ringMaxRadius={5}
            ringPropagationSpeed={1.5}
            ringRepeatPeriod={800}
            arcsData={cityArcs}
            arcColor={() => ["rgba(122, 162, 255, 0.6)", "rgba(163, 135, 255, 0.35)"]}
            arcStroke={0.5}
            arcDashLength={0.35}
            arcDashGap={0.6}
            arcDashAnimateTime={2800}
            arcAltitudeAutoScale={0.18}
            customLayerData={nightOverlayData}
            customLayerLat="lat"
            customLayerLng="lng"
            customThreeObject={() => {
              const geo      = new THREE.SphereGeometry(101, 64, 32);
              const nightTex = new THREE.TextureLoader().load(
                "https://unpkg.com/three-globe/example/img/earth-night.jpg"
              );
              const mat = new THREE.ShaderMaterial({
                uniforms: {
                  sunDir:   { value: new THREE.Vector3(1, 0, 0) },
                  nightTex: { value: nightTex },
                },
                vertexShader: `
                  varying vec3 vWorldNormal;
                  void main() {
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `,
                fragmentShader: `
                  uniform vec3 sunDir;
                  uniform sampler2D nightTex;
                  varying vec3 vWorldNormal;
                  void main() {
                    float sun        = dot(vWorldNormal, sunDir);
                    float nightBlend = smoothstep(0.1, -0.1, sun);
                    float angle = atan(vWorldNormal.z, vWorldNormal.x + 0.0001);
                    float u = 0.75 - angle / (2.0 * 3.14159265);
                    u = fract(u);
                    float v = asin(clamp(vWorldNormal.y, -1.0, 1.0)) / 3.14159265 + 0.5;
                    vec4 city = texture2D(nightTex, vec2(u, v));
                    gl_FragColor = vec4(city.rgb, nightBlend * 0.95);
                  }
                `,
                transparent: true,
                depthWrite:  false,
              });
              return new THREE.Mesh(geo, mat);
            }}
            customThreeObjectUpdate={(obj) => {
              obj.position.set(0, 0, 0);
              obj.rotation.set(0, -Math.PI / 2, 0);
              if (!obj.material?.uniforms?.sunDir) return;
              const { lat, lng } = getSunPosition(nowRef.current);
              const [x, y, z]    = sunToDir(lat, lng);
              obj.material.uniforms.sunDir.value.set(x, y, z);
            }}
          />
      )}

      {/* InfoCard is rendered here as a child — positioned absolute inside this container */}
      {children}
    </div>
  );
}
