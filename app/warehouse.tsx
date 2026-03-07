import { Canvas, useThree } from "@react-three/fiber/native";
import { useRouter } from "expo-router";
import {
  updateProfile as firebaseUpdateProfile,
  updateEmail,
} from "firebase/auth";
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
//import { useAuthStore } from "../src/store/useAuthStore";

import { useRacks } from "@/src/hooks/useRacks";
import { useUserRole } from "@/src/hooks/useUserRole";
import { useWarehouses } from "@/src/hooks/useWarehouses";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import {
  PanGestureHandler,
  PinchGestureHandler,
} from "react-native-gesture-handler";
import Rack from "../src/components/Rack";
import RackInfoPanel from "../src/components/RackInfoPanel";
import WarehouseStatsPanel from "../src/components/WarehouseStatsPanel";
import { auth, db } from "../src/firebase/config";

type Props = {
  zoom: number;
  panX: number;
  panY: number;
  rotateX: number;
  rotateY: number;
  editMode: boolean;
};

function WarehouseCameraController({
  zoom,
  panX,
  panY,
  rotateX,
  rotateY,
  editMode,
}: Props) {
  const { camera } = useThree();

  React.useEffect(() => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    camera.position.addScaledVector(direction, -zoom * 1.5);
    camera.position.clampLength(10, 200);
  }, [zoom, camera]);

  React.useEffect(() => {
    camera.position.x += panX * 0.002;
    camera.position.z += panY * 0.002;
  }, [panX, panY, camera]);

  React.useEffect(() => {
    if (editMode) return; // 🚫 disable rotation in edit mode

    camera.rotation.y += rotateX * 0.00008;
    camera.rotation.x += rotateY * 0.00008;

    camera.rotation.x = Math.max(
      -Math.PI / 4,
      Math.min(Math.PI / 3, camera.rotation.x)
    );
  }, [rotateX, rotateY, camera, editMode]);

  return null;
}


/* =========================
   🟢 Advanced Floor
========================= */
function Floor({
  racks,
  selectedRackId,
  updateRack,
  editMode,
  dragPreviewPosition,
  setDragPreviewPosition,
  stickCols,
  stickRows,
  stickWidth,
  stickLength
}: {
  racks: any[];
  selectedRackId: string | null;
  updateRack: (id: string, data: any) => void;
  editMode: boolean;
  dragPreviewPosition: [number, number, number] | null;
  setDragPreviewPosition: (pos: [number, number, number] | null) => void;
  stickRows: number;
  stickCols: number;
  stickWidth: number;
  stickLength: number;
}) {
  const { camera, raycaster, pointer } = useThree();

  const [isDragging, setIsDragging] = React.useState(false);

  const snap = 1;
  const wallLimit = 24;

  const calculatePosition = () => {
    raycaster.setFromCamera(pointer, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();

    raycaster.ray.intersectPlane(plane, point);

    let x = Math.round(point.x / snap) * snap;
    let z = Math.round(point.z / snap) * snap;

    x = Math.max(-wallLimit, Math.min(wallLimit, x));
    z = Math.max(-wallLimit, Math.min(wallLimit, z));

    return [x, 1, z] as [number, number, number];
  };

  const isColliding = (pos: [number, number, number]) => {
    return racks.some((rack) => {
      if (rack.id === selectedRackId) return false;

      return (
        Math.abs(rack.position[0] - pos[0]) < rack.width &&
        Math.abs(rack.position[2] - pos[2]) < rack.depth
      );
    });
  };

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          if (!editMode || !selectedRackId) return;
          e.stopPropagation();
          setIsDragging(true);
        }}
        onPointerMove={() => {
          if (!editMode || !isDragging || !selectedRackId) return;

          const pos = calculatePosition();
          if (!pos) return;

          if (!isColliding(pos)) {
            setDragPreviewPosition(pos);
          }
        }}
        onPointerUp={() => {
          if (
            !editMode ||
            !isDragging ||
            !dragPreviewPosition ||
            !selectedRackId
          ) {
            setIsDragging(false);
            return;
          }

          updateRack(selectedRackId, {
            position: dragPreviewPosition,
          });

          setIsDragging(false);
          setDragPreviewPosition(null);
        }}
      >
        <planeGeometry args={[stickWidth * stickCols, stickLength * stickRows]} />
        <meshStandardMaterial color={editMode ? "#d0e6ff" : "#d9d9d9"} />
      </mesh>

      {/* Background */}
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
  const userRole = useUserRole();
  const [zoom, setZoom] = React.useState(0);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);
  const [renameModalVisible, setRenameModalVisible] = React.useState(false);
  const [renameTargetUser, setRenameTargetUser] = React.useState<any>(null);
  const [renameUsernameInput, setRenameUsernameInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(true);
  const [editMode, setEditMode] = React.useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] =
    React.useState(false);
  const [newWarehouseName, setNewWarehouseName] = React.useState("");
  const router = useRouter();
  const { warehouses, addWarehouse, deleteWarehouse, renameWarehouse } =
    useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<
    string | null
  >(null);
  const [selectedRackId, setSelectedRackId] = React.useState<string | null>(
    null,
  );
  const [dragPreviewPosition, setDragPreviewPosition] = React.useState<
    [number, number, number] | null
  >(null);
  const [profileVisible, setProfileVisible] = React.useState(false);
  const [staffModalVisible, setStaffModalVisible] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [newSubUsername, setNewSubUsername] = React.useState("");
  const [newSubRole, setNewSubRole] = React.useState<"admin" | "edit" | "view">(
    "view",
  );
  const [nameInput, setNameInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const { racks, addRack, updateRack, deleteRack } =
    useRacks(selectedWarehouseId);
  const [editingWarehouseId, setEditingWarehouseId] = React.useState<
    string | null
  >(null);

  const STICK_LENGTH = 60;
  const STICK_WIDTH = 45;

  // Stick grid layout
  const [stickRows, setStickRows] = React.useState(3);
  const [stickCols, setStickCols] = React.useState(1);

  // layout modal
  const [layoutModalVisible, setLayoutModalVisible] = React.useState(false);
  const [rowInput, setRowInput] = React.useState("3");
  const [colInput, setColInput] = React.useState("1");

  const createStickLayout = () => {
    const rows = Math.max(1, parseInt(rowInput) || 1);
    const cols = Math.max(1, parseInt(colInput) || 1);

    setStickRows(rows);
    setStickCols(cols);

    setLayoutModalVisible(false);
  };

  const filteredRacks = React.useMemo(() => {
    if (!searchQuery.trim()) return racks;

    return racks.filter((rack) =>
      rack.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [racks, searchQuery]);

  const [renameValue, setRenameValue] = React.useState("");
  const [firebaseUser, setFirebaseUser] = React.useState<any>(null);

  const [emailInput, setEmailInput] = React.useState("");
  const [phoneInput, setPhoneInput] = React.useState("");

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

  /* =========================
     🔐 Auth Listener (Fixed)
  ========================= */
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.replace("/login");
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(collection(db, "usernames"), (snapshot) => {
      const users = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.uid === firebaseUser.uid);

      setAllUsers(users);
    });

    return unsubscribe;
  }, [firebaseUser]);

  /* =========================
     🏭 Auto Select Warehouse (Fixed Position)
  ========================= */
  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses]);

  /* =========================
     👤 Prefill Profile
  ========================= */
  React.useEffect(() => {
    if (firebaseUser) {
      setNameInput(firebaseUser.displayName || "");
      setEmailInput(firebaseUser.email || "");
    }
  }, [firebaseUser]);

  React.useEffect(() => {
    if (!editMode) {
      setDragPreviewPosition(null);
      setSelectedRackId(null);
    }
  }, [editMode]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleAddSubUser = async () => {
    if (!firebaseUser) return;

    if (!newSubUsername.trim()) {
      alert("Enter username");
      return;
    }

    const username = newSubUsername.trim().toLowerCase();

    try {
      // Check if username already exists
      const usernameRef = doc(db, "usernames", username);
      const snap = await getDoc(usernameRef);

      if (snap.exists()) {
        alert("Username already taken");
        return;
      }

      // Create sub user entry
      await setDoc(usernameRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: newSubRole,
        createdAt: new Date(),
      });

      alert("User added successfully");
      setNewSubUsername("");
      setNewSubRole("view");
    } catch (error: any) {
      alert(error.message);
    }
  };



  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setWarehouseModalVisible(true)}>
          <Text
            style={[
              styles.logoText,
              warehouses.length === 0 && { color: "#fff", fontStyle: "italic" },
            ]}
          >
            {warehouses.length === 0
              ? "+ Add Warehouse"
              : `${currentWarehouse?.name} ▼`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setProfileVisible(true)}
        >
          <Text style={styles.profileText}>
            👤 {firebaseUser?.displayName || firebaseUser?.email}
          </Text>
        </TouchableOpacity>

        {userRole === "admin" && (
          <TouchableOpacity
            style={[styles.profileBtn, { marginLeft: 8 }]}
            onPress={() => setStaffModalVisible(true)}
          >
            <Text style={styles.profileText}>👥 Staff</Text>
          </TouchableOpacity>
        )}

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
                  placeholder="Enter Display Name"
                />
                {userRole === "admin" && (
                  <>
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
                  </>
                )}
                {/* ADD SUB USER SECTION */}

                <Modal
                  visible={renameModalVisible}
                  transparent
                  animationType="fade"
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.profileModal}>
                      <Text style={styles.modalTitle}>Rename User</Text>

                      <TextInput
                        style={styles.input}
                        value={renameUsernameInput}
                        onChangeText={setRenameUsernameInput}
                        placeholder="Enter new username"
                      />

                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={async () => {
                          if (!renameTargetUser) return;

                          const lower = renameUsernameInput
                            .trim()
                            .toLowerCase();
                          if (!lower) return;

                          const snap = await getDoc(
                            doc(db, "usernames", lower),
                          );
                          if (snap.exists()) {
                            alert("Username already taken");
                            return;
                          }

                          // Copy data
                          const { id, ...restData } = renameTargetUser;

                          await setDoc(doc(db, "usernames", lower), {
                            ...restData,
                          });

                          // Delete old
                          await deleteDoc(
                            doc(db, "usernames", renameTargetUser.id),
                          );

                          setRenameModalVisible(false);
                        }}
                      >
                        <Text style={styles.btnText}>Save</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => setRenameModalVisible(false)}
                      >
                        <Text>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={async () => {
                    if (!firebaseUser) return;

                    if (!nameInput) {
                      alert("Username is required");
                      return;
                    }

                    try {
                      await firebaseUpdateProfile(firebaseUser, {
                        displayName: nameInput.trim(),
                      });

                      if (userRole === "admin") {
                        if (firebaseUser.email !== emailInput.trim()) {
                          await updateEmail(firebaseUser, emailInput.trim());
                        }
                      }

                      alert("Profile updated");
                      setProfileVisible(false);
                    } catch (err) {
                      alert("Error updating profile");
                    }
                  }}
                >
                  <Text style={styles.btnText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
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

        <Modal visible={staffModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxHeight: "85%" }]}>
              <Text style={styles.modalTitle}>Staff Management</Text>

              <Text style={{ marginBottom: 10 }}>
                Total Staff Users: {allUsers.length}
              </Text>

              <ScrollView
                style={{ maxHeight: 250 }}
                showsVerticalScrollIndicator={false}
              >
                {allUsers.map((u: any) => {
                  const isLastAdmin =
                    u.role === "admin" &&
                    allUsers.filter((x) => x.role === "admin").length <= 1;

                  const isSelf =
                    u.id === (firebaseUser?.displayName || "").toLowerCase();

                  return (
                    <View
                      key={`${u.id}-${u.uid}`}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 10,
                        marginBottom: 8,
                        backgroundColor: "#FFF4CC",
                        borderRadius: 10,
                      }}
                    >
                      <Text>
                        {u.id} ({u.role})
                      </Text>

                      <View style={{ flexDirection: "row" }}>
                        {/* Change Role */}
                        <TouchableOpacity
                          onPress={async () => {
                            if (isLastAdmin) {
                              alert("At least one admin is required.");
                              return;
                            }

                            const nextRole =
                              u.role === "admin"
                                ? "edit"
                                : u.role === "edit"
                                  ? "view"
                                  : "admin";

                            await setDoc(
                              doc(db, "usernames", u.id),
                              { role: nextRole },
                              { merge: true },
                            );
                          }}
                          style={{ marginRight: 12 }}
                        >
                          <Text style={{ color: "#2E7D32" }}>Change</Text>
                        </TouchableOpacity>

                        {/* Delete Staff */}
                        <TouchableOpacity
                          onPress={async () => {
                            if (isLastAdmin) {
                              alert("Cannot delete the last admin.");
                              return;
                            }

                            if (isSelf) {
                              alert("You cannot delete yourself.");
                              return;
                            }

                            await deleteDoc(doc(db, "usernames", u.id));
                          }}
                        >
                          <Text style={{ color: "red" }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Add New Staff */}
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={newSubUsername}
                onChangeText={setNewSubUsername}
              />

              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {["admin", "edit", "view"].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={{
                      marginRight: 12,
                      padding: 8,
                      backgroundColor: newSubRole === role ? "#F4B400" : "#eee",
                      borderRadius: 8,
                    }}
                    onPress={() =>
                      setNewSubRole(role as "admin" | "edit" | "view")
                    }
                  >
                    <Text>{role.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleAddSubUser}
              >
                <Text style={styles.btnText}>Add User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setStaffModalVisible(false)}
              >
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Stick Layout Modal */}
        <Modal visible={layoutModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>

              <Text style={styles.modalTitle}>Create Stick Layout</Text>

              <Text style={styles.label}>Rows</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={rowInput}
                onChangeText={setRowInput}
              />

              <Text style={styles.label}>Columns</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={colInput}
                onChangeText={setColInput}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={createStickLayout}
              >
                <Text style={styles.btnText}>Create Layout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setLayoutModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
      </View>

      {/* 3D VIEW */}
      <Animated.View style={{ height: modelHeight }}>
        <PinchGestureHandler
          onGestureEvent={(e) => {
            setZoom((e.nativeEvent.scale - 1) * 2);
          }}
          onEnded={() => setZoom(0)}
        >
          <PanGestureHandler
            onGestureEvent={(e) => {
              if (e.nativeEvent.numberOfPointers === 1) {
                setRotateX(e.nativeEvent.velocityX);
                setRotateY(e.nativeEvent.velocityY);
              }

              if (e.nativeEvent.numberOfPointers === 2) {
                setPanX(e.nativeEvent.velocityX);
                setPanY(e.nativeEvent.velocityY);
              }
            }}
            onEnded={() => {
              setRotateX(0);
              setRotateY(0);
              setPanX(0);
              setPanY(0);
            }}
          >
            <View style={{ flex: 1 }}>
              <Canvas
                frameloop="always"
                shadows
                camera={{ position: [15, 20, 25], fov: 50 }}
                style={{ backgroundColor: "#EAF6FF" }}
              >
                <WarehouseCameraController
                  zoom={zoom}
                  panX={panX}
                  panY={panY}
                  rotateX={rotateX}
                  rotateY={rotateY}
                  editMode={editMode}
                />

                <ambientLight intensity={0.3} />

                <directionalLight
                  position={[10, 30, 10]}
                  intensity={1.4}
                  castShadow
                />

                <Floor
                  racks={racks}
                  selectedRackId={selectedRackId}
                  updateRack={updateRack}
                  editMode={editMode}
                  dragPreviewPosition={dragPreviewPosition}
                  setDragPreviewPosition={setDragPreviewPosition}
                  stickRows={stickRows}
                  stickCols={stickCols}
                  stickWidth={STICK_WIDTH}
                  stickLength={STICK_LENGTH}
                />

                {/* Horizontal lines */}
                {Array.from({ length: stickRows + 1 }).map((_, i) => {
                  const z =
                    -(STICK_LENGTH * stickRows) / 2 + i * STICK_LENGTH;

                  return (
                    <mesh
                      key={`h-${i}`}
                      position={[0, 0.03, z]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <planeGeometry args={[STICK_WIDTH * stickCols, 0.15]} />
                      <meshStandardMaterial color="#000" />
                    </mesh>
                  );
                })}

                {/* Vertical lines */}
                {Array.from({ length: stickCols + 1 }).map((_, i) => {
                  const x =
                    -(STICK_WIDTH * stickCols) / 2 + i * STICK_WIDTH;

                  return (
                    <mesh
                      key={`v-${i}`}
                      position={[x, 0.03, 0]}
                      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                    >
                      <planeGeometry args={[STICK_LENGTH * stickRows, 0.15]} />
                      <meshStandardMaterial color="#000" />
                    </mesh>
                  );
                })}

                {filteredRacks.map((rack: any) => (
                  <Rack
                    key={rack.id}
                    id={rack.id}
                    position={
                      rack.id === selectedRackId && dragPreviewPosition
                        ? dragPreviewPosition
                        : rack.position
                    }
                    stock={rack.stock}
                    bagsPerLevel={rack.bagsPerLevel}
                    width={rack.width}
                    depth={rack.depth}
                    expiryDate={rack.expiryDate}
                    isSelected={selectedRackId === rack.id}
                    onSelect={(id) => setSelectedRackId(id)}
                  />
                ))}
              </Canvas>
            </View>
          </PanGestureHandler>
        </PinchGestureHandler>
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
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            placeholder="Search rack by name"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { opacity: userRole === "view" ? 0.5 : 1 },
            ]}
            disabled={userRole === "view"}
            onPress={() => {
              if (userRole === "view") {
                alert("View user cannot add rack");
                return;
              }

              if (!selectedWarehouseId) {
                alert("Please create or select a warehouse first");
                return;
              }

              addRack();
            }}
          >
            <Text style={styles.btnText}>+ Rack</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setLayoutModalVisible(true)}
          >
            <Text style={styles.btnText}>Create Layout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: editMode ? "#2ecc71" : "#eee",
                opacity: userRole === "view" ? 0.5 : 1,
              },
            ]}
            disabled={userRole === "view"}
            onPress={() => {
              if (userRole === "view") {
                alert("View user cannot enable edit mode");
                return;
              }

              setEditMode(!editMode);
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {editMode ? "EDIT MODE ON" : "EDIT MODE OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        <WarehouseStatsPanel racks={filteredRacks} />

        <RackInfoPanel
          racks={filteredRacks}
          selectedRackId={selectedRackId}
          updateRack={updateRack}
          deleteRack={deleteRack}
          editMode={editMode}
          userRole={userRole}
        />
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
                      setSelectedWarehouseId(w.id);
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
                {warehouses.length > 1 && userRole === "admin" && (
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
              style={[
                styles.primaryBtn,
                { opacity: userRole === "admin" ? 1 : 0.5 },
              ]}
              disabled={userRole !== "admin"}
              onPress={() => {
                if (userRole !== "admin") {
                  alert("Only admin can add warehouse");
                  return;
                }

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "#888",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },

  clearButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  clearText: {
    fontSize: 16,
    color: "#999",
  },
});
