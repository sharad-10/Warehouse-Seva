import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { WarehouseMember, WarehouseRole } from "@/src/types/warehouse";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Props = {
  visible: boolean;
  ownerLabel: string;
  members: WarehouseMember[];
  inviteValue: string;
  setInviteValue: (value: string) => void;
  selectedRole: WarehouseRole;
  setSelectedRole: (role: WarehouseRole) => void;
  onInvite: () => void;
  onUpdateRole: (memberId: string, role: WarehouseRole) => void;
  onRemove: (memberId: string) => void;
  onClose: () => void;
};

const ROLE_OPTIONS: WarehouseRole[] = ["edit", "view"];

export default function StaffModal({
  visible,
  ownerLabel,
  members,
  inviteValue,
  setInviteValue,
  selectedRole,
  setSelectedRole,
  onInvite,
  onUpdateRole,
  onRemove,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const helperLabel =
    members.length === 0
      ? t("staff.inviteHelper")
      : `${t("staff.owner")}: ${ownerLabel}`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t("staff.title")}</Text>
          <Text style={styles.helperText}>{helperLabel}</Text>

          <TextInput
            style={styles.input}
            value={inviteValue}
            onChangeText={setInviteValue}
            placeholder={t("staff.invitePlaceholder")}
            autoCapitalize="none"
          />

          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                onPress={() => setSelectedRole(role)}
              >
                <Text style={selectedRole === role ? styles.roleChipTextActive : undefined}>
                  {role === "edit" ? t("staff.edit") : t("staff.view")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={onInvite}>
            <Text style={styles.btnText}>{t("staff.inviteButton")}</Text>
          </TouchableOpacity>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Text style={styles.legendTitle}>{t("staff.edit")}</Text>
              <Text style={styles.legendText}>{t("staff.editDesc")}</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendTitle}>{t("staff.view")}</Text>
              <Text style={styles.legendText}>{t("staff.viewDesc")}</Text>
            </View>
          </View>

          <ScrollView style={styles.list}>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>{t("staff.empty")}</Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {member.username || member.email || member.uid}
                    </Text>
                    <Text style={styles.memberMeta}>{member.email || member.uid}</Text>
                  </View>

                  <View style={styles.memberActions}>
                    {ROLE_OPTIONS.map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[styles.smallBtn, member.role === role && styles.smallBtnActive]}
                        onPress={() => onUpdateRole(member.id, role)}
                      >
                        <Text>{role}</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(member.id)}>
                      <Text style={styles.removeText}>{t("staff.remove")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
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
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  helperText: {
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    backgroundColor: "#F2F2F2",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleChipActive: {
    backgroundColor: "#FFF4CC",
  },
  roleChipTextActive: {
    fontWeight: "700",
  },
  btn: {
    backgroundColor: "#F4B400",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: {
    fontWeight: "700",
    color: "#2E2300",
  },
  list: {
    maxHeight: 320,
  },
  legendRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  legendItem: {
    flex: 1,
    backgroundColor: "#FFF9EC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F2E6B3",
  },
  legendTitle: {
    fontWeight: "700",
    color: "#8B5E00",
    marginBottom: 4,
  },
  legendText: {
    color: "#666",
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    color: "#666",
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  memberName: {
    fontWeight: "700",
  },
  memberMeta: {
    color: "#666",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallBtnActive: {
    backgroundColor: "#FFF4CC",
  },
  removeBtn: {
    backgroundColor: "#FFF0ED",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeText: {
    color: "#B13A1D",
  },
  closeText: {
    textAlign: "center",
    color: "#555",
    marginTop: 14,
  },
});
