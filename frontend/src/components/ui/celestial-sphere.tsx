
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/cn";

interface CelestialSphereProps {
  className?: string;
  hue?: number;
  speed?: number;
  zoom?: number;
  particleSize?: number;
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform float uHue;
  uniform float uZoom;
  uniform float uParticle;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // hsl -> rgb
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uZoom;
    uv.x *= uRes.x / uRes.y;

    // Nebula clouds — layered FBM
    float t = uTime * 0.06;
    vec2 q = uv + vec2(t, -t * 0.5);
    float cloud = fbm(q * 2.0 + fbm(q * 3.0 + t) * 1.2);
    cloud = pow(cloud, 1.6);

    // Hue drives color: 0 = red, 0.66 = blue, etc.
    float hueShift = uHue / 360.0;
    vec3 base = hsl2rgb(vec3(hueShift, 0.75, 0.48));
    vec3 accent = hsl2rgb(vec3(mod(hueShift + 0.04, 1.0), 0.90, 0.60));
    vec3 color = mix(vec3(0.02, 0.015, 0.015), base, cloud);
    color += accent * pow(cloud, 3.0) * 1.4;

    // Starfield — tiny points via hash
    vec2 sUv = vUv * uRes / uParticle;
    vec2 sId = floor(sUv);
    vec2 sF  = fract(sUv) - 0.5;
    float star = hash(sId);
    float sparkle = smoothstep(0.48, 0.5, star) * smoothstep(0.05, 0.0, length(sF));
    sparkle *= 0.6 + 0.4 * sin(uTime * 2.0 + star * 20.0);
    color += vec3(sparkle) * 1.2;

    // Vignette
    float vg = smoothstep(1.1, 0.25, length(uv));
    color *= vg;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function CelestialSphere({
  className,
  hue = 0,
  speed = 0.2,
  zoom = 2.2,
  particleSize = 1.5,
}: CelestialSphereProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uHue: { value: hue },
      uZoom: { value: zoom },
      uParticle: { value: Math.max(1, particleSize * 40) },
    };

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      uniforms.uTime.value = prefersReduced ? 0 : ((now - start) / 1000) * speed;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [hue, speed, zoom, particleSize]);

  return <div ref={ref} className={cn("pointer-events-none h-full w-full", className)} />;
}

export default CelestialSphere;
