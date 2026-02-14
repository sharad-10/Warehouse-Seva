import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function WarehouseStatsPanel() {
  const { racks } = useWarehouseStore();

  const rackList = Object.values(racks);

  const totalRacks = rackList.length;
  const totalStock = rackList.reduce((sum, r) => sum + r.stock, 0);
  const totalCapacity = rackList.reduce((sum, r) => sum + r.capacity, 0);

  const utilization =
    totalCapacity === 0 ? 0 : Math.round((totalStock / totalCapacity) * 100);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Warehouse Overview</Text>

      <Text>Total Racks: {totalRacks}</Text>
      <Text>Total Stock: {totalStock}</Text>
      <Text>Total Capacity: {totalCapacity}</Text>
      <Text>Utilization: {utilization}%</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${utilization}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 220,
    backgroundColor: "#ffffffee",
    padding: 15,
    borderRadius: 12,
    elevation: 8,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#2ecc71",
    borderRadius: 4,
  },
});
