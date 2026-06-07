import React from "react";
import {
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

import { SpaceMember, SpaceRole } from "@/src/types/index";

type Props = {
  visible: boolean;
  ownerLabel: string;
  members: SpaceMember[];
  inviteValue: string;
  setInviteValue: (value: string) => void;
  createUsernameValue: string;
  setCreateUsernameValue: (value: string) => void;
  createPasswordValue: string;
  setCreatePasswordValue: (value: string) => void;
  selectedRole: SpaceRole;
  setSelectedRole: (role: SpaceRole) => void;
  onInvite: () => void;
  onCreateStaff: () => void;
  onUpdateRole: (memberId: string, role: SpaceRole) => void;
  onRemove: (memberId: string) => void;
  onClose: () => void;
};

const ROLE_OPTIONS: SpaceRole[] = ["edit", "view"];

export default function StaffModal({
  visible,
  ownerLabel,
  members,
  inviteValue,
  setInviteValue,
  createUsernameValue,
  setCreateUsernameValue,
  createPasswordValue,
  setCreatePasswordValue,
  selectedRole,
  setSelectedRole,
  onInvite,
  onCreateStaff,
  onUpdateRole,
  onRemove,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Staff Management</Text>
              {ownerLabel ? (
                <Text style={styles.headerSub}>Owner: {ownerLabel}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Invite section */}
            <Text style={styles.sectionLabel}>INVITE EXISTING MEMBER</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={inviteValue}
                onChangeText={setInviteValue}
                placeholder="Username or email"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="none"
              />

              {/* Role selector */}
              <View style={styles.roleRow}>
                {ROLE_OPTIONS.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                      {role === "edit" ? "Editor" : "Viewer"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => { Keyboard.dismiss(); onInvite(); }}
              >
                <Text style={styles.primaryBtnText}>Invite Member</Text>
              </TouchableOpacity>
            </View>

            {/* Create staff section */}
            <Text style={styles.sectionLabel}>CREATE NEW STAFF LOGIN</Text>
            <View style={styles.createCard}>
              <Text style={styles.createCardTitle}>Create Staff Login</Text>
              <Text style={styles.createCardHelper}>Creates a managed account that only works within your space.</Text>

              <TextInput
                style={styles.input}
                value={createUsernameValue}
                onChangeText={setCreateUsernameValue}
                placeholder="Staff username"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                value={createPasswordValue}
                onChangeText={setCreatePasswordValue}
                placeholder="Staff password"
                placeholderTextColor="#BDBDBD"
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => { Keyboard.dismiss(); onCreateStaff(); }}
              >
                <Text style={styles.primaryBtnText}>Create Staff Account</Text>
              </TouchableOpacity>
            </View>

            {/* Role legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <Text style={styles.legendTitle}>Editor</Text>
                <Text style={styles.legendText}>Can add and edit cards</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendTitle}>Viewer</Text>
                <Text style={styles.legendText}>Can only view cards</Text>
              </View>
            </View>

            {/* Member list */}
            {members.length === 0 ? (
              <Text style={styles.emptyText}>No members added yet.</Text>
            ) : (
              <>
                <Text style={styles.sectionLabel}>CURRENT MEMBERS</Text>
                <View style={styles.card}>
                  {members.map((member, index) => (
                    <View
                      key={member.id}
                      style={[styles.memberRow, index > 0 && styles.memberRowBordered]}
                    >
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {member.username || member.email || member.uid}
                        </Text>
                        {member.email ? (
                          <Text style={styles.memberMeta}>{member.email}</Text>
                        ) : null}
                      </View>

                      <View style={styles.memberActions}>
                        {ROLE_OPTIONS.map((role) => (
                          <TouchableOpacity
                            key={role}
                            style={[
                              styles.roleBtn,
                              member.role === role && styles.roleBtnActive,
                            ]}
                            onPress={() => onUpdateRole(member.id, role)}
                          >
                            <Text
                              style={[
                                styles.roleBtnText,
                                member.role === role && styles.roleBtnTextActive,
                              ]}
                            >
                              {role}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => onRemove(member.id)}
                        >
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </>
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
    fontSize: 14,
    color: "#616161",
    fontWeight: "700",
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 10,
  },
  createCard: {
    backgroundColor: "#F8F9FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 10,
  },
  createCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A237E",
  },
  createCardHelper: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 17,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: "#212121",
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  roleChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#616161",
  },
  roleChipTextActive: {
    color: "#FFFFFF",
  },
  primaryBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  legendRow: {
    flexDirection: "row",
    gap: 10,
  },
  legendItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    gap: 4,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1565C0",
  },
  legendText: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    paddingVertical: 16,
  },
  memberRow: {
    paddingVertical: 12,
  },
  memberRowBordered: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  memberInfo: {
    marginBottom: 8,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  memberMeta: {
    fontSize: 12,
    color: "#757575",
  },
  memberActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleBtn: {
    backgroundColor: "#F5F7FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  roleBtnActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#90CAF9",
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#757575",
  },
  roleBtnTextActive: {
    color: "#1565C0",
    fontWeight: "700",
  },
  removeBtn: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C62828",
  },
});
