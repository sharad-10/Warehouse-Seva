import React from "react";

type StickProps = {
  index: number;
  length: number;
  width: number;
  positionZ: number;
  positionX?: number;
};

export default function Stick({
  length,
  width,
  positionZ,
  positionX = 0,
}: StickProps) {

  return (
    <mesh
      position={[positionX, 0.02, positionZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, 0.1]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  );
}