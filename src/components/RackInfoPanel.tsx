import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useWarehouseStore } from "../store/useWarehouseStore";

export default function RackInfoPanel() {
  const selectedRack = useWarehouseStore((s) => s.selectedRack);
  const racks = useWarehouseStore((s) => s.racks) || [];
  const updateRackName = useWarehouseStore((s) => s.updateRackName);

  const addStock = useWarehouseStore((s) => s.addStock);
  const removeStock = useWarehouseStore((s) => s.removeStock);
  const updateBagsPerLevel = useWarehouseStore((s) => s.updateBagsPerLevel);
  const deleteRack = useWarehouseStore((s) => s.deleteRack);

  // 🔥 NEW
  const updateRackSize = useWarehouseStore((s) => s.updateRackSize);
  const editMode = useWarehouseStore((s) => s.editMode);

  const [collapsed, setCollapsed] = React.useState(false);

  if (!selectedRack) return null;

  const rack = racks.find((r) => r.id === selectedRack);
  if (!rack) return null;

  const levels = Math.ceil(rack.stock / rack.bagsPerLevel);

  const width = rack.width ?? 1.5;
  const depth = rack.depth ?? 1;

  return (
    <View style={styles.panel}>
      {/* Header */}
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
        <View style={styles.headerRow}>
          {/* Collapse Toggle */}
          <TouchableOpacity
            style={styles.collapseBtn}
            onPress={() => setCollapsed(!collapsed)}
          >
            <Text style={styles.collapseText}>{collapsed ? "▼" : "▲"}</Text>
          </TouchableOpacity>

          {/* Name Section */}
          <View style={styles.nameContainer}>
            <Text style={styles.label}>Rack Name</Text>

            <TextInput
              style={styles.nameInput}
              value={rack.name}
              onChangeText={(text) => updateRackName(rack.id, text.trimStart())}
              placeholder="Enter rack name"
              placeholderTextColor="#999"
              maxLength={25}
            />
          </View>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text>Stock: {rack.stock}</Text>
          <Text>Bags / Level: {rack.bagsPerLevel}</Text>
          <Text>Levels Used: {levels}</Text>

          {/* Stock Controls */}
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

          {/* Bags Per Level Controls */}
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

          {/* 🔥 Resize Controls (Only in Edit Mode) */}
          {editMode && (
            <>
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Rack Size</Text>

              <Text>Width: {width.toFixed(1)}</Text>
              <Text>Depth: {depth.toFixed(1)}</Text>

              {/* Width Controls */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRackSize(rack.id, rack.width - 0.5, rack.depth)
                  }
                >
                  <Text>- Width</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRackSize(rack.id, rack.width + 0.5, rack.depth)
                  }
                >
                  <Text>+ Width</Text>
                </TouchableOpacity>
              </View>

              {/* Depth Controls */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRackSize(rack.id, rack.width, rack.depth - 0.5)
                  }
                >
                  <Text>- Depth</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRackSize(rack.id, rack.width, rack.depth + 0.5)
                  }
                >
                  <Text>+ Depth</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Delete Rack */}
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
  sectionTitle: {
    marginTop: 10,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  collapseBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  collapseText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  nameContainer: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },

  nameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
});
