import React from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FreeSpace } from "@/src/types/index";

type Props = {
  visible: boolean;
  editingItem: FreeSpace | null;
  currentUserEmail: string;
  onSave: (data: Omit<FreeSpace, "id" | "ownerId" | "ownerName" | "createdAt">) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export default function FreeSpaceModal({
  visible,
  editingItem,
  currentUserEmail,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [areaSqm, setAreaSqm] = React.useState("");
  const [goodsTypes, setGoodsTypes] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (visible) {
      setTitle(editingItem?.title ?? "");
      setCity(editingItem?.city ?? "");
      setAddress(editingItem?.address ?? "");
      setAreaSqm(editingItem?.areaSqm?.toString() ?? "");
      setGoodsTypes(editingItem?.goodsTypes ?? "");
      setContactPhone(editingItem?.contactPhone ?? "");
      setContactEmail(editingItem?.contactEmail ?? currentUserEmail);
      setNotes(editingItem?.notes ?? "");
    }
  }, [visible, editingItem, currentUserEmail]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a listing title.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Required", "Please enter a city.");
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert("Required", "Please enter a contact phone number.");
      return;
    }
    const parsedArea = parseFloat(areaSqm);
    if (!areaSqm.trim() || isNaN(parsedArea) || parsedArea <= 0) {
      Alert.alert("Required", "Please enter a valid area in square metres.");
      return;
    }
    Keyboard.dismiss();
    onSave({
      title: title.trim(),
      city: city.trim(),
      address: address.trim(),
      areaSqm: parsedArea,
      goodsTypes: goodsTypes.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim() || currentUserEmail,
      notes: notes.trim(),
    });
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                {editingItem ? "Edit Listing" : "Post Free Space"}
              </Text>
              <Text style={styles.headerSub}>
                {editingItem ? "Update your listing details" : "List your available warehouse space"}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Listing Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LISTING DETAILS</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Large dry storage area"
                placeholderTextColor="#BDBDBD"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#BDBDBD"
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                placeholderTextColor="#BDBDBD"
                returnKeyType="next"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Space Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SPACE INFO</Text>
              <TextInput
                style={styles.input}
                value={areaSqm}
                onChangeText={setAreaSqm}
                placeholder="Area in sq. metres (e.g. 500)"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={goodsTypes}
                onChangeText={setGoodsTypes}
                placeholder="Goods types (e.g. FMCG, electronics, textiles)"
                placeholderTextColor="#BDBDBD"
                returnKeyType="next"
              />
            </View>

            {/* Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONTACT</Text>
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Phone number"
                placeholderTextColor="#BDBDBD"
                keyboardType="phone-pad"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Contact email (optional)"
                placeholderTextColor="#BDBDBD"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional info about the space..."
                placeholderTextColor="#BDBDBD"
                multiline
                numberOfLines={3}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>
                {editingItem ? "Save Changes" : "Post Listing"}
              </Text>
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  Alert.alert("Delete Listing", `Remove "${title}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: onDelete },
                  ]);
                }}
              >
                <Text style={styles.deleteBtnText}>Delete Listing</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
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
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#212121",
    fontWeight: "500",
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
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
});
