import { OrbitControls } from "@react-three/drei/native";
import { Canvas, useThree } from "@react-three/fiber/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as THREE from "three";
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

      // 🔥 FLIPPED SIGN (fix zoom direction)
      camera.position.addScaledVector(direction, -zoom * 2);
    }
  }, [zoom, camera]);

  return null;
}

/* =========================
   🏗 Warehouse Scene
   ========================= */
export default function WarehouseScene() {
  const [zoomValue, setZoomValue] = React.useState(0);

  const rows = 4;
  const columns = 6;
  const spacing = 3;

  const racks = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const id = `R-${i}-${j}`;

      racks.push(
        <Rack
          key={id}
          id={id}
          position={[i * spacing - 6, 1.5, j * spacing - 8]}
        />,
      );
    }
  }

  const handleZoom = (value: number) => {
    setZoomValue(value);
    setTimeout(() => setZoomValue(0), 50);
  };

  return (
    <View style={styles.container}>
      <Canvas shadows camera={{ position: [12, 18, 22], fov: 50 }}>
        <ambientLight intensity={0.3} />

        <directionalLight
          position={[10, 30, 10]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <pointLight position={[0, 20, 0]} intensity={0.6} />

        <directionalLight
          position={[20, 30, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#d9d9d9" />
        </mesh>

        {/* 🏭 Back Wall */}
        <mesh position={[0, 7.5, -22]} receiveShadow>
          <boxGeometry args={[60, 15, 1]} />
          <meshStandardMaterial color="#c9c9c9" />
        </mesh>

        {/* 🏭 Left Wall */}
        <mesh position={[-22, 7.5, 0]} receiveShadow>
          <boxGeometry args={[1, 15, 60]} />
          <meshStandardMaterial color="#d4d4d4" />
        </mesh>

        {/* 🏭 Right Wall */}
        <mesh position={[22, 7.5, 0]} receiveShadow>
          <boxGeometry args={[1, 15, 60]} />
          <meshStandardMaterial color="#d4d4d4" />
        </mesh>

        {/* 🏭 Front Border (optional low wall) */}
        <mesh position={[0, 2, 22]} receiveShadow>
          <boxGeometry args={[60, 4, 1]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>

        {racks}

        <OrbitControls
          makeDefault
          enablePan
          enableZoom={false} // ❌ Disabled finger zoom
          enableRotate
          minDistance={12}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.2}
          enableDamping
          dampingFactor={0.08}
        />

        <ZoomController zoom={zoomValue} />
      </Canvas>
      <WarehouseStatsPanel />

      <RackInfoPanel />

      {/* 🔥 Zoom Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleZoom(-1)} // ➕ Zoom In
        >
          <Text style={styles.text}>➕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleZoom(1)} // ➖ Zoom Out
        >
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
  container: {
    flex: 1,
  },
  controls: {
    position: "absolute",
    right: 20,
    top: "45%", // 👈 move to vertical middle
    gap: 15,
  },

  button: {
    backgroundColor: "#ffffffcc",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
