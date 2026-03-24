import { updateProfile, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "@/src/firebase/config";

type Props = {
  visible: boolean;
  firebaseUser: User | null;
  nameInput: string;
  setNameInput: (value: string) => void;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  onLogout: () => void;
  onClose: () => void;
};

export default function ProfileModal({
  visible,
  firebaseUser,
  nameInput,
  setNameInput,
  phoneInput,
  setPhoneInput,
  onLogout,
  onClose,
}: Props) {
  const handleSave = async () => {
    if (!firebaseUser) return;

    try {
      await updateProfile(firebaseUser, {
        displayName: nameInput.trim(),
      });

      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          phone: phoneInput.trim(),
          displayName: nameInput.trim(),
        },
        { merge: true },
      );

      alert("Profile updated");
      onClose();
    } catch (error) {
      console.log(error);
      alert("Failed to update profile");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>My Profile</Text>

          <Text style={styles.caption}>{firebaseUser?.email ?? "No email available"}</Text>

          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Display Name"
          />

          <TextInput
            style={styles.input}
            value={phoneInput}
            onChangeText={setPhoneInput}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.btn} onPress={handleSave}>
            <Text style={styles.btnText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    width: "88%",
    backgroundColor: "#fffdf7",
    padding: 20,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  caption: {
    color: "#666",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#F4B400",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: {
    fontWeight: "700",
    color: "#2E2300",
  },
  logoutBtn: {
    backgroundColor: "#FFF0ED",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutText: {
    color: "#B13A1D",
    fontWeight: "700",
  },
  closeText: {
    textAlign: "center",
    color: "#555",
  },
});
