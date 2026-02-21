import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function WarehouseStatsPanel() {
  const warehouses = useWarehouseStore((s) => s.warehouses);
  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const racks = currentWarehouse?.racks || [];
  const [collapsed, setCollapsed] = React.useState(true);

  const totalRacks = racks.length;

  const totalStock = racks.reduce((sum, r) => sum + r.stock, 0);

  const totalLevels = racks.reduce((sum, r) => {
    const levels = Math.ceil(r.stock / r.bagsPerLevel);
    return sum + levels;
  }, 0);

  /* =========================
     🔥 Floor Area Calculation
  ========================= */
  const totalRackArea = racks.reduce((sum, r) => sum + r.width * r.depth, 0);

  const warehouseArea = 60 * 60; // floor size
  const usagePercent =
    warehouseArea === 0
      ? 0
      : ((totalRackArea / warehouseArea) * 100).toFixed(1);

  return (
    <View style={styles.panel}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
        <Text style={styles.title}>
          Warehouse Overview {collapsed ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text>Total Racks: {totalRacks}</Text>
          <Text>Total Stock: {totalStock}</Text>
          <Text>Total Levels: {totalLevels}</Text>

          <View style={styles.divider} />

          <Text>Rack Floor Area: {totalRackArea.toFixed(1)} m²</Text>
          <Text>Warehouse Usage: {usagePercent} %</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFFDF7",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F2E6B3",
  },

  title: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#F4B400",
  },

  divider: {
    height: 1,
    backgroundColor: "#F2E6B3",
    marginVertical: 10,
  },
});
