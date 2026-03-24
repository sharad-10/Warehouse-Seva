import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Rack, Stick, Warehouse, WarehouseRole } from "@/src/types/warehouse";

type Props = {
  visible: boolean;
  warehouse: Warehouse | null;
  sticks: Stick[];
  racks: Rack[];
  userRole: WarehouseRole;
  onUpdateWarehouse: (data: Partial<Warehouse>) => void;
  onOpenProfile: () => void;
  onOpenStaff: () => void;
  onClose: () => void;
};

export default function SettingsModal({
  visible,
  warehouse,
  sticks,
  racks,
  userRole,
  onUpdateWarehouse,
  onOpenProfile,
  onOpenStaff,
  onClose,
}: Props) {
  const totalStock = racks.reduce((sum, rack) => sum + (rack.stock || 0), 0);
  const totalStacks = racks.reduce((sum, rack) => sum + (rack.stackCount || 0), 0);
  const totalOccupancy = racks.reduce((sum, rack) => sum + (rack.occupancyPercent || 0), 0);
  const canEditLayout = userRole === "admin" || userRole === "edit";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage warehouse details, stick layout, and account tools.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Warehouse Overview</Text>
              <Text style={styles.dataLine}>
                Active Warehouse: {warehouse?.name ?? "No warehouse selected"}
              </Text>
              <Text style={styles.dataLine}>Total Sticks: {sticks.length}</Text>
              <Text style={styles.dataLine}>Total Racks: {racks.length}</Text>
              <Text style={styles.dataLine}>Total Stock: {totalStock}</Text>
              <Text style={styles.dataLine}>Total Stacks: {totalStacks}</Text>
              <Text style={styles.dataLine}>Allocated Stick Space: {totalOccupancy}%</Text>
            </View>

            {warehouse ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Stick Layout</Text>
                <Text style={styles.helperText}>
                  Stick size: {warehouse.stickWidth} ft x {warehouse.stickLength} ft
                </Text>

                <View style={styles.layoutRow}>
                  <Text style={styles.dataLine}>Rows: {warehouse.stickRows}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickRows: Math.max(1, warehouse.stickRows - 1) })}
                    >
                      <Text style={styles.smallBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickRows: warehouse.stickRows + 1 })}
                    >
                      <Text style={styles.smallBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.layoutRow}>
                  <Text style={styles.dataLine}>Columns: {warehouse.stickCols}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickCols: Math.max(1, warehouse.stickCols - 1) })}
                    >
                      <Text style={styles.smallBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickCols: warehouse.stickCols + 1 })}
                    >
                      <Text style={styles.smallBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onOpenProfile}>
                <Text style={styles.primaryText}>Profile</Text>
              </TouchableOpacity>

              {userRole === "admin" ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenStaff}>
                  <Text style={styles.secondaryText}>Staff Management</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>

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
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modal: {
    width: "92%",
    maxHeight: "84%",
    backgroundColor: "#FFFDF7",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5E3F00",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6D654E",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#7A5200",
    marginBottom: 8,
  },
  helperText: {
    color: "#6D654E",
    marginBottom: 12,
  },
  dataLine: {
    color: "#3E2A00",
    marginBottom: 6,
  },
  layoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: {
    fontSize: 20,
    color: "#6B4C00",
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.45,
  },
  primaryBtn: {
    backgroundColor: "#F4B400",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: {
    color: "#2E2300",
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#FFF4CC",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#6B4C00",
    fontWeight: "700",
  },
  closeText: {
    textAlign: "center",
    marginTop: 8,
    color: "#666",
  },
});
