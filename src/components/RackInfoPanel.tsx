import DateTimePicker from "@react-native-community/datetimepicker";
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
  const updateRackDetails = useWarehouseStore((s) => s.updateRackDetails);

  const addStock = useWarehouseStore((s) => s.addStock);
  const removeStock = useWarehouseStore((s) => s.removeStock);
  const updateBagsPerLevel = useWarehouseStore((s) => s.updateBagsPerLevel);
  const deleteRack = useWarehouseStore((s) => s.deleteRack);
  const updateRackSize = useWarehouseStore((s) => s.updateRackSize);

  const editMode = useWarehouseStore((s) => s.editMode);

  const [collapsed, setCollapsed] = React.useState(false);
  const [showEntryPicker, setShowEntryPicker] = React.useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = React.useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  if (!selectedRack) return null;

  const rack = racks.find((r) => r.id === selectedRack);
  if (!rack) return null;

  const levels = Math.ceil(rack.stock / rack.bagsPerLevel);

  const width = rack.width ?? 1.5;
  const depth = rack.depth ?? 1;

  return (
    <View style={styles.panel}>
      {/* ================= HEADER ================= */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Text style={styles.collapseText}>{collapsed ? "▼" : "▲"}</Text>
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          <Text style={styles.label}>Rack Name</Text>
          <TextInput
            style={styles.input}
            value={rack.name}
            onChangeText={(text) => updateRackName(rack.id, text.trimStart())}
            placeholder="Enter rack name"
            maxLength={25}
          />
        </View>
      </View>

      {!collapsed && (
        <>
          {/* ================= DETAILS ================= */}
          <View style={styles.field}>
            <Text style={styles.label}>Entry Date</Text>

            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEntryPicker(true)}
            >
              <Text>{rack.entryDate || "Select Date"}</Text>
            </TouchableOpacity>

            {showEntryPicker && (
              <DateTimePicker
                value={rack.entryDate ? new Date(rack.entryDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEntryPicker(false);

                  if (event.type === "set" && selectedDate) {
                    updateRackDetails(rack.id, {
                      entryDate: formatDate(selectedDate),
                    });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Expiry Date</Text>

            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowExpiryPicker(true)}
            >
              <Text>{rack.expiryDate || "Select Date"}</Text>
            </TouchableOpacity>

            {showExpiryPicker && (
              <DateTimePicker
                value={rack.expiryDate ? new Date(rack.expiryDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowExpiryPicker(false);

                  if (event.type === "set" && selectedDate) {
                    updateRackDetails(rack.id, {
                      expiryDate: formatDate(selectedDate),
                    });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Rate (₹ per bag)</Text>
            <TextInput
              style={styles.input}
              value={rack.rate?.toString() || ""}
              keyboardType="numeric"
              onChangeText={(text) =>
                updateRackDetails(rack.id, {
                  rate: Number(text) || 0,
                })
              }
              placeholder="0"
            />
          </View>

          <View style={styles.divider} />

          {/* ================= STOCK ================= */}
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

          {/* ================= SIZE (EDIT MODE ONLY) ================= */}
          {editMode && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Rack Size</Text>

              <Text>Width: {width.toFixed(1)}</Text>
              <Text>Depth: {depth.toFixed(1)}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRackSize(rack.id, width - 0.5, depth)}
                >
                  <Text>- Width</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRackSize(rack.id, width + 0.5, depth)}
                >
                  <Text>+ Width</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRackSize(rack.id, width, depth - 0.5)}
                >
                  <Text>- Depth</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRackSize(rack.id, width, depth + 0.5)}
                >
                  <Text>+ Depth</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ================= DELETE ================= */}
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
    color: "#666",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fafafa",
  },

  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fafafa",
  },

  field: {
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 6,
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
