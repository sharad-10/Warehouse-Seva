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

type Props = {
  racks: any[];
  selectedRackId: string | null;
  updateRack: (id: string, data: any) => void;
  deleteRack: (id: string) => void;
  editMode: boolean;
};

export default function RackInfoPanel({
  racks,
  selectedRackId,
  updateRack,
  deleteRack,
  editMode,
}: Props) {
  const [collapsed, setCollapsed] = React.useState(true);
  const [showEntryPicker, setShowEntryPicker] = React.useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = React.useState(false);
  const [stockInput, setStockInput] = React.useState("");

  const rack = racks.find((r) => r.id === selectedRackId);

  React.useEffect(() => {
    if (rack) {
      setStockInput(rack.stock?.toString() || "0");
    }
  }, [rack?.stock]);

  if (!selectedRackId || !rack) return null;

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const levels = Math.ceil(rack.stock / rack.bagsPerLevel);
  const width = rack.width ?? 1.5;
  const depth = rack.depth ?? 1;

  const totalValue = rack.stock * (rack.rate || 0);

  const today = new Date();
  const expiryDate = rack.expiryDate ? new Date(rack.expiryDate) : null;

  let daysToExpiry: number | null = null;
  let isNearExpiry = false;
  let isExpired = false;

  if (expiryDate) {
    const diff = expiryDate.getTime() - today.getTime();
    daysToExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysToExpiry < 0) isExpired = true;
    else if (daysToExpiry <= 7) isNearExpiry = true;
  }

  return (
    <View style={styles.panel}>
      {/* HEADER */}
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
            onChangeText={(text) =>
              updateRack(rack.id, { name: text.trimStart() })
            }
            placeholder="Enter rack name"
          />
        </View>
      </View>

      {!collapsed && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {editMode ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Rack Size</Text>

              <Text>Width: {width.toFixed(1)}</Text>
              <Text>Depth: {depth.toFixed(1)}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRack(rack.id, { width: width - 0.5 })}
                >
                  <Text>- Width</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRack(rack.id, { width: width + 0.5 })}
                >
                  <Text>+ Width</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRack(rack.id, { depth: depth - 0.5 })}
                >
                  <Text>- Depth</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => updateRack(rack.id, { depth: depth + 0.5 })}
                >
                  <Text>+ Depth</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Details</Text>

              {/* ENTRY DATE */}
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
                    value={
                      rack.entryDate ? new Date(rack.entryDate) : new Date()
                    }
                    mode="date"
                    onChange={(e, date) => {
                      setShowEntryPicker(false);
                      if (date) {
                        updateRack(rack.id, {
                          entryDate: formatDate(date),
                        });
                      }
                    }}
                  />
                )}
              </View>

              {/* EXPIRY DATE */}
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
                    value={
                      rack.expiryDate ? new Date(rack.expiryDate) : new Date()
                    }
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(e, date) => {
                      setShowExpiryPicker(false);
                      if (date) {
                        updateRack(rack.id, {
                          expiryDate: formatDate(date),
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.divider} />

              {/* STOCK */}
              <Text style={styles.sectionTitle}>Stock</Text>

              <Text>Current Stock: {rack.stock}</Text>
              <Text>Total Value: ₹ {totalValue.toFixed(2)}</Text>
              <Text>Bags / Level: {rack.bagsPerLevel}</Text>
              <Text>Levels Used: {levels}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Set Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={stockInput}
                  onChangeText={setStockInput}
                  placeholder="Enter quantity"
                />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  const newValue = Number(stockInput);
                  if (!isNaN(newValue) && newValue >= 0) {
                    updateRack(rack.id, { stock: newValue });
                  }
                }}
              >
                <Text style={styles.btnText}>Update Stock</Text>
              </TouchableOpacity>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRack(rack.id, {
                      bagsPerLevel: Math.max(rack.bagsPerLevel - 1, 1),
                    })
                  }
                >
                  <Text>- Bags / Level</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    updateRack(rack.id, {
                      bagsPerLevel: rack.bagsPerLevel + 1,
                    })
                  }
                >
                  <Text>+ Bags / Level</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteRack(rack.id)}
              >
                <Text style={styles.deleteText}>Remove Rack</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFFDF7",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F2E6B3",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  collapseBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF4CC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  collapseText: { fontWeight: "bold" },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#F2E6B3",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  field: { marginTop: 12 },
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
    backgroundColor: "#F4B400",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  smallBtn: {
    backgroundColor: "#FFF4CC",
    padding: 10,
    borderRadius: 10,
  },
  deleteBtn: {
    backgroundColor: "#D84315",
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
