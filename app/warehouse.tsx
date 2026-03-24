import HeaderBar from "@/src/components/panels/HeaderBar";
import ProfileModal from "@/src/components/modals/ProfileModal";
import RackCreateModal from "@/src/components/modals/RackCreateModal";
import SettingsModal from "@/src/components/modals/SettingsModal";
import StaffModal from "@/src/components/modals/StaffModal";
import WarehouseModal from "@/src/components/modals/WarehouseModal";
import WarehouseCanvas from "@/src/components/warehouse/WarehouseCanvas";
import RackLabelOverlay from "@/src/components/warehouse/RackLabelOverlay";
import { auth, db } from "@/src/firebase/config";
import { useRacks } from "@/src/hooks/useRacks";
import { useSticks } from "@/src/hooks/useSticks";
import { useUserRole } from "@/src/hooks/useUserRole";
import { useWarehouses } from "@/src/hooks/useWarehouses";
import { useWarehouseStaff } from "@/src/hooks/useWarehouseStaff";
import { WarehouseRole } from "@/src/types/warehouse";
import {
  getAvailableOccupancyPercent,
  getLaidOutSticks,
  getRackFootprint,
  getRenderedRacksForSticks,
  getSceneMetrics,
  getStickSceneLayout,
} from "@/src/utils/warehouseLayout";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { deleteDoc, doc, getDoc, getDocs, query, where, collection } from "firebase/firestore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";

export default function WarehouseScene() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const [zoom, setZoom] = React.useState(0);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);
  const [selectedRackId, setSelectedRackId] = React.useState<string | null>(null);
  const [editingRackId, setEditingRackId] = React.useState<string | null>(null);
  const [selectedStickId, setSelectedStickId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [canvasSize, setCanvasSize] = React.useState({ width: 0, height: 0 });

  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);
  const [warehouseModalVisible, setWarehouseModalVisible] = React.useState(false);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [rackModalVisible, setRackModalVisible] = React.useState(false);
  const [profileVisible, setProfileVisible] = React.useState(false);
  const [staffVisible, setStaffVisible] = React.useState(false);

  const [warehouseNameDraft, setWarehouseNameDraft] = React.useState("");
  const [stickNameDraft, setStickNameDraft] = React.useState("");
  const [profileName, setProfileName] = React.useState("");
  const [profilePhone, setProfilePhone] = React.useState("");
  const [rackNameDraft, setRackNameDraft] = React.useState("");
  const [rackMaterialDraft, setRackMaterialDraft] = React.useState("");
  const [rackBagCountDraft, setRackBagCountDraft] = React.useState("");
  const [rackStackCountDraft, setRackStackCountDraft] = React.useState("");
  const [rackOccupancyDraft, setRackOccupancyDraft] = React.useState("50");
  const [rackEntryDateDraft, setRackEntryDateDraft] = React.useState(
    new Date().toISOString().split("T")[0],
  );
  const [inviteValue, setInviteValue] = React.useState("");
  const [createStaffUsername, setCreateStaffUsername] = React.useState("");
  const [createStaffPassword, setCreateStaffPassword] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WarehouseRole>("edit");
  const gestureRef = React.useRef({
    startRotateX: 0,
    startRotateY: 0,
    startZoom: 0,
    startPanX: 0,
    startPanY: 0,
    startDistance: 0,
    startMidX: 0,
    startMidY: 0,
    touchCount: 0,
  });

  const {
    warehouses,
    loading: warehousesLoading,
    error: warehousesError,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehouses();

  const currentWarehouse =
    warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  const { role, loading: roleLoading, error: roleError } = useUserRole(currentWarehouse);
  const {
    sticks,
    error: sticksError,
    createStick,
    deleteStick,
  } = useSticks(currentWarehouse?.id ?? null);
  const {
    racks,
    loading: racksLoading,
    error: racksError,
    addRack,
    updateRack,
    deleteRack,
  } = useRacks(
    currentWarehouse?.id ?? null,
  );
  const {
    members,
    error: staffError,
    inviteMember,
    createManagedStaffMember,
    updateMemberRole,
    removeMember,
  } = useWarehouseStaff(currentWarehouse);

  const filteredSticks = React.useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();

    if (!queryText) {
      return sticks;
    }

    return sticks.filter((stick) => stick.name.toLowerCase().includes(queryText));
  }, [searchQuery, sticks]);

  const filteredRacks = React.useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();

    if (!queryText) {
      return racks;
    }

    const visibleStickIds = new Set(filteredSticks.map((stick) => stick.id));
    return racks.filter((rack) => rack.stickId && visibleStickIds.has(rack.stickId));
  }, [filteredSticks, racks, searchQuery]);

  const selectedStick = React.useMemo(
    () => sticks.find((stick) => stick.id === selectedStickId) ?? null,
    [selectedStickId, sticks],
  );
  const availableOccupancy = React.useMemo(() => {
    if (!selectedStickId) {
      return 100;
    }

    return getAvailableOccupancyPercent(racks, selectedStickId, editingRackId);
  }, [editingRackId, racks, selectedStickId]);

  const stickSceneLayout = React.useMemo(
    () =>
      getStickSceneLayout(
        sticks,
        currentWarehouse?.stickCols ?? 1,
        currentWarehouse?.stickWidth ?? 90,
        currentWarehouse?.stickLength ?? 120,
      ),
    [currentWarehouse?.stickCols, currentWarehouse?.stickLength, currentWarehouse?.stickWidth, sticks],
  );
  const renderedRacks = React.useMemo(
    () =>
      getRenderedRacksForSticks(
        filteredRacks,
        filteredSticks,
        currentWarehouse?.stickCols ?? 1,
        currentWarehouse?.stickWidth ?? 90,
        currentWarehouse?.stickLength ?? 120,
      ),
    [currentWarehouse?.stickCols, currentWarehouse?.stickLength, currentWarehouse?.stickWidth, filteredRacks, filteredSticks],
  );
  const sceneMetrics = React.useMemo(
    () =>
      getSceneMetrics(
        filteredSticks,
        renderedRacks,
        currentWarehouse?.stickCols ?? 1,
        currentWarehouse?.stickWidth ?? 90,
        currentWarehouse?.stickLength ?? 120,
      ),
    [currentWarehouse?.stickCols, currentWarehouse?.stickLength, currentWarehouse?.stickWidth, filteredSticks, renderedRacks],
  );

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);

      if (!user) {
        router.replace("/login");
        return;
      }

      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      const profile = userSnapshot.data();

      setProfileName(user.displayName || profile?.displayName || profile?.username || "");
      setProfilePhone(profile?.phone || "");
    });

    return unsubscribe;
  }, [router]);

  React.useEffect(() => {
    if (selectedWarehouseId && warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)) {
      return;
    }

    setSelectedWarehouseId(warehouses[0]?.id ?? null);
  }, [selectedWarehouseId, warehouses]);

  React.useEffect(() => {
    if (!selectedRackId) return;

    const selectedExists = filteredRacks.some((rack) => rack.id === selectedRackId);
    if (!selectedExists) {
      setSelectedRackId(null);
    }
  }, [filteredRacks, selectedRackId]);

  React.useEffect(() => {
    setZoom(0);
    setPanX(0);
    setPanY(0);
  }, [currentWarehouse?.id, filteredRacks.length, filteredSticks.length, searchQuery]);

  React.useEffect(() => {
    if (!warehouseModalVisible) {
      return;
    }

    setWarehouseNameDraft(currentWarehouse?.name ?? "");
  }, [currentWarehouse?.name, warehouseModalVisible]);

  const handleCreateWarehouse = async () => {
    const name = warehouseNameDraft.trim();
    if (!name) {
      Alert.alert("Warehouse name required", "Please enter a warehouse name.");
      return;
    }

    try {
      const newWarehouseId = await addWarehouse(name);
      setWarehouseNameDraft("");
      setWarehouseModalVisible(false);
      if (newWarehouseId) {
        setSelectedWarehouseId(newWarehouseId);
      }
    } catch (error: any) {
      Alert.alert("Could not create warehouse", error.message);
    }
  };

  const handleRenameWarehouse = async (warehouseId: string) => {
    const name = warehouseNameDraft.trim();
    if (!name) {
      Alert.alert("Name required", "Enter a new warehouse name first.");
      return;
    }

    try {
      await updateWarehouse(warehouseId, { name });
      setWarehouseNameDraft("");
    } catch (error: any) {
      Alert.alert("Rename failed", error.message);
    }
  };

  const handleCreateStick = async () => {
    const name = stickNameDraft.trim();
    if (!currentWarehouse) {
      Alert.alert("Select a warehouse", "Please select a warehouse first.");
      return;
    }

    if (!name) {
      Alert.alert("Stick name required", "Please enter a stick name.");
      return;
    }

    try {
      await createStick(name);
      setStickNameDraft("");
    } catch (error: any) {
      Alert.alert("Could not add stick", error.message);
    }
  };

  const handleDeleteStick = (stickId: string) => {
    const linkedRacks = racks.filter((rack) => rack.stickId === stickId);

    Alert.alert(
      "Delete stick?",
      linkedRacks.length > 0
        ? "This will remove the stick and all racks inside it."
        : "This will remove the stick.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all([
                ...linkedRacks.map((rack) => deleteRack(rack.id)),
                deleteStick(stickId),
              ]);

              if (selectedStickId === stickId) {
                setSelectedStickId(null);
              }
            } catch (error: any) {
              Alert.alert("Could not delete stick", error.message);
            }
          },
        },
      ],
    );
  };

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    Alert.alert(
      "Delete warehouse?",
      "This will remove the warehouse, its racks, and staff assignments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const rackSnapshot = await getDocs(
                query(collection(db, "racks"), where("warehouseId", "==", warehouseId)),
              );
              const memberSnapshot = await getDocs(
                query(collection(db, "warehouseMembers"), where("warehouseId", "==", warehouseId)),
              );

              await Promise.all([
                ...rackSnapshot.docs.map((rackDoc) => deleteDoc(rackDoc.ref)),
                ...memberSnapshot.docs.map((memberDoc) => deleteDoc(memberDoc.ref)),
                deleteWarehouse(warehouseId),
              ]);
            } catch (error: any) {
              Alert.alert("Delete failed", error.message);
            }
          },
        },
      ],
    );
  };

  const handleSelectStick = (stickId: string) => {
    if (role === "view") return;
    const freePercent = getAvailableOccupancyPercent(racks, stickId);

    if (freePercent <= 0) {
      Alert.alert("Stick is full", "No space is left in this stick for another rack.");
      return;
    }

    setEditingRackId(null);
    setSelectedRackId(null);
    setSelectedStickId(stickId);
    setRackNameDraft("");
    setRackMaterialDraft("");
    setRackBagCountDraft("");
    setRackStackCountDraft("");
    setRackOccupancyDraft(String(Math.min(50, Math.max(1, freePercent))));
    setRackEntryDateDraft(new Date().toISOString().split("T")[0]);
    setRackModalVisible(true);
  };

  const handleSelectRack = React.useCallback((rackId: string | null) => {
    setSelectedRackId(rackId);

    if (!rackId) {
      return;
    }

    const rack = racks.find((item) => item.id === rackId);
    if (!rack) {
      return;
    }

    setEditingRackId(rack.id);
    setSelectedStickId(rack.stickId ?? null);
    setRackNameDraft(rack.name ?? "");
    setRackMaterialDraft(rack.material ?? "");
    setRackBagCountDraft(String(rack.stock ?? 0));
    setRackStackCountDraft(String(rack.stackCount ?? Math.max(1, Math.ceil(rack.stock / Math.max(1, rack.bagsPerLevel)))));
    setRackOccupancyDraft(String(rack.occupancyPercent ?? 1));
    setRackEntryDateDraft(rack.entryDate ?? new Date().toISOString().split("T")[0]);
    setRackModalVisible(true);
  }, [racks]);

  const handleCreateRackForStick = async () => {
    if (!currentWarehouse || !selectedStick) {
      Alert.alert("Select a stick", "Please select a stick first.");
      return;
    }

    const stock = Number(rackBagCountDraft);
    const stackCount = Number(rackStackCountDraft);
    const occupancyPercent = Number(rackOccupancyDraft);

    if (!rackNameDraft.trim()) {
      Alert.alert("Rack name required", "Please enter a rack name.");
      return;
    }

    if (!rackMaterialDraft.trim()) {
      Alert.alert("Material required", "Please enter the rack material.");
      return;
    }

    if (!Number.isFinite(stock) || stock <= 0) {
      Alert.alert("Invalid bags", "Enter a valid number of bags.");
      return;
    }

    if (!Number.isFinite(stackCount) || stackCount <= 0) {
      Alert.alert("Invalid stacks", "Enter a valid stack count.");
      return;
    }

    if (!Number.isFinite(occupancyPercent) || occupancyPercent <= 0 || occupancyPercent > availableOccupancy) {
      Alert.alert("Invalid space", `Only ${availableOccupancy}% space is left in this stick.`);
      return;
    }

    const stickWidth = currentWarehouse.stickWidth;
    const stickLength = currentWarehouse.stickLength;
    const laidOutStick = getLaidOutSticks(sticks, currentWarehouse.stickCols).find(
      (stick) => stick.id === selectedStick.id,
    );
    const centerX =
      stickSceneLayout.startX +
      ((laidOutStick?.layoutCol ?? 0) - stickSceneLayout.minCol) * stickWidth;
    const centerZ =
      stickSceneLayout.startZ +
      ((laidOutStick?.layoutRow ?? 0) - stickSceneLayout.minRow) * stickLength;
    const footprint = getRackFootprint(occupancyPercent, stickWidth, stickLength);
    const rackPosition: [number, number, number] = [centerX, 1, centerZ];

    try {
      await addRack(currentWarehouse, {
        stickId: selectedStick.id,
        name: rackNameDraft.trim(),
        material: rackMaterialDraft.trim(),
        stock,
        stackCount,
        occupancyPercent,
        entryDate: rackEntryDateDraft,
        width: footprint.width,
        depth: footprint.depth,
        position: rackPosition,
      });

      setRackModalVisible(false);
      setSelectedStickId(null);
    } catch (error: any) {
      Alert.alert("Could not add rack", error.message);
    }
  };

  const handleSaveRackForm = async () => {
    if (editingRackId) {
      const stock = Number(rackBagCountDraft);
      const stackCount = Number(rackStackCountDraft);
      const occupancyPercent = Number(rackOccupancyDraft);

      if (!rackNameDraft.trim()) {
        Alert.alert("Rack name required", "Please enter a rack name.");
        return;
      }

      if (!rackMaterialDraft.trim()) {
        Alert.alert("Material required", "Please enter the rack material.");
        return;
      }

      if (!Number.isFinite(stock) || stock <= 0) {
        Alert.alert("Invalid bags", "Enter a valid number of bags.");
        return;
      }

      if (!Number.isFinite(stackCount) || stackCount <= 0) {
        Alert.alert("Invalid stacks", "Enter a valid stack count.");
        return;
      }

      if (!Number.isFinite(occupancyPercent) || occupancyPercent <= 0 || occupancyPercent > availableOccupancy) {
        Alert.alert("Invalid space", `Only ${availableOccupancy}% space is left in this stick.`);
        return;
      }

      try {
        const footprint = getRackFootprint(
          occupancyPercent,
          currentWarehouse?.stickWidth ?? 90,
          currentWarehouse?.stickLength ?? 120,
        );
        await updateRack(editingRackId, {
          name: rackNameDraft.trim(),
          material: rackMaterialDraft.trim(),
          stock,
          stackCount,
          occupancyPercent,
          bagsPerLevel: Math.max(1, Math.ceil(stock / stackCount)),
          entryDate: rackEntryDateDraft,
          width: footprint.width,
          depth: footprint.depth,
        });
        setRackModalVisible(false);
        setEditingRackId(null);
      } catch (error: any) {
        Alert.alert("Could not update rack", error.message);
      }
      return;
    }

    await handleCreateRackForStick();
  };

  const handleDeleteRack = (rackId: string) => {
    Alert.alert("Delete rack?", "This rack and its stock data will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRack(rackId);
            setRackModalVisible(false);
            setEditingRackId(null);
            setSelectedRackId(null);
            setSelectedStickId(null);
          } catch (error: any) {
            Alert.alert("Could not delete rack", error.message);
          }
        },
      },
    ]);
  };

  const handleInvite = async () => {
    try {
      await inviteMember(inviteValue, inviteRole);
      setInviteValue("");
      setInviteRole("edit");
    } catch (error: any) {
      Alert.alert("Invite failed", error.message);
    }
  };

  const handleCreateStaff = async () => {
    try {
      await createManagedStaffMember(createStaffUsername, createStaffPassword, inviteRole);
      const createdUsername = createStaffUsername.trim().toLowerCase();
      setCreateStaffUsername("");
      setCreateStaffPassword("");
      setInviteRole("edit");
      Alert.alert(
        "Staff account created",
        `Username: ${createdUsername}\nPassword: ${createStaffPassword}`,
      );
    } catch (error: any) {
      Alert.alert("Create staff failed", error.message);
    }
  };

  const handleUpdateMemberRole = (memberId: string, nextRole: WarehouseRole) => {
    Alert.alert(
      "Change staff role?",
      `This member will now have ${nextRole.toUpperCase()} access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await updateMemberRole(memberId, nextRole);
            } catch (error: any) {
              Alert.alert("Role update failed", error.message);
            }
          },
        },
      ],
    );
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert("Remove staff member?", "This person will lose access to the warehouse.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMember(memberId);
          } catch (error: any) {
            Alert.alert("Remove failed", error.message);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const resetView = () => {
    setZoom(0);
    setPanX(0);
    setPanY(0);
    setRotateX(0);
    setRotateY(0);
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Boolean(currentWarehouse) &&
          (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Boolean(currentWarehouse) &&
          (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6),
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;

          gestureRef.current.startRotateX = rotateX;
          gestureRef.current.startRotateY = rotateY;
          gestureRef.current.startZoom = zoom;
          gestureRef.current.startPanX = panX;
          gestureRef.current.startPanY = panY;
          gestureRef.current.touchCount = touches.length;

          if (touches.length >= 2) {
            const [firstTouch, secondTouch] = touches;
            const dx = secondTouch.pageX - firstTouch.pageX;
            const dy = secondTouch.pageY - firstTouch.pageY;

            gestureRef.current.startDistance = Math.hypot(dx, dy);
            gestureRef.current.startMidX = (firstTouch.pageX + secondTouch.pageX) / 2;
            gestureRef.current.startMidY = (firstTouch.pageY + secondTouch.pageY) / 2;
          }
        },
        onPanResponderMove: (event, gestureState) => {
          const touches = event.nativeEvent.touches;

          if (touches.length !== gestureRef.current.touchCount) {
            gestureRef.current.startRotateX = rotateX;
            gestureRef.current.startRotateY = rotateY;
            gestureRef.current.startZoom = zoom;
            gestureRef.current.startPanX = panX;
            gestureRef.current.startPanY = panY;
            gestureRef.current.touchCount = touches.length;

            if (touches.length >= 2) {
              const [firstTouch, secondTouch] = touches;
              const dx = secondTouch.pageX - firstTouch.pageX;
              const dy = secondTouch.pageY - firstTouch.pageY;

              gestureRef.current.startDistance = Math.hypot(dx, dy);
              gestureRef.current.startMidX = (firstTouch.pageX + secondTouch.pageX) / 2;
              gestureRef.current.startMidY = (firstTouch.pageY + secondTouch.pageY) / 2;
            }

            return;
          }

          if (touches.length >= 2) {
            const [firstTouch, secondTouch] = touches;
            const dx = secondTouch.pageX - firstTouch.pageX;
            const dy = secondTouch.pageY - firstTouch.pageY;
            const distance = Math.hypot(dx, dy);
            const midpointX = (firstTouch.pageX + secondTouch.pageX) / 2;
            const midpointY = (firstTouch.pageY + secondTouch.pageY) / 2;

            const pinchDelta = distance - gestureRef.current.startDistance;
            const panDeltaX = midpointX - gestureRef.current.startMidX;
            const panDeltaY = midpointY - gestureRef.current.startMidY;

            setZoom(
              Math.max(-160, Math.min(420, gestureRef.current.startZoom + pinchDelta * 0.6)),
            );
            setPanX(gestureRef.current.startPanX - panDeltaX * 0.75);
            setPanY(gestureRef.current.startPanY + panDeltaY * 0.75);
            return;
          }

          setRotateX(gestureRef.current.startRotateX - gestureState.dx * 0.012);
        },
        onPanResponderRelease: () => {
          gestureRef.current.touchCount = 0;
        },
        onPanResponderTerminate: () => {
          gestureRef.current.touchCount = 0;
        },
      }),
    [currentWarehouse, panX, panY, rotateX, rotateY, zoom],
  );

  const loading = authLoading || warehousesLoading || roleLoading || racksLoading;
  const screenError = warehousesError || roleError || racksError || sticksError || staffError;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        openQuickAdd={() => {
          setWarehouseNameDraft(currentWarehouse?.name ?? "");
          setWarehouseModalVisible(true);
        }}
        openSettings={() => setSettingsVisible(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <View style={styles.topStrip}>
        <View style={styles.topStripCard}>
          <Text style={styles.topStripLabel}>{t("warehouse.active")}</Text>
          <Text style={styles.topStripValue}>
            {currentWarehouse?.name ?? t("warehouse.createFirst")}
          </Text>
        </View>

        <View style={styles.topStripCard}>
          <Text style={styles.topStripLabel}>{t("warehouse.access")}</Text>
          <Text style={styles.topStripValue}>{role.toUpperCase()}</Text>
        </View>

        <View style={styles.topStripCard}>
          <Text style={styles.topStripLabel}>{t("warehouse.visibleRacks")}</Text>
          <Text style={styles.topStripValue}>{filteredRacks.length}</Text>
        </View>
      </View>

      {screenError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>{t("firebase.issueTitle")}</Text>
          <Text style={styles.errorText}>
            {t("firebase.issueDesc")}
          </Text>
          <Text style={styles.errorCode}>{screenError}</Text>
        </View>
      ) : null}

      <View style={styles.canvasShell} onLayout={handleCanvasLayout} {...panResponder.panHandlers}>
        {currentWarehouse ? (
          <>
            <WarehouseCanvas
              racks={filteredRacks}
              sticks={filteredSticks}
              selectedRackId={selectedRackId}
              selectedStickId={selectedStickId}
              setSelectedRackId={handleSelectRack}
              onSelectStick={handleSelectStick}
              zoom={zoom}
              panX={panX}
              panY={panY}
              rotateX={rotateX}
              rotateY={rotateY}
              stickRows={currentWarehouse.stickRows}
              stickCols={currentWarehouse.stickCols}
              stickWidth={currentWarehouse.stickWidth}
              stickLength={currentWarehouse.stickLength}
            />

            <RackLabelOverlay
              racks={renderedRacks}
              width={canvasSize.width}
              height={canvasSize.height}
              zoom={zoom}
              panX={panX}
              panY={panY}
              rotateX={rotateX}
              sceneMetrics={sceneMetrics}
              onSelectRack={handleSelectRack}
            />

            <View style={styles.toolbar}>
              <View style={styles.zoomRow}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((current) => Math.min(420, current + 40))}
                >
                  <Text style={styles.zoomBtnText}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((current) => Math.max(-160, current - 40))}
                >
                  <Text style={styles.zoomBtnText}>-</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.toolbarReset} onPress={resetView}>
                <Text style={styles.toolbarResetText}>{t("view.reset")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("warehouse.noneSelected")}</Text>
            <Text style={styles.emptyText}>
              {t("warehouse.noneSelectedDesc")}
            </Text>
          </View>
        )}
      </View>

      <WarehouseModal
        visible={warehouseModalVisible}
        warehouses={warehouses}
        currentWarehouseId={currentWarehouse?.id ?? null}
        currentWarehouseName={currentWarehouse?.name ?? null}
        sticks={sticks}
        draftName={warehouseNameDraft}
        setDraftName={setWarehouseNameDraft}
        stickName={stickNameDraft}
        setStickName={setStickNameDraft}
        onSelect={(warehouseId) => {
          setSelectedWarehouseId(warehouseId);
          setWarehouseNameDraft(
            warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? "",
          );
        }}
        onCreate={() => void handleCreateWarehouse()}
        onCreateStick={() => void handleCreateStick()}
        onDeleteStick={(stickId) => void handleDeleteStick(stickId)}
        onRename={(warehouseId) => void handleRenameWarehouse(warehouseId)}
        onDelete={(warehouseId) => void handleDeleteWarehouse(warehouseId)}
        onClose={() => setWarehouseModalVisible(false)}
        userRole={role}
      />

      <SettingsModal
        visible={settingsVisible}
        warehouse={currentWarehouse}
        sticks={sticks}
        racks={racks}
        userRole={role}
        language={language}
        onChangeLanguage={(nextLanguage) => void setLanguage(nextLanguage)}
        onUpdateWarehouse={(data) => {
          if (!currentWarehouse) return;
          void updateWarehouse(currentWarehouse.id, data);
        }}
        onOpenProfile={() => {
          setSettingsVisible(false);
          setProfileVisible(true);
        }}
        onOpenStaff={() => {
          setSettingsVisible(false);
          setStaffVisible(true);
        }}
        onClose={() => setSettingsVisible(false)}
      />

      <ProfileModal
        visible={profileVisible}
        firebaseUser={firebaseUser}
        nameInput={profileName}
        setNameInput={setProfileName}
        phoneInput={profilePhone}
        setPhoneInput={setProfilePhone}
        onLogout={() => void handleLogout()}
        onClose={() => setProfileVisible(false)}
      />

      <StaffModal
        visible={staffVisible}
        ownerLabel={firebaseUser?.displayName || firebaseUser?.email || "Admin"}
        members={members}
        inviteValue={inviteValue}
        setInviteValue={setInviteValue}
        createUsernameValue={createStaffUsername}
        setCreateUsernameValue={setCreateStaffUsername}
        createPasswordValue={createStaffPassword}
        setCreatePasswordValue={setCreateStaffPassword}
        selectedRole={inviteRole}
        setSelectedRole={setInviteRole}
        onInvite={() => void handleInvite()}
        onCreateStaff={() => void handleCreateStaff()}
        onUpdateRole={handleUpdateMemberRole}
        onRemove={handleRemoveMember}
        onClose={() => setStaffVisible(false)}
      />

      <RackCreateModal
        visible={rackModalVisible}
        stick={selectedStick}
        title={editingRackId ? t("rack.edit") : t("rack.add")}
        submitLabel={editingRackId ? t("rack.update") : t("rack.save")}
        deleteLabel={t("rack.delete")}
        rackName={rackNameDraft}
        setRackName={setRackNameDraft}
        material={rackMaterialDraft}
        setMaterial={setRackMaterialDraft}
        bagCount={rackBagCountDraft}
        setBagCount={setRackBagCountDraft}
        stackCount={rackStackCountDraft}
        setStackCount={setRackStackCountDraft}
        occupancyPercent={rackOccupancyDraft}
        setOccupancyPercent={setRackOccupancyDraft}
        maxOccupancyPercent={Math.max(1, availableOccupancy)}
        entryDate={rackEntryDateDraft}
        setEntryDate={setRackEntryDateDraft}
        onDelete={editingRackId ? () => handleDeleteRack(editingRackId) : undefined}
        onClose={() => {
          setRackModalVisible(false);
          setEditingRackId(null);
          setSelectedStickId(null);
          setRackMaterialDraft("");
        }}
        onSubmit={() => void handleSaveRackForm()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9EC",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  canvasShell: {
    flex: 1.1,
    backgroundColor: "#F5E2A8",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E6CC7A",
    position: "relative",
  },
  topStrip: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF3CF",
  },
  topStripCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#F1DEAB",
  },
  topStripLabel: {
    fontSize: 11,
    color: "#7C6B3A",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  topStripValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3E2A00",
  },
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#FFF0ED",
    borderColor: "#F1B0A5",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  errorTitle: {
    color: "#A03115",
    fontWeight: "700",
    marginBottom: 4,
  },
  errorText: {
    color: "#7A3A2B",
    lineHeight: 18,
    marginBottom: 6,
  },
  errorCode: {
    color: "#7A3A2B",
    fontSize: 12,
  },
  toolbar: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#E2CF92",
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  zoomRow: {
    flexDirection: "row",
    gap: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: "700",
    color: "#6B4C00",
  },
  toolbarReset: {
    backgroundColor: "#5E4300",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
  },
  toolbarResetText: {
    color: "#FFF8E3",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: "#7A5200",
  },
  emptyText: {
    textAlign: "center",
    color: "#6A6A6A",
    lineHeight: 22,
  },
});
