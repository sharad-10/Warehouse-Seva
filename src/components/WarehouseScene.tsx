import { OrbitControls } from "@react-three/drei/native";
import { Canvas, useThree } from "@react-three/fiber/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as THREE from "three";

import { useWarehouseStore } from "../store/useWarehouseStore";
import Rack from "./Rack";
import RackInfoPanel from "./RackInfoPanel";
import WarehouseStatsPanel from "./WarehouseStatsPanel";

/* =========================
   🔥 Zoom Controller
   ========================= */
function ZoomController({ zoom }: { zoom: number }) {
  const { camera } = useThree();

  React.useEffect(() => {
    if (zoom !== 0) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -zoom * 2);
    }
  }, [zoom, camera]);

  return null;
}

/* =========================
   🟢 Advanced Floor (Bounded + Locked Camera)
   ========================= */
function Floor() {
  const { camera, raycaster, pointer } = useThree();

  const selectedRack = useWarehouseStore((s) => s.selectedRack);
  const moveRack = useWarehouseStore((s) => s.moveRack);
  const racks = useWarehouseStore((s) => s.racks) || [];
  const editMode = useWarehouseStore((s) => s.editMode);

  const [previewPosition, setPreviewPosition] = React.useState<
    [number, number, number] | null
  >(null);

  const snap = 2;

  // 🔥 Walls are at ±25, keep racks safely inside
  const wallLimit = 24;
  const rackHalfSize = 1;

  const calculatePosition = () => {
    raycaster.setFromCamera(pointer, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);

    if (!point) return null;

    let x = Math.round(point.x / snap) * snap;
    let z = Math.round(point.z / snap) * snap;

    // 🔥 HARD WALL BOUNDARY
    x = Math.max(
      -wallLimit + rackHalfSize,
      Math.min(wallLimit - rackHalfSize, x),
    );

    z = Math.max(
      -wallLimit + rackHalfSize,
      Math.min(wallLimit - rackHalfSize, z),
    );

    return [x, 1, z] as [number, number, number];
  };

  const isColliding = (pos: [number, number, number]) => {
    return racks.some(
      (rack) =>
        rack.id !== selectedRack &&
        Math.abs(rack.position[0] - pos[0]) < rack.width / 2 + 1 &&
        Math.abs(rack.position[2] - pos[2]) < rack.depth / 2 + 1,
    );
  };

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerMove={() => {
          if (!editMode || !selectedRack) return;
          const pos = calculatePosition();
          if (pos) setPreviewPosition(pos);
        }}
        onPointerDown={() => {
          if (!editMode || !selectedRack || !previewPosition) return;

          if (!isColliding(previewPosition)) {
            moveRack(selectedRack, previewPosition);
          }
        }}
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={editMode ? "#d0e6ff" : "#d9d9d9"} />
      </mesh>

      {/* Ghost Preview */}
      {editMode && previewPosition && (
        <mesh position={[previewPosition[0], 0.5, previewPosition[2]]}>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshBasicMaterial
            color={isColliding(previewPosition) ? "red" : "green"}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </>
  );
}

/* =========================
   🏗 Warehouse Scene
   ========================= */
export default function WarehouseScene() {
  const [zoomValue, setZoomValue] = React.useState(60);

  const racks = useWarehouseStore((s) => s.racks) || [];
  const addRack = useWarehouseStore((s) => s.addRack);
  const toggleEditMode = useWarehouseStore((s) => s.toggleEditMode);
  const editMode = useWarehouseStore((s) => s.editMode);

  const handleZoom = (value: number) => {
    setZoomValue(value);
    setTimeout(() => setZoomValue(0), 50);
  };

  return (
    <View style={styles.container}>
      <Canvas shadows camera={{ position: [15, 20, 25], fov: 50 }}>
        <ambientLight intensity={0.3} />

        <directionalLight
          position={[10, 30, 10]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Floor />

        {/* Walls */}
        <mesh position={[0, 7.5, -25]} receiveShadow>
          <boxGeometry args={[60, 15, 1]} />
          <meshStandardMaterial color="#c9c9c9" />
        </mesh>

        <mesh position={[-25, 7.5, 0]} receiveShadow>
          <boxGeometry args={[1, 15, 60]} />
          <meshStandardMaterial color="#d4d4d4" />
        </mesh>

        <mesh position={[25, 7.5, 0]} receiveShadow>
          <boxGeometry args={[1, 15, 60]} />
          <meshStandardMaterial color="#d4d4d4" />
        </mesh>

        {racks.map((rack) => (
          <Rack key={rack.id} id={rack.id} position={rack.position} />
        ))}

        {/* 🔥 Camera LOCK during Edit Mode */}
        <OrbitControls
          makeDefault
          enablePan={!editMode}
          enableRotate={!editMode}
          enableZoom={false}
          minDistance={10}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.2}
          enableDamping
          dampingFactor={0.08}
        />

        <ZoomController zoom={zoomValue} />
      </Canvas>

      {/* Add Rack */}
      <TouchableOpacity style={styles.addRackBtn} onPress={addRack}>
        <Text style={styles.btnText}>+ Rack</Text>
      </TouchableOpacity>

      {/* Edit Mode Toggle */}
      <TouchableOpacity
        style={[
          styles.editBtn,
          { backgroundColor: editMode ? "#2ecc71" : "#ffffffee" },
        ]}
        onPress={toggleEditMode}
      >
        <Text style={{ fontWeight: "bold" }}>
          {editMode ? "EDIT MODE ON" : "EDIT MODE OFF"}
        </Text>
      </TouchableOpacity>

      <WarehouseStatsPanel />
      <RackInfoPanel />

      {/* Zoom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={() => handleZoom(-1)}>
          <Text style={styles.text}>➕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => handleZoom(1)}>
          <Text style={styles.text}>➖</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================
   🎨 Styles
   ========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  controls: {
    position: "absolute",
    right: 20,
    top: "45%",
    gap: 15,
  },

  button: {
    backgroundColor: "#ffffffcc",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  text: { fontSize: 20, fontWeight: "bold" },

  addRackBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#ffffffee",
    padding: 12,
    borderRadius: 10,
    elevation: 8,
  },

  editBtn: {
    position: "absolute",
    top: 120,
    right: 20,
    padding: 12,
    borderRadius: 10,
    elevation: 8,
  },

  btnText: { fontWeight: "bold" },
});
