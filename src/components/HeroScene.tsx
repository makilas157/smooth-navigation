import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function HeroObject({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    t.current += delta;
    const time = t.current;

    if (group.current) {
      // Floating: subtle vertical drift, matches the CSS float feel.
      group.current.position.y = Math.sin(time * 0.55) * 0.28;
      group.current.rotation.z = Math.sin(time * 0.3) * 0.08;
    }
    if (core.current) {
      core.current.rotation.y += delta * 0.35;
      core.current.rotation.x += delta * 0.12;
    }
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.18;
      shell.current.rotation.x += delta * 0.07;
    }
    // Glow pulse: fades in and out with the floating cycle.
    const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 1.05));
    if (coreMat.current) coreMat.current.emissiveIntensity = 0.5 + pulse * 1.5;
    if (glow.current) glow.current.intensity = 8 + pulse * 14;
  });

  const segments = mobile ? [128, 12] : [220, 24];

  return (
    <group ref={group} scale={mobile ? 0.8 : 1}>
      <pointLight ref={glow} position={[0, 0, 1.6]} color="#ff7a1a" distance={14} intensity={12} />
      <mesh ref={core}>
        <torusKnotGeometry args={[1.15, 0.34, segments[0], segments[1], 2, 3]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#2a1408"
          emissive="#ff6a10"
          emissiveIntensity={1.2}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>
      <mesh ref={shell} scale={1.75}>
        <icosahedronGeometry args={[1.15, mobile ? 1 : 2]} />
        <meshBasicMaterial
          color="#ff8a3d"
          wireframe
          transparent
          opacity={mobile ? 0.12 : 0.16}
        />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.01 },
    );
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const dpr = useMemo<[number, number]>(() => (mobile ? [1, 1.5] : [1, 2]), [mobile]);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-[-8%] hidden h-[34rem] w-[34rem] -translate-y-1/2 opacity-90 md:block lg:right-[2%]"
    >
      <span className="heading-glow inset-8" />
      {ready && (
        <Canvas
          className="relative"
          dpr={dpr}
          frameloop={reduced ? "demand" : visible ? "always" : "never"}
          gl={{ antialias: !mobile, powerPreference: "high-performance", alpha: true }}
          camera={{ position: [0, 0, 6], fov: 45 }}
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[4, 6, 5]} intensity={1.1} color="#ffd0a8" />
          <Suspense fallback={null}>
            <HeroObject mobile={mobile} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
