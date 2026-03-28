import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

function GlobeMesh({ state, audioLevel }) {
  const meshRef = useRef();
  const wireRef = useRef();
  const innerRef = useRef();
  const particlesRef = useRef();

  // Determine animation intensity based on state
  const stateConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return { speed: 1.5, distort: 0.4, color1: '#6c63ff', color2: '#ff6b9d', emissive: '#2a1f7a', particleSpeed: 2 };
      case 'thinking':
        return { speed: 2.5, distort: 0.6, color1: '#00d4ff', color2: '#6c63ff', emissive: '#0a2a40', particleSpeed: 3 };
      case 'speaking':
        return { speed: 1.2, distort: 0.3 + audioLevel * 0.5, color1: '#ff6b9d', color2: '#6c63ff', emissive: '#3a1040', particleSpeed: 1.5 };
      default:
        return { speed: 0.5, distort: 0.2, color1: '#6c63ff', color2: '#00d4ff', emissive: '#0f0f2a', particleSpeed: 0.5 };
    }
  }, [state, audioLevel]);

  // Generate particles around the globe
  const particleCount = 2000;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  const particleSizes = useMemo(() => {
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    return sizes;
  }, []);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * stateConfig.speed * 0.3;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }

    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * stateConfig.speed * 0.15;
      wireRef.current.rotation.z = Math.cos(t * 0.2) * 0.05;
    }

    if (innerRef.current) {
      innerRef.current.rotation.y += delta * stateConfig.speed * 0.5;
      const scale = 1 + Math.sin(t * 2) * 0.05 * (state === 'speaking' ? (1 + audioLevel) : 1);
      innerRef.current.scale.setScalar(scale);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * stateConfig.particleSpeed * 0.1;
      particlesRef.current.rotation.x += delta * 0.02;
    }
  });

  const color1 = new THREE.Color(stateConfig.color1);
  const color2 = new THREE.Color(stateConfig.color2);
  const emissive = new THREE.Color(stateConfig.emissive);

  return (
    <group>
      {/* Inner energy core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={color2}
          emissive={color1}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Main distorted Globe */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <Sphere args={[1.5, 128, 128]}>
            <MeshDistortMaterial
              color={color1}
              emissive={emissive}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
              distort={stateConfig.distort}
              speed={stateConfig.speed * 2}
              transparent
              opacity={0.85}
            />
          </Sphere>
        </mesh>
      </Float>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshStandardMaterial
          color={color2}
          wireframe
          transparent
          opacity={0.08}
          emissive={color2}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.0, 64]} />
        <meshBasicMaterial
          color={color1}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary ring */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <ringGeometry args={[2.0, 2.05, 64]} />
        <meshBasicMaterial
          color={color2}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Particle field */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particlePositions}
            count={particleCount}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleSizes}
            count={particleCount}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={color1}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function Scene({ state, audioLevel }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6c63ff" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[0, 5, -10]} intensity={0.3} color="#ff6b9d" />

      <Stars
        radius={50}
        depth={80}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <GlobeMesh state={state} audioLevel={audioLevel} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          mipmapBlur
        />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  );
}

export default function Globe3D({ state = 'idle', audioLevel = 0 }) {
  return (
    <div className="globe-container">
      <Canvas
        className="globe-canvas"
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene state={state} audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
}
