import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function RackInfoPanel() {
  const { selectedRack, racks, addStock, removeStock } = useWarehouseStore();

  if (!selectedRack) return null;

  const rack = racks[selectedRack];
  const stock = rack?.stock || 0;
  const capacity = rack?.capacity || 20;

  const percent = Math.round((stock / capacity) * 100);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Rack: {selectedRack}</Text>

      <Text style={styles.stock}>
        Stock: {stock} / {capacity}
      </Text>

      <Text style={styles.percent}>Utilization: {percent}%</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => addStock(selectedRack)}
        >
          <Text style={styles.btnText}>Add +</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => removeStock(selectedRack)}
        >
          <Text style={styles.btnText}>Remove -</Text>
        </TouchableOpacity>
      </View>
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
  },
  stock: {
    fontSize: 16,
    marginVertical: 10,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  percent: {
    fontSize: 14,
    marginBottom: 10,
  },
});
