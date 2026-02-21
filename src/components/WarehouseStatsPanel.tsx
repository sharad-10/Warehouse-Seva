import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function WarehouseStatsPanel() {
  const racks = useWarehouseStore((state) => state.racks) || [];
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
    position: "absolute",
    top: 40,
    left: 20,
    width: 260,
    backgroundColor: "#ffffffee",
    padding: 15,
    borderRadius: 12,
    elevation: 8,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
});
