
import { useEffect, useId, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { cn } from "@/lib/cn";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  speed?: number;
}

export function SparklesCore({
  id,
  className,
  background = "transparent",
  particleColor = "#ffffff",
  minSize = 0.4,
  maxSize = 1.2,
  particleDensity = 60,
  speed = 0.8,
}: SparklesCoreProps) {
  const [ready, setReady] = useState(false);
  const reactId = useId();

  useEffect(() => {
    let cancelled = false;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const options: ISourceOptions = {
    background: { color: { value: background } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: {
        value: particleDensity,
        density: { enable: true, width: 1920, height: 1080 },
      },
      color: { value: particleColor },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.2, max: 1 },
        animation: { enable: true, speed: speed, sync: false, startValue: "random" },
      },
      size: {
        value: { min: minSize, max: maxSize },
      },
      move: {
        enable: true,
        speed: speed * 0.4,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
  };

  if (!ready) return <div className={className} />;

  return (
    <Particles
      id={id ?? reactId.replace(/:/g, "")}
      className={cn(className)}
      options={options}
    />
  );
}
