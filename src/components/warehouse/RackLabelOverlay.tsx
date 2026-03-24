import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as THREE from "three";

import { Rack } from "@/src/types/warehouse";
import { SceneMetrics } from "@/src/utils/warehouseLayout";

type Props = {
  racks: Rack[];
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  rotateX: number;
  sceneMetrics: SceneMetrics;
  onSelectRack: (rackId: string) => void;
};

export default function RackLabelOverlay({
  racks,
  width,
  height,
  zoom,
  panX,
  panY,
  rotateX,
  sceneMetrics,
  onSelectRack,
}: Props) {
  const labels = React.useMemo(() => {
    if (width <= 0 || height <= 0) {
      return [];
    }

    const maxDimension = Math.max(sceneMetrics.width, sceneMetrics.length, 120);
    const fitPadding = Math.max(24, maxDimension * 0.12);
    const fittedDimension = maxDimension + fitPadding;
    const minDistance = fittedDimension * 0.8;
    const maxDistance = fittedDimension * 3.2;
    const baseDistance = fittedDimension * 1.22;
    const distance = Math.max(minDistance, Math.min(maxDistance, baseDistance - zoom));
    const orbitRadius = Math.max(4, distance * 0.06);
    const focusPoint = new THREE.Vector3(
      sceneMetrics.centerX + panX,
      0,
      sceneMetrics.centerZ + panY,
    );
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 5000);

    camera.position.set(
      focusPoint.x + Math.sin(rotateX) * orbitRadius,
      distance,
      focusPoint.z + Math.cos(rotateX) * orbitRadius,
    );
    camera.lookAt(focusPoint);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    return racks.map((rack) => {
      const rackHeight =
        8 + Math.max(1, rack.stackCount ?? Math.ceil(rack.stock / Math.max(1, rack.bagsPerLevel))) * 4;
      const point = new THREE.Vector3(rack.position[0], rackHeight + 8, rack.position[2]);
      const projected = point.project(camera);

      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      const visible =
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        projected.z > -1.5 &&
        projected.z < 1.5 &&
        x >= -80 &&
        x <= width + 80 &&
        y >= -40 &&
        y <= height + 40;

      return {
        id: rack.id,
        name: rack.material?.trim()
          ? `${rack.name}(${rack.material.trim()})`
          : rack.name,
        x,
        y,
        visible,
      };
    });
  }, [height, panX, panY, racks, rotateX, sceneMetrics, width, zoom]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {labels.map((label) =>
        label.visible ? (
          <Pressable
            key={label.id}
            onPress={() => onSelectRack(label.id)}
            style={[
              styles.labelWrap,
              {
                left: label.x - 44,
                top: label.y - 14,
              },
            ]}
          >
            <Text numberOfLines={1} style={styles.labelText}>
              {label.name}
            </Text>
          </Pressable>
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    position: "absolute",
    zIndex: 20,
    elevation: 20,
    minWidth: 88,
    maxWidth: 110,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 249, 236, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(94, 67, 0, 0.22)",
    alignItems: "center",
  },
  labelText: {
    color: "#4B3200",
    fontSize: 11,
    fontWeight: "700",
  },
});
