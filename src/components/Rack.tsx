import { useFrame } from "@react-three/fiber/native";
import React, { useRef } from "react";
import { useWarehouseStore } from "../store/useWarehouseStore";

type RackProps = {
  id: string;
  position: [number, number, number];
};

export default function Rack({ id, position }: RackProps) {
  const meshRef = useRef<any>(null);

  const { selectedRack, selectRack } = useWarehouseStore();

  const racks = useWarehouseStore((state) => state.racks) || [];

  const rackData = racks.find((r) => r.id === id);

  const stock = rackData?.stock || 0;
  const bagsPerLevel = rackData?.bagsPerLevel || 5;

  const isSelected = selectedRack === id;

  /* =========================
     📦 Dynamic Height
     ========================= */

  const levels = Math.ceil(stock / bagsPerLevel);
  const height = 1 + levels * 0.8;

  /* =========================
     ✨ Smooth Selection Animation
     ========================= */

  useFrame(() => {
    if (!meshRef.current) return;

    const targetScale = isSelected ? 1.1 : 1;

    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1;

    meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.1;

    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1;
  });

  return (
    <group>
      {/* Main Rack */}
      <mesh
        ref={meshRef}
        position={[position[0], height / 2, position[2]]}
        castShadow
        onPointerDown={() => selectRack(id)}
      >
        <boxGeometry args={[1.5, height, 1]} />
        <meshStandardMaterial
          color={isSelected ? "#ff8800" : "#2ecc71"}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Selection Ring */}
      {isSelected && (
        <mesh
          position={[position[0], 0.02, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.2, 1.6, 32]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>
      )}
    </group>
  );
}
