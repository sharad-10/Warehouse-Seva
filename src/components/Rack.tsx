import { useFrame } from "@react-three/fiber/native";
import React, { useRef } from "react";
import { useWarehouseStore } from "../store/useWarehouseStore";

type RackProps = {
  id: string;
  position: [number, number, number];
};

export default function Rack({ id, position }: RackProps) {
  const meshRef = useRef<any>(null);

  const selectedRack = useWarehouseStore((s) => s.selectedRack);
  const racks = useWarehouseStore((s) => s.racks) || [];

  const rackData = racks.find((r) => r.id === id);
  if (!rackData) return null;

  const { stock, bagsPerLevel, width, depth, expiryDate } = rackData;

  const isSelected = selectedRack === id;

  /* =========================
     📦 Dynamic Height
  ========================= */
  const levels = Math.ceil(stock / bagsPerLevel);
  const height = 1 + levels * 0.8;

  /* =========================
     ⚠ Expiry Logic
  ========================= */
  const today = new Date();
  const expiry = expiryDate ? new Date(expiryDate) : null;

  let isExpired = false;
  let isNearExpiry = false;

  if (expiry) {
    const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diff < 0) isExpired = true;
    else if (diff <= 7) isNearExpiry = true;
  }

  /* =========================
     🎨 Color Logic
  ========================= */
  let baseColor = "#2ecc71"; // Safe green

  if (isNearExpiry) baseColor = "#f39c12"; // Orange
  if (isExpired) baseColor = "#e74c3c"; // Red

  if (isSelected) baseColor = "#ff8800";

  /* =========================
     ✨ Animation
  ========================= */
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Selection scale animation
    const targetScale = isSelected ? 1.1 : 1;

    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1;

    meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.1;

    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1;

    // 🔥 Blinking effect for expired racks
    if (isExpired) {
      const blink = (Math.sin(clock.getElapsedTime() * 4) + 1) / 2;

      meshRef.current.material.opacity = 0.5 + blink * 0.5;
      meshRef.current.material.transparent = true;
    } else {
      meshRef.current.material.opacity = 1;
      meshRef.current.material.transparent = false;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[position[0], height / 2, position[2]]}
        castShadow
        onPointerDown={() => useWarehouseStore.getState().selectRack(id)}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}
