import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import RackInfoPanel from "../../components/RackInfoPanel";
import WarehouseStatsPanel from "../../components/WarehouseStatsPanel";

import { Rack, Warehouse, WarehouseRole } from "@/src/types/warehouse";

type Props = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  userRole: WarehouseRole;
  addRack: () => void;
  currentWarehouse: Warehouse | null;
  updateWarehouse: (data: Partial<Warehouse>) => void;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  racks: Rack[];
  selectedRackId: string | null;
  updateRack: (id: string, data: Partial<Rack>) => void;
  deleteRack: (id: string) => void;
};

export default function BottomPanel({
  searchQuery,
  setSearchQuery,
  userRole,
  addRack,
  currentWarehouse,
  updateWarehouse,
  editMode,
  setEditMode,
  racks,
  selectedRackId,
  updateRack,
  deleteRack,
}: Props) {
  const canEditLayout = userRole === "admin" || userRole === "edit";
  const hasWarehouse = Boolean(currentWarehouse);

  return (
    <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search rack by name"
          placeholderTextColor="#8A8A8A"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.btn, !hasWarehouse && styles.disabledBtn]}
          onPress={addRack}
          disabled={!hasWarehouse || userRole === "view"}
        >
          <Text style={styles.btnText}>+ Rack</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !hasWarehouse && styles.disabledBtn]}
          onPress={() => setEditMode(!editMode)}
          disabled={!hasWarehouse || userRole === "view"}
        >
          <Text style={styles.btnText}>{editMode ? "Finish Layout" : "Move Racks"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>3D View Tips</Text>
        <Text style={styles.tipText}>
          In view mode, use one finger to rotate and two fingers to pan or pinch-zoom.
          Turn on Move Racks before dragging racks to a new position.
        </Text>
      </View>

      {!hasWarehouse ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Start with a warehouse</Text>
          <Text style={styles.noticeText}>
            Open the warehouse picker at the top to create one, then add racks and arrange
            your floor.
          </Text>
        </View>
      ) : null}

      {hasWarehouse && racks.length === 0 ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>No racks yet</Text>
          <Text style={styles.noticeText}>
            Add your first rack to begin tracking stock, expiry dates, and space usage.
          </Text>
        </View>
      ) : null}

      {hasWarehouse && racks.length > 0 && searchQuery.trim() && selectedRackId === null ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>No rack selected</Text>
          <Text style={styles.noticeText}>
            Search is active. Tap a rack in the 3D view or clear the search to browse everything.
          </Text>
        </View>
      ) : null}

      {currentWarehouse ? (
        <View style={styles.layoutCard}>
          <Text style={styles.sectionTitle}>Layout</Text>
          <Text style={styles.helperText}>
            Each stick: {currentWarehouse.stickWidth} ft x {currentWarehouse.stickLength} ft
          </Text>

          <View style={styles.layoutRow}>
            <Text>Rows: {currentWarehouse.stickRows}</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                disabled={!canEditLayout}
                onPress={() =>
                  updateWarehouse({
                    stickRows: Math.max(1, currentWarehouse.stickRows - 1),
                  })
                }
              >
                <Text>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtn}
                disabled={!canEditLayout}
                onPress={() =>
                  updateWarehouse({
                    stickRows: currentWarehouse.stickRows + 1,
                  })
                }
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.layoutRow}>
            <Text>Columns: {currentWarehouse.stickCols}</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                disabled={!canEditLayout}
                onPress={() =>
                  updateWarehouse({
                    stickCols: Math.max(1, currentWarehouse.stickCols - 1),
                  })
                }
              >
                <Text>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtn}
                disabled={!canEditLayout}
                onPress={() =>
                  updateWarehouse({
                    stickCols: currentWarehouse.stickCols + 1,
                  })
                }
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      <WarehouseStatsPanel racks={racks} warehouse={currentWarehouse} />

      <RackInfoPanel
        racks={racks}
        selectedRackId={selectedRackId}
        updateRack={updateRack}
        deleteRack={deleteRack}
        editMode={editMode}
        userRole={userRole}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#FFF9EC",
  },
  content: {
    padding: 15,
    paddingBottom: 32,
  },
  searchBox: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E9D5A1",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  btn: {
    flex: 1,
    backgroundColor: "#F4B400",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    color: "#2E2300",
    fontWeight: "700",
  },
  layoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 15,
    marginBottom: 15,
  },
  noticeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 15,
    marginBottom: 15,
  },
  tipCard: {
    backgroundColor: "#FFF4CC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0D686",
    padding: 15,
    marginBottom: 15,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7A5200",
    marginBottom: 6,
  },
  tipText: {
    color: "#6B6B6B",
    lineHeight: 20,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8B5E00",
    marginBottom: 6,
  },
  noticeText: {
    color: "#6B6B6B",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#8B5E00",
  },
  helperText: {
    color: "#6B6B6B",
    marginBottom: 12,
  },
  layoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  inlineActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    backgroundColor: "#FFF4CC",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
