import { OrbitControls } from "@react-three/drei/native";
import { Canvas, useThree } from "@react-three/fiber/native";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as THREE from "three";
import { useAuthStore } from "../src/store/useAuthStore";

import Rack from "../src/components/Rack";
import RackInfoPanel from "../src/components/RackInfoPanel";
import WarehouseStatsPanel from "../src/components/WarehouseStatsPanel";
import { useWarehouseStore } from "../src/store/useWarehouseStore";

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
   🟢 Advanced Floor
========================= */
function Floor() {
  const { camera, raycaster, pointer } = useThree();

  const selectedRack = useWarehouseStore((s) => s.selectedRack);
  const moveRack = useWarehouseStore((s) => s.moveRack);
  const warehouses = useWarehouseStore((s) => s.warehouses);
  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const racks = currentWarehouse?.racks || [];
  const editMode = useWarehouseStore((s) => s.editMode);

  const [previewPosition, setPreviewPosition] = React.useState<
    [number, number, number] | null
  >(null);

  const snap = 2;
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

  const isColliding = (pos: [number, number, number]) =>
    racks.some(
      (rack) =>
        rack.id !== selectedRack &&
        Math.abs(rack.position[0] - pos[0]) < rack.width / 2 + 1 &&
        Math.abs(rack.position[2] - pos[2]) < rack.depth / 2 + 1,
    );

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

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#DCE8D4" />
      </mesh>
    </>
  );
}

/* =========================
   🏗 Warehouse Scene
========================= */
export default function WarehouseScene() {
  const [zoomValue, setZoomValue] = React.useState(60);
  const [warehouseModalVisible, setWarehouseModalVisible] =
    React.useState(false);
  const [newWarehouseName, setNewWarehouseName] = React.useState("");
  const router = useRouter();

  const warehouses = useWarehouseStore((s) => s.warehouses);
  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
  const selectWarehouse = useWarehouseStore((s) => s.selectWarehouse);
  const addWarehouse = useWarehouseStore((s) => s.addWarehouse);
  const deleteWarehouse = useWarehouseStore((s) => s.deleteWarehouse);
  const [profileVisible, setProfileVisible] = React.useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [nameInput, setNameInput] = React.useState(user?.name || "");
  const [passwordInput, setPasswordInput] = React.useState("");

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const racks = currentWarehouse?.racks || [];
  const addRack = useWarehouseStore((s) => s.addRack);
  const toggleEditMode = useWarehouseStore((s) => s.toggleEditMode);
  const editMode = useWarehouseStore((s) => s.editMode);

  const renameWarehouse = useWarehouseStore((s) => s.renameWarehouse);
  const [editingWarehouseId, setEditingWarehouseId] = React.useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = React.useState("");

  const [emailInput, setEmailInput] = React.useState(user?.email || "");
  const [phoneInput, setPhoneInput] = React.useState(user?.phone || "");

  const handleZoom = (value: number) => {
    setZoomValue(value);
    setTimeout(() => setZoomValue(0), 50);
  };

  const screenHeight = Dimensions.get("window").height;
  const modelHeight = React.useRef(
    new Animated.Value(screenHeight * 0.55),
  ).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = screenHeight * 0.55 + gestureState.dy;
        if (newHeight > 200 && newHeight < screenHeight - 200) {
          modelHeight.setValue(newHeight);
        }
      },
    }),
  ).current;

  React.useEffect(() => {
    if (profileVisible && user) {
      setNameInput(user.name);
      setEmailInput(user.email);
      setPhoneInput(user.phone);
    }
  }, [profileVisible]);

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setWarehouseModalVisible(true)}>
          <Text style={styles.logoText}>{currentWarehouse?.name} ▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setProfileVisible(true)}
        >
          <Text style={styles.profileText}>👤 {user?.name}</Text>
        </TouchableOpacity>

        <Modal visible={profileVisible} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.profileModal}>
                <Text style={styles.modalTitle}>My Profile</Text>
                <Text style={styles.infoText}>
                  Total Warehouses: {warehouses.length}
                </Text>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter username"
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter email"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Enter phone number"
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Enter new password"
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    if (!nameInput || !emailInput || !phoneInput) {
                      alert("All fields except password are required");
                      return;
                    }

                    if (!/^[0-9]{10}$/.test(phoneInput)) {
                      alert("Enter valid 10-digit phone number");
                      return;
                    }

                    updateProfile({
                      name: nameInput.trim(),
                      email: emailInput.trim(),
                      phone: phoneInput.trim(),
                      ...(passwordInput ? { password: passwordInput } : {}),
                    });

                    setPasswordInput("");
                    setProfileVisible(false);
                  }}
                >
                  <Text style={styles.btnText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => {
                    logout();
                    router.replace("/login"); // 🔥 force redirect
                  }}
                >
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setProfileVisible(false)}
                >
                  <Text>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {/* 3D VIEW */}
      <Animated.View style={{ height: modelHeight }}>
        <Canvas
          shadows
          camera={{ position: [15, 20, 25], fov: 50 }}
          style={{ backgroundColor: "#EAF6FF" }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 30, 10]}
            intensity={1.4}
            castShadow
          />

          <Floor />

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
      </Animated.View>

      {/* Drag Handle */}
      <View {...panResponder.panHandlers} style={styles.dragHandle}>
        <View style={styles.dragIndicator} />
      </View>

      {/* Bottom Panel */}
      <ScrollView
        style={styles.bottomPanel}
        contentContainerStyle={{ padding: 15 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={addRack}>
            <Text style={styles.btnText}>+ Rack</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: editMode ? "#2ecc71" : "#eee" },
            ]}
            onPress={toggleEditMode}
          >
            <Text style={{ fontWeight: "bold" }}>
              {editMode ? "EDIT MODE ON" : "EDIT MODE OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.zoomRow}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => handleZoom(-1)}
          >
            <Text>➕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => handleZoom(1)}
          >
            <Text>➖</Text>
          </TouchableOpacity>
        </View>

        <WarehouseStatsPanel />
        <RackInfoPanel />
      </ScrollView>

      {/* Warehouse Modal */}
      <Modal visible={warehouseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Manage Warehouses</Text>

            {warehouses.map((w) => (
              <View key={w.id} style={styles.warehouseRow}>
                {editingWarehouseId === w.id ? (
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                    value={renameValue}
                    onChangeText={setRenameValue}
                    onSubmitEditing={() => {
                      if (renameValue.trim()) {
                        renameWarehouse(w.id, renameValue.trim());
                      }
                      setEditingWarehouseId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      selectWarehouse(w.id);
                      setWarehouseModalVisible(false);
                    }}
                  >
                    <Text
                      style={{
                        fontWeight:
                          w.id === selectedWarehouseId ? "bold" : "normal",
                      }}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Edit Button */}
                {editingWarehouseId !== w.id && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingWarehouseId(w.id);
                      setRenameValue(w.name);
                    }}
                    style={{ marginRight: 10 }}
                  >
                    <Text style={{ color: "#F4B400" }}>Edit</Text>
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                {warehouses.length > 1 && (
                  <TouchableOpacity onPress={() => deleteWarehouse(w.id)}>
                    <Text style={{ color: "red" }}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TextInput
              placeholder="New Warehouse Name"
              style={styles.input}
              value={newWarehouseName}
              onChangeText={setNewWarehouseName}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                if (newWarehouseName.trim()) {
                  addWarehouse(newWarehouseName.trim());
                  setNewWarehouseName("");
                }
              }}
            >
              <Text style={styles.btnText}>Add Warehouse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setWarehouseModalVisible(false)}
            >
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  dragHandle: {
    height: 20,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#F4B400",
    borderRadius: 10,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF4CC",
    borderWidth: 1,
    borderColor: "#F2E6B3",
  },
  zoomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  zoomBtn: {
    padding: 10,
    backgroundColor: "#F4B400",
    borderRadius: 10,
    width: 60,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "bold",
    color: "#333",
  },
  header: {
    height: 60,
    backgroundColor: "#F4B400",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  logoText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
  },
  profileBtn: {
    backgroundColor: "#FFF4CC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileText: {
    fontWeight: "bold",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#FFFDF7",
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#F4B400",
  },
  warehouseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2E6B3",
  },
  input: {
    borderWidth: 1,
    borderColor: "#F2E6B3",
    borderRadius: 10,
    padding: 10,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#F4B400",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  profileModal: {
    width: "85%",
    backgroundColor: "#FFFDF7",
    padding: 20,
    borderRadius: 20,
  },

  infoText: {
    marginBottom: 15,
    fontWeight: "bold",
  },

  label: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
    color: "#555",
  },

  logoutBtn: {
    backgroundColor: "#E74C3C",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },

  secondaryBtn: {
    marginTop: 10,
    alignItems: "center",
  },
});
