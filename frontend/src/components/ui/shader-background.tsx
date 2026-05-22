
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/cn";

interface ShaderBackgroundProps {
  className?: string;
  hue?: number;
  speed?: number;
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/**
 * Plasma flowing lines — layered sine field that reads as silky glowing ribbons.
 * Tinted via uHue (0 = red by default, to match brand crimson).
 */
const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform float uHue;

  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  float lines(vec2 uv, float t) {
    float v = 0.0;
    for (int i = 1; i <= 6; i++) {
      float fi = float(i);
      float freq = 2.0 + fi * 1.7;
      float amp  = 0.12 / fi;
      float phase = t * (0.35 + fi * 0.07);
      v += amp * sin(uv.x * freq + sin(uv.y * (freq * 0.5) + phase) + phase);
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    uv = uv * 2.0 - 1.0;
    uv.x *= uRes.x / uRes.y;

    float t = uTime * 0.6;

    // Layered ribbons
    float d1 = lines(uv * 1.2, t);
    float d2 = lines(uv * 2.1 + vec2(5.0, -3.0), t * 1.2 + 1.3);

    // Glow intensity from distance to each ribbon line
    float g1 = 0.016 / abs(uv.y - d1);
    float g2 = 0.011 / abs(uv.y + d2 * 0.7);

    // Tint from hue (brand crimson by default)
    float hueShift = uHue / 360.0;
    vec3 c1 = hsl2rgb(vec3(hueShift, 0.88, 0.52));
    vec3 c2 = hsl2rgb(vec3(mod(hueShift + 0.02, 1.0), 1.0, 0.62));

    vec3 color = c1 * g1 + c2 * g2;

    // Soft ambient
    color += vec3(0.03, 0.01, 0.02) * (1.0 - length(uv) * 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function ShaderBackground({
  className,
  hue = 0,
  speed = 1.0,
}: ShaderBackgroundProps) {
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
  }, [hue, speed]);

  return <div ref={ref} className={cn("pointer-events-none h-full w-full", className)} />;
}

export default ShaderBackground;
