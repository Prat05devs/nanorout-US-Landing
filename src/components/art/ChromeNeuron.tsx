"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "@/lib/random";
import { hasFinePointer, prefersReducedMotion } from "@/lib/useReducedMotion";

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** A tube that narrows from r0 to r1 along the curve (TubeGeometry only does constant radius). */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number, r0: number, r1: number) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const r = r1 + (r0 - r1) * Math.pow(1 - t, 1.4);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      n.set(0, 0, 0).addScaledVector(N, Math.cos(v)).addScaledVector(B, Math.sin(v)).normalize();
      pos.push(P.x + n.x * r, P.y + n.y * r, P.z + n.z * r);
      nor.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function sphereAt(p: THREE.Vector3, r: number) {
  const g = new THREE.SphereGeometry(r, 12, 10);
  g.deleteAttribute("uv");
  g.translate(p.x, p.y, p.z);
  return g;
}

/** Random unit vector inside a cone around `dir`. */
function jitterDir(dir: THREE.Vector3, spread: number, rand: () => number) {
  const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).multiplyScalar(spread);
  return dir.clone().add(v).normalize();
}

type Branch = { curve: THREE.CatmullRomCurve3; parent: Branch | null };

/** The neuron in 3D: branching dendrites (seeded, like the 2D recipe) plus one axon. */
function buildNeuron(mobile: boolean) {
  const rand = mulberry32(42);
  const somaR = 0.62;
  const branches: Branch[] = [];
  const parts: THREE.BufferGeometry[] = [];
  const depth = mobile ? 2 : 3;

  const grow = (start: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, level: number, parent: Branch | null) => {
    const pts = [start.clone()];
    let d = dir.clone();
    let p = start.clone();
    for (let k = 0; k < 4; k++) {
      d = jitterDir(d, 0.28, rand);
      p = p.clone().addScaledVector(d, len / 4);
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const r1 = r0 * 0.55;
    parts.push(taperedTube(curve, 28, 10, r0, r1));
    const branch = { curve, parent };
    branches.push(branch);
    const end = pts[pts.length - 1];
    if (level >= depth) {
      parts.push(sphereAt(end, r1 * 1.6));
      return;
    }
    const kids = rand() < 0.3 ? 3 : 2;
    for (let c = 0; c < kids; c++) {
      grow(end, jitterDir(d, 0.9, rand), len * (0.72 + (rand() * 2 - 1) * 0.08), r1, level + 1, branch);
    }
  };

  // Main dendrites leave the soma in a broad fan (the axon takes the lower right).
  const mains = mobile ? 5 : 7;
  for (let i = 0; i < mains; i++) {
    const a = (i / mains) * Math.PI * 1.55 + Math.PI * 0.35;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), (rand() * 2 - 1) * 0.7).normalize();
    grow(dir.clone().multiplyScalar(somaR * 0.85), dir, 0.95, 0.15, 1, null);
  }

  // Axon: one long, smooth line from the soma to the chip.
  const chipPos = new THREE.Vector3(2.25, -1.85, 0.35);
  const axon = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, -0.4, 0),
    new THREE.Vector3(0.95, -0.85, 0.25),
    new THREE.Vector3(1.25, -1.25, -0.1),
    new THREE.Vector3(1.75, -1.55, 0.15),
    chipPos.clone().add(new THREE.Vector3(-0.32, 0.12, 0)),
  ]);
  parts.push(taperedTube(axon, 80, 12, 0.13, 0.07));

  // Soma: a softly lumpy sphere.
  let soma: THREE.BufferGeometry = new THREE.IcosahedronGeometry(somaR, 22);
  soma.deleteAttribute("uv");
  soma.deleteAttribute("normal");
  soma = mergeVertices(soma);
  const sp = soma.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < sp.count; i++) {
    v.fromBufferAttribute(sp, i);
    const k = 1 + 0.07 * Math.sin(3 * v.x + 1) * Math.sin(2.7 * v.y) * Math.sin(3.3 * v.z + 2) + 0.04 * Math.sin(7 * v.y + v.x);
    v.multiplyScalar(k);
    sp.setXYZ(i, v.x, v.y, v.z);
  }
  soma.computeVertexNormals();

  // Myelin rings along the axon.
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const p = axon.getPointAt(t);
    const tangent = axon.getTangentAt(t);
    const ring = new THREE.TorusGeometry(0.15 - t * 0.04, 0.035, 10, 28);
    ring.deleteAttribute("uv");
    ring.lookAt(tangent);
    ring.translate(p.x, p.y, p.z);
    parts.push(ring);
  }

  const chrome = mergeGeometries(parts.map((g) => (g.index ? g : mergeVertices(g))), false);
  return { chrome, soma, branches, axon, chipPos };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ChromeNeuron({ className, onReady }: { className?: string; onReady?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const mobile = window.innerWidth < 640;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // Studio environment with palette panels, so the chrome reflects acid, orange and white.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const panel = (hex: number, boost: number, w: number, h: number, x: number, y: number, z: number) => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(boost), side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      room.add(m);
    };
    panel(0xff6a00, 6, 9, 6, -9, 1, 2); // hot orange wall
    panel(0xffffff, 4, 12, 4, 0, 10, 0); // flash white skylight
    panel(0x111111, 1, 20, 20, 0, -9, 0); // poster black floor
    panel(0xd7ff00, 3.2, 3, 8, 9, -2, -4); // acid rim
    const envTex = pmrem.fromScene(room, 0.035).texture;
    scene.environment = envTex;

    const group = new THREE.Group();
    scene.add(group);

    const { chrome, soma, branches, axon, chipPos } = buildNeuron(mobile);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.14, envMapIntensity: 1.25 });
    group.add(new THREE.Mesh(chrome, chromeMat));
    const somaMesh = new THREE.Mesh(soma, chromeMat);
    group.add(somaMesh);

    // Glass chip at the end of the axon.
    const chipGroup = new THREE.Group();
    chipGroup.position.copy(chipPos);
    chipGroup.rotation.set(0.55, -0.5, 0.18);
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.06,
      transmission: 1,
      thickness: 0.6,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color(0xd7ff00),
      attenuationDistance: 2.5,
      envMapIntensity: 1.4,
    });
    chipGroup.add(new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.2, 1.2, 4, 0.06), glass));
    const die = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), chromeMat);
    chipGroup.add(die);
    const pinGeo = new THREE.BoxGeometry(0.06, 0.04, 0.22);
    for (let i = 0; i < 6; i++) {
      const o = -0.45 + i * 0.18;
      for (const side of [-1, 1]) {
        const a = new THREE.Mesh(pinGeo, chromeMat);
        a.position.set(o, -0.02, side * 0.7);
        chipGroup.add(a);
        const b = new THREE.Mesh(pinGeo, chromeMat);
        b.rotation.y = Math.PI / 2;
        b.position.set(side * 0.7, -0.02, o);
        chipGroup.add(b);
      }
    }
    group.add(chipGroup);

    // Signal pulses: vermilion sparks that run tip → soma → axon → chip.
    const glowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.25, "rgba(215,255,0,0.9)");
      grad.addColorStop(1, "rgba(215,255,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const leaves = branches.filter((b) => !branches.some((o) => o.parent === b));
    const pulseRand = mulberry32(9);
    const routeFor = () => {
      let b: Branch | null = leaves[Math.floor(pulseRand() * leaves.length)];
      const pts: THREE.Vector3[] = [];
      while (b) {
        const sample = b.curve.getSpacedPoints(6).reverse();
        pts.push(...(pts.length ? sample.slice(1) : sample));
        b = b.parent;
      }
      pts.push(new THREE.Vector3(0, 0, 0));
      pts.push(...axon.getSpacedPoints(12));
      pts.push(chipPos.clone());
      return new THREE.CatmullRomCurve3(pts);
    };
    const pulses = Array.from({ length: mobile ? 3 : 6 }, (_, i) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sprite.scale.setScalar(0.42);
      group.add(sprite);
      return { sprite, curve: routeFor(), t: i / 6, speed: 0.22 + pulseRand() * 0.12 };
    });

    /* ---------- layout ---------- */
    const layout = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Centre the neuron on the red sun and size it to the disc.
      const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfW = halfH * camera.aspect;
      const sun = el.parentElement?.querySelector<HTMLElement>("[data-sun]");
      if (sun) {
        // offset* ignores the sun's entrance/parallax transforms; both share the hero as offset parent
        const cx = sun.offsetLeft + sun.offsetWidth / 2 - el.offsetLeft;
        const cy = sun.offsetTop + sun.offsetHeight / 2 - el.offsetTop;
        group.position.set((cx / w) * 2 * halfW - halfW, halfH - (cy / h) * 2 * halfH, 0);
        const discR = (sun.offsetWidth / 2 / (h / 2)) * halfH;
        group.scale.setScalar(discR / (w < 640 ? 2.1 : 1.75));
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    /* ---------- interaction ---------- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
      pointer.energy = Math.min(1, pointer.energy + 0.04);
    };
    if (hasFinePointer() && !reduced) window.addEventListener("pointermove", onMove);

    /* ---------- loop ---------- */
    let visible = true;
    let raf = 0;
    const clock = new THREE.Clock();
    let first = true;
    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      pointer.energy *= 0.985;
      const scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
      group.rotation.y = t * 0.12 + pointer.x * 0.7 + scroll * 1.2;
      group.rotation.x = -0.15 + pointer.y * 0.45 + scroll * 0.3;
      group.rotation.z = Math.sin(t * 0.3) * 0.05;
      somaMesh.scale.setScalar(1 + Math.sin(t * 1.6) * 0.018);
      chipGroup.rotation.y = -0.5 + Math.sin(t * 0.7) * 0.12;
      for (const p of pulses) {
        p.t += dt * p.speed * (1 + pointer.energy * 2.5);
        if (p.t >= 1) {
          p.t = 0;
          p.curve = routeFor();
        }
        p.curve.getPointAt(p.t, p.sprite.position);
        p.sprite.material.opacity = Math.sin(p.t * Math.PI) * 0.9 + 0.1;
      }
      renderer.render(scene, camera);
      if (first) {
        first = false;
        readyRef.current?.();
      }
    };
    const loop = () => {
      render();
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible && !reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);
    render();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      glowTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={wrap} className={className} aria-hidden="true" />;
}
