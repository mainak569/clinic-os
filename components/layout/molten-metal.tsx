"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { cn } from "@/lib/utils";

/**
 * MoltenMetal
 *
 * Animated WebGL2 "molten metal" field. Adapted from React Bits' MoltenMetal
 * (TS + Tailwind) for use as a page background:
 * - `lightMode` now reaches the shader (the original never set that uniform);
 * - the pointer is tracked on the window, because a background canvas sits
 *   behind the page content and never receives mouse events itself;
 * - without WebGL2 nothing is drawn, so whatever sits underneath shows instead;
 * - with reduced motion it draws a single still frame;
 * - it pauses while the tab is hidden and fades in on its first frame.
 */

export type MoltenMetalColorMode = "molten" | "ember" | "frost";

export interface MoltenMetalProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  scale?: number;
  detail?: number;
  glow?: number;
  coreSize?: number;
  swirl?: number;
  fold?: number;
  blackPoint?: number;
  brightness?: number;
  colorMode?: MoltenMetalColorMode;
  grain?: boolean;
  grainIntensity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  opacity?: number;
  backgroundColor?: string;
  lightMode?: boolean;
  /** Upper bound on the render resolution; a soft background doesn't need retina pixels. */
  maxDpr?: number;
  className?: string;
}

type Settings = Required<Omit<MoltenMetalProps, "className" | "maxDpr">>;

const DEFAULTS: Settings = {
  color1: "#5227FF",
  color2: "#FF9FFC",
  color3: "#FFFFFF",
  speed: 0.35,
  scale: 4,
  detail: 3,
  glow: 1.6,
  coreSize: 0.1,
  swirl: 1,
  fold: -0.2,
  blackPoint: 0.05,
  brightness: 1.3,
  colorMode: "molten",
  grain: true,
  grainIntensity: 0.05,
  mouseInteraction: true,
  mouseStrength: 0.3,
  opacity: 1,
  backgroundColor: "#FFFFFF",
  lightMode: false,
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const colorModeToFloat = (mode: MoltenMetalColorMode): number =>
  mode === "ember" ? 1 : mode === "frost" ? 2 : 0;

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDetail;
uniform float uGlow;
uniform float uCoreSize;
uniform float uSwirl;
uniform float uFold;
uniform float uBlackPoint;
uniform float uBrightness;
uniform float uColorMode;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform bool uEnableMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uBackgroundColor;
uniform bool uLightMode;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float time = iTime * uSpeed;
  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

  vec2 drift = vec2(0.0);
  if (uEnableMouse) {
    drift = (uMouse - 0.5) * uMouseStrength * 2.0;
  }
  p += drift;

  vec2 i = p;
  float c = 0.0;
  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
  float d = length(p);
  float rot = d + time + p.x * uSwirl;

  float cosRot = cos(rot);
  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
  float glowCore = uGlow * uCoreSize;

  for (float n = 0.0; n < 8.0; n++) {
    if (n >= uDetail) break;
    p *= warp;
    float t = r - time / (n + 3.0);
    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
  }

  c /= 6.0;

  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;
  float g = clamp(intensity, 0.0, 1.0);

  float mid = 0.5;
  if (uColorMode > 1.5) {
    mid = 0.65;
  } else if (uColorMode > 0.5) {
    mid = 0.35;
  }

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
  col = mix(col, uColor3, smoothstep(mid, 1.0, g));

  float a = g;
  if (uGrain > 0.5) {
    float gr = hash(gl_FragCoord.xy + iTime);
    a += (gr - 0.5) * uGrainIntensity;
  }
  a = clamp(a, 0.0, 1.0) * uOpacity;
  if (uLightMode) {
    float signal = 1.0 - exp(-max(c, 0.0) * 6.5);
    float body = smoothstep(0.075, 0.68, signal);
    float ridge = smoothstep(0.42, 0.92, signal);

    vec3 lightCol = mix(uColor1, uColor2, smoothstep(0.08, 0.52, signal));
    lightCol = mix(lightCol, uColor3, smoothstep(0.52, 0.96, signal));
    lightCol = mix(lightCol, lightCol * 0.72, ridge * 0.24);

    float coverage = body * mix(0.2, 0.86, signal) * uOpacity;
    if (uGrain > 0.5) {
      float gr = hash(gl_FragCoord.xy + iTime);
      coverage += (gr - 0.5) * uGrainIntensity * body * 0.16;
    }
    fragColor = vec4(mix(uBackgroundColor, lightCol, clamp(coverage, 0.0, 0.92)), 1.0);
  } else {
    fragColor = vec4(col * a, a);
  }
}
`;

function applySettings(uniforms: Record<string, { value: unknown }>, s: Settings) {
  const set3 = (name: string, hex: string) => {
    const target = uniforms[name].value as Float32Array;
    const [r, g, b] = hexToRgb(hex);
    target[0] = r;
    target[1] = g;
    target[2] = b;
  };

  uniforms.uSpeed.value = s.speed;
  uniforms.uScale.value = s.scale;
  uniforms.uDetail.value = s.detail;
  uniforms.uGlow.value = s.glow;
  uniforms.uCoreSize.value = Math.max(s.coreSize, 0.001);
  uniforms.uSwirl.value = s.swirl;
  uniforms.uFold.value = s.fold;
  uniforms.uBlackPoint.value = s.blackPoint;
  uniforms.uBrightness.value = s.brightness;
  uniforms.uColorMode.value = colorModeToFloat(s.colorMode);
  uniforms.uGrain.value = s.grain ? 1 : 0;
  uniforms.uGrainIntensity.value = s.grainIntensity;
  uniforms.uOpacity.value = s.opacity;
  uniforms.uMouseStrength.value = s.mouseStrength;
  uniforms.uEnableMouse.value = s.mouseInteraction;
  uniforms.uLightMode.value = s.lightMode;
  set3("uColor1", s.color1);
  set3("uColor2", s.color2);
  set3("uColor3", s.color3);
  set3("uBackgroundColor", s.backgroundColor);
}

export function MoltenMetal({ className, maxDpr = 2, ...props }: MoltenMetalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settings: Settings = { ...DEFAULTS, ...props };
  const settingsRef = useRef(settings);
  // Reads the latest props each frame without recreating the WebGL context.
  useEffect(() => {
    settingsRef.current = settings;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    // The shader is GLSL 3.00 ES; on a WebGL1-only device, keep the fallback.
    if (!renderer.isWebgl2) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 700ms ease";
    container.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0 },
        uScale: { value: 0 },
        uDetail: { value: 0 },
        uGlow: { value: 0 },
        uCoreSize: { value: 0.001 },
        uSwirl: { value: 0 },
        uFold: { value: 0 },
        uBlackPoint: { value: 0 },
        uBrightness: { value: 0 },
        uColorMode: { value: 0 },
        uGrain: { value: 0 },
        uGrainIntensity: { value: 0 },
        uOpacity: { value: 1 },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: 0 },
        uEnableMouse: { value: false },
        uColor1: { value: new Float32Array([1, 1, 1]) },
        uColor2: { value: new Float32Array([1, 1, 1]) },
        uColor3: { value: new Float32Array([1, 1, 1]) },
        uBackgroundColor: { value: new Float32Array([1, 1, 1]) },
        uLightMode: { value: false },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetMouse: [number, number] = [0.5, 0.5];
    const currentMouse: [number, number] = [0.5, 0.5];
    const t0 = performance.now();
    let shown = false;

    const renderFrame = (now: number) => {
      applySettings(program.uniforms, settingsRef.current);
      // A still frame for reduced motion, taken from a settled point in the animation.
      program.uniforms.iTime.value = reducedMotion ? 12 : (now - t0) * 0.001;
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      const mouse = program.uniforms.uMouse.value as Float32Array;
      mouse[0] = currentMouse[0];
      mouse[1] = currentMouse[1];
      renderer.render({ scene: mesh });

      if (!shown) {
        shown = true;
        requestAnimationFrame(() => {
          canvas.style.opacity = "1";
        });
      }
    };

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      renderFrame(performance.now());
    };

    const resize = new ResizeObserver(setSize);
    resize.observe(container);
    setSize();

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse[0] = (event.clientX - rect.left) / rect.width;
      targetMouse[1] = 1 - (event.clientY - rect.top) / rect.height;
    };
    const onPointerLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };

    let frame = 0;
    const loop = (now: number) => {
      renderFrame(now);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!reducedMotion && frame === 0 && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove);
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resize.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [maxDpr]);

  return <div ref={containerRef} className={cn("relative h-full w-full overflow-hidden", className)} />;
}
