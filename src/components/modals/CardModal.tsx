import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, CardField, FieldType } from "@/src/types/index";

const FIELD_ICONS: Record<FieldType, string> = {
  text: "📝",
  number: "🔢",
  currency: "💰",
  date: "📅",
  datetime: "🕐",
  alert: "🔔",
};

type FieldOption = { type: FieldType; icon: string; label: string; desc: string };
// "alert" removed — expiry alerts are auto-detected from date fields named with "expiry"
const FIELD_OPTIONS: FieldOption[] = [
  { type: "text",     icon: "📝", label: "Text",       desc: "Any text" },
  { type: "number",   icon: "🔢", label: "Number",     desc: "Numeric" },
  { type: "currency", icon: "💰", label: "Currency",   desc: "₹ Amount" },
  { type: "date",     icon: "📅", label: "Date",       desc: "Calendar" },
  { type: "datetime", icon: "🕐", label: "Date & Time",desc: "With time" },
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Props = {
  visible: boolean;
  editingCard: Card | null;
  spaceName: string;
  onSave: (name: string, fields: CardField[]) => void;
  onDelete?: () => void;
  onClose: () => void;
};

type Screen = "card" | "pick-type" | "pick-label";

export default function CardModal({ visible, editingCard, spaceName, onSave, onDelete, onClose }: Props) {
  const [screen, setScreen] = React.useState<Screen>("card");
  const [cardName, setCardName] = React.useState("");
  const [fields, setFields] = React.useState<CardField[]>([]);
  const [pickedType, setPickedType] = React.useState<FieldType | null>(null);
  const [newLabel, setNewLabel] = React.useState("");
  const [datePickerFieldId, setDatePickerFieldId] = React.useState<string | null>(null);
  const [tempDate, setTempDate] = React.useState<Date>(new Date());

  React.useEffect(() => {
    if (visible) {
      setScreen("card");
      setCardName(editingCard?.name ?? "");
      setFields(editingCard?.fields ? [...editingCard.fields] : []);
      setPickedType(null);
      setNewLabel("");
    }
  }, [visible, editingCard]);

  const handleUpdateFieldValue = (fieldId: string, value: string | null) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  const handleDeleteField = (fieldId: string) => {
    Alert.alert("Remove Field", "Delete this field?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setFields((prev) => prev.filter((f) => f.id !== fieldId)) },
    ]);
  };

  const handleConfirmField = () => {
    if (!pickedType || !newLabel.trim()) return;
    setFields((prev) => [...prev, { id: generateId(), label: newLabel.trim(), type: pickedType, value: null }]);
    setPickedType(null);
    setNewLabel("");
    setScreen("card");
  };

  const handleSave = () => {
    const trimmedName = cardName.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a card name.");
      return;
    }
    Keyboard.dismiss();
    onSave(trimmedName, fields);
  };

  const activeDateField = datePickerFieldId ? fields.find((f) => f.id === datePickerFieldId) ?? null : null;

  const renderFieldInput = (field: CardField) => {
    if (field.type === "text") {
      return (
        <TextInput
          style={styles.fieldInput}
          value={field.value ?? ""}
          onChangeText={(v) => handleUpdateFieldValue(field.id, v)}
          placeholder="Enter value"
          placeholderTextColor="#BDBDBD"
        />
      );
    }
    if (field.type === "number" || field.type === "currency") {
      return (
        <TextInput
          style={styles.fieldInput}
          value={field.value ?? ""}
          onChangeText={(v) => handleUpdateFieldValue(field.id, v)}
          placeholder={field.type === "currency" ? "0.00" : "0"}
          placeholderTextColor="#BDBDBD"
          keyboardType="numeric"
        />
      );
    }
    if (field.type === "date" || field.type === "datetime" || field.type === "alert") {
      return (
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => {
            setTempDate(field.value ? new Date(field.value) : new Date());
            setDatePickerFieldId(field.id);
          }}
        >
          <Text style={field.value ? styles.dateValue : styles.datePlaceholder}>
            {field.value
              ? new Date(field.value).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: field.type === "date" ? undefined : "short",
                })
              : "Tap to set date"}
          </Text>
          <Text style={styles.dateChevron}>›</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderCardScreen = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Card name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CARD NAME</Text>
        <TextInput
          style={styles.cardNameInput}
          value={cardName}
          onChangeText={setCardName}
          placeholder="e.g. Tenant A, Shelf 1..."
          placeholderTextColor="#BDBDBD"
          returnKeyType="next"
        />
      </View>

      {/* Fields */}
      {fields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIELDS</Text>
          {fields.map((field) => (
            <View key={field.id} style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldIcon}>{FIELD_ICONS[field.type]}</Text>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TouchableOpacity style={styles.fieldDeleteBtn} onPress={() => handleDeleteField(field.id)}>
                  <Text style={styles.fieldDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
              {renderFieldInput(field)}
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addFieldBtn}
        onPress={() => { Keyboard.dismiss(); setScreen("pick-type"); }}
      >
        <Text style={styles.addFieldBtnText}>+ Add Field</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{editingCard ? "Save Changes" : "Create Card"}</Text>
      </TouchableOpacity>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            Alert.alert("Delete Card", `Remove "${cardName}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: onDelete },
            ]);
          }}
        >
          <Text style={styles.deleteBtnText}>Delete Card</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderPickTypeScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>SELECT FIELD TYPE</Text>
      <View style={styles.optionsGrid}>
        {FIELD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.type}
            style={[styles.optionCard, pickedType === opt.type && styles.optionCardSelected]}
            onPress={() => { setPickedType(opt.type); setScreen("pick-label"); }}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, pickedType === opt.type && styles.optionLabelSelected]}>{opt.label}</Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPickLabelScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.selectedTypeRow}>
        <Text style={styles.selectedTypeIcon}>{FIELD_OPTIONS.find((o) => o.type === pickedType)?.icon}</Text>
        <Text style={styles.selectedTypeLabel}>{FIELD_OPTIONS.find((o) => o.type === pickedType)?.label} Field</Text>
      </View>

      <Text style={styles.sectionTitle}>FIELD LABEL</Text>
      {(pickedType === "date" || pickedType === "datetime") && (
        <View style={styles.autoAlertHint}>
          <Text style={styles.autoAlertHintText}>
            💡 Name it "Expiry Date" to get automatic expiry alerts
          </Text>
        </View>
      )}
      <TextInput
        style={styles.cardNameInput}
        value={newLabel}
        onChangeText={setNewLabel}
        placeholder={
          pickedType === "currency" ? "e.g. Monthly Rent"
          : pickedType === "number" ? "e.g. Quantity"
          : pickedType === "date" ? "e.g. Expiry Date, Date of Arrival"
          : pickedType === "datetime" ? "e.g. Expiry Date & Time"
          : "e.g. Owner Name"
        }
        placeholderTextColor="#BDBDBD"
        returnKeyType="done"
        onSubmitEditing={handleConfirmField}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.saveBtn, !newLabel.trim() && styles.saveBtnDisabled]}
        onPress={handleConfirmField}
        disabled={!newLabel.trim()}
      >
        <Text style={styles.saveBtnText}>Add Field</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const headerTitle =
    screen === "pick-type" ? "Choose Field Type"
    : screen === "pick-label" ? "Name Your Field"
    : editingCard ? "Edit Card" : "New Card";

  const handleBackOrClose = () => {
    if (screen === "pick-label") { setScreen("pick-type"); return; }
    if (screen === "pick-type") { setScreen("card"); return; }
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={handleBackOrClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              {screen === "card" && <Text style={styles.headerSub}>{spaceName}</Text>}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleBackOrClose}>
              <Text style={styles.closeBtnText}>{screen === "card" ? "✕" : "‹"}</Text>
            </TouchableOpacity>
          </View>

          {screen === "card" && renderCardScreen()}
          {screen === "pick-type" && renderPickTypeScreen()}
          {screen === "pick-label" && renderPickLabelScreen()}

          {/* Date picker overlay — inside the modal so it renders above the sheet */}
          {activeDateField && (
            <View style={styles.dateOverlay}>
              <View style={styles.dateOverlayToolbar}>
                <TouchableOpacity
                  onPress={() => setDatePickerFieldId(null)}
                  style={styles.dateOverlayBtn}
                >
                  <Text style={styles.dateOverlayCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.dateOverlayTitle} numberOfLines={1}>
                  {activeDateField.label}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleUpdateFieldValue(activeDateField.id, tempDate.toISOString());
                    setDatePickerFieldId(null);
                  }}
                  style={styles.dateOverlayBtn}
                >
                  <Text style={styles.dateOverlayDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={activeDateField.type === "date" ? "date" : "datetime"}
                display="spinner"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) setTempDate(selectedDate);
                }}
                style={styles.datePicker}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F5F7FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#BDBDBD",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A237E",
  },
  headerSub: {
    fontSize: 12,
    color: "#757575",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeBtnText: {
    fontSize: 16,
    color: "#616161",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 1,
  },
  cardNameInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#212121",
    fontWeight: "600",
  },
  fieldRow: {
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldIcon: {
    fontSize: 15,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
  },
  fieldDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldDeleteText: {
    fontSize: 10,
    color: "#C62828",
    fontWeight: "700",
  },
  fieldInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#212121",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateValue: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
  },
  datePlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#BDBDBD",
  },
  dateChevron: {
    fontSize: 20,
    color: "#BDBDBD",
  },
  addFieldBtn: {
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  addFieldBtnText: {
    color: "#1565C0",
    fontWeight: "700",
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#BDBDBD",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 15,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  optionCardSelected: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#424242",
    textAlign: "center",
  },
  optionLabelSelected: {
    color: "#1565C0",
  },
  optionDesc: {
    fontSize: 10,
    color: "#9E9E9E",
    textAlign: "center",
  },
  dateOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8ECF4",
    paddingBottom: 24,
  },
  dateOverlayToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateOverlayBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 60,
  },
  dateOverlayCancelText: {
    fontSize: 15,
    color: "#757575",
    fontWeight: "500",
  },
  dateOverlayDoneText: {
    fontSize: 15,
    color: "#2196F3",
    fontWeight: "700",
    textAlign: "right",
  },
  dateOverlayTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A237E",
    textAlign: "center",
    marginHorizontal: 8,
  },
  datePicker: {
    width: "100%",
  },
  autoAlertHint: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  autoAlertHintText: {
    fontSize: 12,
    color: "#F57F17",
    fontWeight: "600",
    lineHeight: 17,
  },
  selectedTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    padding: 14,
  },
  selectedTypeIcon: {
    fontSize: 24,
  },
  selectedTypeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1565C0",
  },
});
