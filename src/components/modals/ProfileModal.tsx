import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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

import { db } from "@/src/firebase/config";
import { SpaceRole } from "@/src/types/index";

type Props = {
  visible: boolean;
  firebaseUser: User | null;
  nameInput: string;
  setNameInput: (value: string) => void;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  userRole: SpaceRole;
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
  userRole,
  onLogout,
  onClose,
}: Props) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);

  const username = React.useMemo(() => {
    const email = firebaseUser?.email ?? "";
    return email.replace(/@warehouseseva\.app$/, "").replace(/@staff\.warehouseseva\.app$/, "");
  }, [firebaseUser]);

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  React.useEffect(() => {
    if (!visible) resetPasswordFields();
  }, [visible]);

  const handleSave = async () => {
    if (!firebaseUser) return;
    try {
      await updateProfile(firebaseUser, { displayName: nameInput.trim() });
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { phone: phoneInput.trim(), displayName: nameInput.trim() },
        { merge: true },
      );
      Alert.alert("Saved", "Profile updated successfully.");
      onClose();
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser?.email) return;

    if (!currentPassword) {
      Alert.alert("Required", "Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Too short", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      resetPasswordFields();
      Alert.alert("Done", "Password changed successfully.");
    } catch (err: any) {
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        Alert.alert("Wrong password", "Current password is incorrect.");
      } else {
        Alert.alert("Error", err?.message ?? "Could not change password.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Username display */}
            <View style={styles.usernameRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(username[0] ?? "U").toUpperCase()}
                </Text>
              </View>
              <View style={styles.usernameContent}>
                <Text style={styles.usernameLabel}>USERNAME</Text>
                <Text style={styles.usernameValue}>@{username}</Text>
                <View style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{userRole.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Profile info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PROFILE INFO</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your display name"
                  placeholderTextColor="#BDBDBD"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Your phone number"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => { Keyboard.dismiss(); void handleSave(); }}
            >
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>

            {/* Password change — admin only */}
            {userRole === "admin" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CHANGE PASSWORD</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#BDBDBD"
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#BDBDBD"
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat new password"
                    placeholderTextColor="#BDBDBD"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.changePasswordBtn, changingPassword && styles.btnDisabled]}
                  onPress={() => { Keyboard.dismiss(); void handleChangePassword(); }}
                  disabled={changingPassword}
                >
                  <Text style={styles.changePasswordBtnText}>
                    {changingPassword ? "Changing…" : "Change Password"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: "90%",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A237E",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#616161",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1A237E",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  usernameContent: {
    flex: 1,
    gap: 4,
  },
  usernameLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 1,
  },
  usernameValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  roleChip: {
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1565C0",
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: "#212121",
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
  changePasswordBtn: {
    backgroundColor: "#1A237E",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  changePasswordBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  logoutBtn: {
    backgroundColor: "#FFEBEE",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 15,
  },
});
