import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Stick, Warehouse, WarehouseRole } from "@/src/types/warehouse";

type Props = {
  visible: boolean;
  warehouses: Warehouse[];
  currentWarehouseId: string | null;
  currentWarehouseName: string | null;
  sticks: Stick[];
  draftName: string;
  setDraftName: (name: string) => void;
  stickName: string;
  setStickName: (name: string) => void;
  onSelect: (warehouseId: string) => void;
  onCreate: () => void;
  onCreateStick: () => void;
  onDeleteStick: (stickId: string) => void;
  onRename: (warehouseId: string) => void;
  onDelete: (warehouseId: string) => void;
  onClose: () => void;
  userRole: WarehouseRole;
};

export default function WarehouseModal({
  visible,
  warehouses,
  currentWarehouseId,
  currentWarehouseName,
  sticks,
  draftName,
  setDraftName,
  stickName,
  setStickName,
  onSelect,
  onCreate,
  onCreateStick,
  onDeleteStick,
  onRename,
  onDelete,
  onClose,
  userRole,
}: Props) {
  const hasWarehouses = warehouses.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Manage Warehouses</Text>
          <Text style={styles.subtitle}>
            Pick an active warehouse, rename the selected one, or create a new space.
          </Text>

          {hasWarehouses ? (
            <ScrollView style={styles.list}>
              {warehouses.map((warehouse) => {
                const isSelected = warehouse.id === currentWarehouseId;

                return (
                  <TouchableOpacity
                    key={warehouse.id}
                    style={[styles.item, isSelected && styles.selectedItem]}
                    onPress={() => onSelect(warehouse.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{warehouse.name}</Text>
                      <Text style={styles.itemMeta}>
                        {isSelected ? "Currently active" : "Tap to switch"}
                      </Text>
                    </View>

                    {userRole === "admin" && isSelected ? (
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={styles.smallBtn}
                          onPress={() => onRename(warehouse.id)}
                        >
                          <Text>Rename</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.dangerBtn]}
                          onPress={() => onDelete(warehouse.id)}
                        >
                          <Text style={styles.dangerText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No warehouses yet</Text>
              <Text style={styles.emptyText}>
                Create your first warehouse to unlock the rack planner and inventory tools.
              </Text>
            </View>
          )}

          <TextInput
            placeholder="New or updated warehouse name"
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.btn} onPress={onCreate}>
            <Text style={styles.btnText}>Create Warehouse</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.title}>Add Stick</Text>
          <Text style={styles.subtitle}>
            Add a named stick inside {currentWarehouseName ?? "the selected warehouse"}.
          </Text>

          {currentWarehouseId ? (
            <>
              <ScrollView style={styles.stickList}>
                {sticks.length === 0 ? (
                  <Text style={styles.emptyText}>No sticks added yet.</Text>
                ) : (
                  sticks.map((stick) => (
                    <View key={stick.id} style={styles.stickItem}>
                      <Text style={styles.itemTitle}>{stick.name}</Text>
                      {userRole === "admin" ? (
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.dangerBtn]}
                          onPress={() => onDeleteStick(stick.id)}
                        >
                          <Text style={styles.dangerText}>Delete</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>

              <TextInput
                placeholder="Stick name"
                value={stickName}
                onChangeText={setStickName}
                style={styles.input}
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.btn} onPress={onCreateStick}>
                <Text style={styles.btnText}>Add Stick</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Select a warehouse first</Text>
              <Text style={styles.emptyText}>
                Choose or create a warehouse above before adding sticks.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modal: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fffdf7",
    padding: 20,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#8B5E00",
  },
  subtitle: {
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  list: {
    maxHeight: 280,
    marginBottom: 12,
  },
  item: {
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedItem: {
    backgroundColor: "#FFF4CC",
  },
  itemTitle: {
    fontWeight: "700",
  },
  itemMeta: {
    color: "#666",
    marginTop: 3,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dangerBtn: {
    backgroundColor: "#FFF0ED",
    borderColor: "#F1B0A5",
  },
  dangerText: {
    color: "#B13A1D",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9D5A1",
    marginBottom: 14,
  },
  stickList: {
    maxHeight: 120,
    marginBottom: 12,
  },
  stickItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
    color: "#8B5E00",
  },
  emptyText: {
    color: "#666",
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#F4B400",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: {
    fontWeight: "700",
    color: "#2E2300",
  },
  closeText: {
    textAlign: "center",
    color: "#555",
  },
});
