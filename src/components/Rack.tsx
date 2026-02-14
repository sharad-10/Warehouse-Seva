import { useFrame } from "@react-three/fiber/native";
import React, { useRef } from "react";
import { useWarehouseStore } from "../store/useWarehouseStore";

type RackProps = {
  id: string;
  position: [number, number, number];
};

export default function Rack({ id, position }: RackProps) {
  const { selectedRack, selectRack, racks } = useWarehouseStore();
  const meshRef = useRef<any>(null);
  const isSelected = selectedRack === id;

  const rack = racks[id];
  const stock = rack?.stock || 0;
  const capacity = rack?.capacity || 20;

  const usagePercent = stock / capacity;

  let color = "#4a90e2";

  if (usagePercent === 0)
    color = "#e74c3c"; // empty
  else if (usagePercent < 0.5)
    color = "#f1c40f"; // low
  else if (usagePercent < 0.9)
    color = "#2ecc71"; // healthy
  else color = "#8e44ad"; // almost full

  if (isSelected) color = "#ff8800";

  // ✨ Smooth scaling animation
  useFrame(() => {
    if (!meshRef.current) return;

    const targetScale = isSelected ? 1.2 : 1;

    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1;

    meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.1;

    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1;
  });

  return (
    <group>
      {/* Main Rack */}
      <mesh
        ref={meshRef}
        position={position}
        castShadow
        onClick={() => selectRack(id)}
      >
        <boxGeometry args={[1.5, 3, 1]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* 🔥 Glow Ring Under Selected Rack */}
      {isSelected && (
        <mesh
          position={[position[0], 0.01, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.2, 1.6, 32]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>
      )}
    </group>
  );
}
