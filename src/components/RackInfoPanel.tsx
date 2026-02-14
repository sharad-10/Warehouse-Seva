import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function RackInfoPanel() {
  const selectedRack = useWarehouseStore((s) => s.selectedRack);

  const racks = useWarehouseStore((s) => s.racks) || [];

  const addStock = useWarehouseStore((s) => s.addStock);

  const removeStock = useWarehouseStore((s) => s.removeStock);

  const updateBagsPerLevel = useWarehouseStore((s) => s.updateBagsPerLevel);

  const deleteRack = useWarehouseStore((s) => s.deleteRack);

  const [collapsed, setCollapsed] = React.useState(false);

  if (!selectedRack) return null;

  const rack = racks.find((r) => r.id === selectedRack);
  if (!rack) return null;

  const levels = Math.ceil(rack.stock / rack.bagsPerLevel);

  return (
    <View style={styles.panel}>
      {/* Header */}
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
        <Text style={styles.title}>
          Rack: {rack.id} {collapsed ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text>Stock: {rack.stock}</Text>
          <Text>Bags / Level: {rack.bagsPerLevel}</Text>
          <Text>Levels Used: {levels}</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => addStock(rack.id)}
            >
              <Text style={styles.btnText}>Add +</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => removeStock(rack.id)}
            >
              <Text style={styles.btnText}>Remove -</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() =>
                updateBagsPerLevel(rack.id, Math.max(rack.bagsPerLevel - 1, 1))
              }
            >
              <Text>- Bags/Level</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => updateBagsPerLevel(rack.id, rack.bagsPerLevel + 1)}
            >
              <Text>+ Bags/Level</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteRack(rack.id)}
          >
            <Text style={styles.deleteText}>Remove Rack</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: {
    backgroundColor: "#4a90e2",
    padding: 10,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  smallBtn: {
    backgroundColor: "#eeeeee",
    padding: 10,
    borderRadius: 8,
  },
  deleteBtn: {
    marginTop: 15,
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});
