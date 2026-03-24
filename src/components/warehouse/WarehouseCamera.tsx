import { useFrame, useThree } from "@react-three/fiber/native";
import React from "react";
import * as THREE from "three";

type Props = {
  zoom: number;
  panX: number;
  panY: number;
  rotateX: number;
  rotateY: number;
  sceneWidth: number;
  sceneLength: number;
  sceneCenterX: number;
  sceneCenterZ: number;
};

export default function WarehouseCamera({
  zoom,
  panX,
  panY,
  rotateX,
  sceneWidth,
  sceneLength,
  sceneCenterX,
  sceneCenterZ,
}: Props) {
  const { camera } = useThree();
  const targetPosition = React.useRef(new THREE.Vector3());
  const targetLookAt = React.useRef(new THREE.Vector3());

  React.useEffect(() => {
    const maxDimension = Math.max(sceneWidth, sceneLength, 120);
    const fitPadding = Math.max(24, maxDimension * 0.12);
    const fittedDimension = maxDimension + fitPadding;
    const minDistance = fittedDimension * 0.8;
    const maxDistance = fittedDimension * 3.2;
    const baseDistance = fittedDimension * 1.22;
    const distance = Math.max(minDistance, Math.min(maxDistance, baseDistance - zoom));
    const azimuth = rotateX;
    const orbitRadius = Math.max(4, distance * 0.06);
    const focusPoint = new THREE.Vector3(sceneCenterX + panX, 0, sceneCenterZ + panY);

    targetPosition.current.set(
      focusPoint.x + Math.sin(azimuth) * orbitRadius,
      distance,
      focusPoint.z + Math.cos(azimuth) * orbitRadius,
    );
    targetLookAt.current.copy(focusPoint);
  }, [
    panX,
    panY,
    rotateX,
    sceneCenterX,
    sceneCenterZ,
    sceneLength,
    sceneWidth,
    zoom,
  ]);

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 8);
    camera.position.lerp(targetPosition.current, smoothing);

    const lookTarget = new THREE.Vector3().copy(targetLookAt.current);
    const matrix = new THREE.Matrix4().lookAt(camera.position, lookTarget, new THREE.Vector3(0, 1, 0));
    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

    camera.quaternion.slerp(targetQuaternion, smoothing);
    camera.updateProjectionMatrix();
  });

  return null;
}
