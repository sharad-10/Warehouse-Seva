import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Rack, Warehouse } from "@/src/types/warehouse";

type Props = {
  racks: Rack[];
  warehouse: Warehouse | null;
};

export default function WarehouseStatsPanel({ racks, warehouse }: Props) {
  const [collapsed, setCollapsed] = React.useState(true);

  const totalRacks = racks.length;
  const totalStock = racks.reduce((sum, rack) => sum + (rack.stock || 0), 0);
  const totalStacks = racks.reduce((sum, rack) => {
    const stacks = Math.ceil((rack.stock || 0) / (rack.bagsPerLevel || 1));
    return sum + stacks;
  }, 0);

  const totalRackArea = racks.reduce(
    (sum, rack) => sum + (rack.width || 0) * (rack.depth || 0),
    0,
  );

  const totalSticks = (warehouse?.stickRows || 0) * (warehouse?.stickCols || 0);
  const singleStickArea = (warehouse?.stickWidth || 0) * (warehouse?.stickLength || 0);
  const warehouseArea = totalSticks * singleStickArea;
  const usagePercent =
    warehouseArea === 0 ? 0 : Number(((totalRackArea / warehouseArea) * 100).toFixed(1));

  return (
    <View style={styles.panel}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
        <Text style={styles.title}>Warehouse Overview {collapsed ? "▼" : "▲"}</Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text>Total Sticks: {totalSticks}</Text>
          <Text>Total Racks: {totalRacks}</Text>
          <Text>Total Stock: {totalStock}</Text>
          <Text>Total Stacks: {totalStacks}</Text>

          <View style={styles.divider} />

          <Text>
            Stick Size: {warehouse?.stickWidth ?? 0} ft x {warehouse?.stickLength ?? 0} ft
          </Text>
          <Text>Warehouse Area: {warehouseArea.toFixed(0)} sq ft</Text>
          <Text>Rack Footprint: {totalRackArea.toFixed(0)} sq ft</Text>
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
