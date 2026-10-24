"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * WebGL fire bed: a domain-warped heat glow rising from the bottom of the
 * frame plus a few thousand GPU-animated embers that drift, swirl and burn
 * out. All motion lives in the shaders; the CPU only advances time.
 */

const glowVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const glowFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uIntensity;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.18;

  // Domain-warped flame field, flowing upward
  vec2 q = vec2(fbm(p * 2.2 + vec2(0.0, -t * 2.0)), fbm(p * 2.2 + vec2(5.2, -t * 1.6)));
  float f = fbm(p * 2.6 + q * 1.6 + vec2(0.0, -t * 3.0));

  // Heat rises from the floor ("fogo de chão": fire of the ground)
  float floorHeat = smoothstep(0.75, -0.05, uv.y);
  float flame = pow(f, 2.2) * floorHeat * 2.4;

  // Pointer adds a soft warm bloom
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float md = length(p - m);
  flame += 0.22 * exp(-md * md * 9.0) * (0.6 + f);

  vec3 ink = vec3(0.043, 0.031, 0.024);
  vec3 deep = vec3(0.30, 0.06, 0.02);
  vec3 ember = vec3(0.90, 0.34, 0.12);
  vec3 gold = vec3(1.0, 0.72, 0.38);

  vec3 col = ink;
  col = mix(col, deep, smoothstep(0.02, 0.35, flame));
  col = mix(col, ember, smoothstep(0.30, 0.85, flame));
  col = mix(col, gold, smoothstep(0.85, 1.4, flame));

  // Vignette
  vec2 c = uv - 0.5;
  col *= 1.0 - dot(c, c) * 1.25;
  col *= uIntensity;
  gl_FragColor = vec4(col, 1.0);
}
`;

const emberVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uPixelRatio;
uniform float uAspect;
varying float vLife;
varying float vHeat;
void main(){
  float speed = 0.05 + aSeed.y * 0.09;
  float life = fract(aSeed.x + uTime * speed);
  vLife = life;
  vHeat = aSeed.w;
  float x = (aSeed.z * 2.0 - 1.0) * uAspect;
  x += sin(uTime * (0.6 + aSeed.w) + aSeed.x * 40.0) * 0.08 * life;
  x += sin(life * 6.2831 + aSeed.y * 20.0) * 0.05;
  float y = -1.15 + life * 2.6;
  vec4 pos = vec4(x / uAspect, y, 0.0, 1.0);
  gl_Position = pos;
  gl_PointSize = (1.4 + aSeed.w * 3.6) * uPixelRatio * (1.0 - life * 0.6);
}
`;

const emberFrag = /* glsl */ `
precision highp float;
varying float vLife;
varying float vHeat;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float fade = smoothstep(0.0, 0.08, vLife) * smoothstep(1.0, 0.45, vLife);
  vec3 hot = mix(vec3(1.0, 0.45, 0.15), vec3(1.0, 0.85, 0.55), vHeat);
  gl_FragColor = vec4(hot * core * 1.6, core * fade);
}
`;

export function EmberField({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL: the CSS gradient behind stays visible.
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const glowUniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.15) },
      uIntensity: { value: intensity },
    };
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: glowVert, fragmentShader: glowFrag, uniforms: glowUniforms, depthWrite: false }),
    );
    scene.add(glow);

    const COUNT = window.innerWidth < 768 ? 700 : 1800;
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    const emberUniforms = { uTime: { value: 0 }, uPixelRatio: { value: dpr }, uAspect: { value: 1 } };
    const embers = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: emberVert,
        fragmentShader: emberFrag,
        uniforms: emberUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    embers.frustumCulled = false;
    scene.add(embers);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      glowUniforms.uRes.value.set(w, h);
      emberUniforms.uAspect.value = w / h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const mouseTarget = new THREE.Vector2(0.5, 0.15);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouseTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const t = reduce ? 4 : clock.getElapsedTime();
      glowUniforms.uTime.value = t;
      emberUniforms.uTime.value = t;
      glowUniforms.uMouse.value.lerp(mouseTarget, 0.04);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      geo.dispose();
      glow.geometry.dispose();
      (glow.material as THREE.Material).dispose();
      (embers.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [intensity]);

  return (
    <div
      ref={host}
      aria-hidden
      className={className}
      style={{ background: "radial-gradient(120% 70% at 50% 110%, #5a1a0a 0%, #1a0e08 45%, #0b0806 75%)" }}
    />
  );
}
