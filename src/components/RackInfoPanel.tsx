import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  ScrollView,
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

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  if (!selectedRack) return null;

  const rack = racks.find((r) => r.id === selectedRack);
  if (!rack) return null;

  const levels = Math.ceil(rack.stock / rack.bagsPerLevel);
  const width = rack.width ?? 1.5;
  const depth = rack.depth ?? 1;

  return (
    <View style={styles.panel}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Text style={styles.collapseText}>{collapsed ? "▼" : "▲"}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Rack Name</Text>
          <TextInput
            style={styles.input}
            value={rack.name}
            onChangeText={(text) => updateRackName(rack.id, text.trimStart())}
            placeholder="Enter rack name"
          />
        </View>
      </View>

      {!collapsed && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* DETAILS */}
          <Text style={styles.sectionTitle}>Details</Text>

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
                onChange={(e, date) => {
                  setShowEntryPicker(false);
                  if (date) {
                    updateRackDetails(rack.id, {
                      entryDate: formatDate(date),
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
                minimumDate={new Date()}
                onChange={(e, date) => {
                  setShowExpiryPicker(false);
                  if (date) {
                    updateRackDetails(rack.id, {
                      expiryDate: formatDate(date),
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
              keyboardType="numeric"
              value={rack.rate?.toString() || ""}
              onChangeText={(text) =>
                updateRackDetails(rack.id, {
                  rate: Number(text) || 0,
                })
              }
            />
          </View>

          <View style={styles.divider} />

          {/* STOCK */}
          <Text style={styles.sectionTitle}>Stock</Text>

          <Text>Stock: {rack.stock}</Text>
          <Text>Bags / Level: {rack.bagsPerLevel}</Text>
          <Text>Levels Used: {levels}</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => addStock(rack.id)}
            >
              <Text style={styles.btnText}>+ Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => removeStock(rack.id)}
            >
              <Text style={styles.btnText}>- Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() =>
                updateBagsPerLevel(rack.id, Math.max(rack.bagsPerLevel - 1, 1))
              }
            >
              <Text>- Bags / Level</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => updateBagsPerLevel(rack.id, rack.bagsPerLevel + 1)}
            >
              <Text>+ Bags / Level</Text>
            </TouchableOpacity>
          </View>

          {/* SIZE */}
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

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteRack(rack.id)}
          >
            <Text style={styles.deleteText}>Remove Rack</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 340,
    maxHeight: "75%",
    backgroundColor: "#ffffffee",
    borderRadius: 20,
    padding: 18,
    elevation: 15,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
  },

  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#fafafa",
  },

  field: {
    marginTop: 12,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 15,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  primaryBtn: {
    backgroundColor: "#4a90e2",
    padding: 10,
    borderRadius: 10,
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
  },

  smallBtn: {
    backgroundColor: "#eeeeee",
    padding: 10,
    borderRadius: 10,
  },

  deleteBtn: {
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteText: {
    color: "white",
    fontWeight: "bold",
  },

  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fafafa",
  },
});
