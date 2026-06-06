import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Card, Space, SpaceRole } from "@/src/types/index";
import { AlertPreview } from "@/src/utils/cardAlerts";

type Props = {
  visible: boolean;
  space: Space | null;
  cards: Card[];
  alerts: AlertPreview[];
  userRole: SpaceRole;
  onOpenProfile: () => void;
  onOpenStaff: () => void;
  onClose: () => void;
};

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function SettingsModal({
  visible,
  space,
  cards,
  alerts,
  userRole,
  onOpenProfile,
  onOpenStaff,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Space Overview */}
            <Text style={styles.sectionHeader}>SPACE OVERVIEW</Text>
            <View style={styles.card}>
              {space ? (
                <>
                  <View style={styles.spaceNameRow}>
                    <View style={styles.spaceIcon}>
                      <Text style={styles.spaceIconText}>🏭</Text>
                    </View>
                    <View style={styles.spaceNameContent}>
                      <Text style={styles.spaceNameText}>{space.name}</Text>
                      <Text style={styles.spaceRoleText}>
                        Role: <Text style={styles.roleChip}>{userRole.toUpperCase()}</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <StatRow label="Cards" value={cards.length} />
                  <StatRow label="Active Alerts" value={alerts.length} />
                </>
              ) : (
                <View style={styles.noSpaceRow}>
                  <Text style={styles.noSpaceText}>No space selected</Text>
                  <Text style={styles.noSpaceHint}>
                    Tap the space chip in the header to select or create one.
                  </Text>
                </View>
              )}
            </View>

            {/* Alerts */}
            <Text style={styles.sectionHeader}>ALERTS</Text>
            <View style={styles.card}>
              {alerts.length === 0 ? (
                <Text style={styles.emptyText}>No active alerts right now.</Text>
              ) : (
                alerts.map((alert) => (
                  <View
                    key={`${alert.cardId}-${alert.fieldId}`}
                    style={[styles.alertRow, alert.isDue && styles.alertRowDue]}
                  >
                    <View style={[styles.alertDot, alert.isDue && styles.alertDotDue]} />
                    <View style={styles.alertContent}>
                      <Text style={[styles.alertName, alert.isDue && styles.alertNameDue]}>
                        {alert.message}
                      </Text>
                      <Text style={styles.alertDate}>
                        {new Date(alert.alertDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Account */}
            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.actionBtn} onPress={onOpenProfile}>
                <View style={styles.actionBtnIcon}><Text>👤</Text></View>
                <Text style={styles.actionBtnText}>My Profile</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </TouchableOpacity>

              {userRole === "admin" && (
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnBordered]} onPress={onOpenStaff}>
                  <View style={styles.actionBtnIcon}><Text>👥</Text></View>
                  <Text style={styles.actionBtnText}>Staff Management</Text>
                  <Text style={styles.actionBtnChevron}>›</Text>
                </TouchableOpacity>
              )}
            </View>
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
    maxHeight: "88%",
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
    gap: 8,
    paddingBottom: 16,
  },
  sectionHeader: {
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
    overflow: "hidden",
  },
  spaceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  spaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  spaceIconText: {
    fontSize: 22,
  },
  spaceNameContent: {
    flex: 1,
    gap: 3,
  },
  spaceNameText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212121",
  },
  spaceRoleText: {
    fontSize: 12,
    color: "#757575",
  },
  roleChip: {
    color: "#1565C0",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  statLabel: {
    fontSize: 14,
    color: "#616161",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
  },
  noSpaceRow: {
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  noSpaceText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9E9E9E",
  },
  noSpaceHint: {
    fontSize: 13,
    color: "#BDBDBD",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    padding: 20,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  alertRowDue: {
    backgroundColor: "#FFF3E0",
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginTop: 5,
    flexShrink: 0,
  },
  alertDotDue: {
    backgroundColor: "#F44336",
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    lineHeight: 18,
  },
  alertNameDue: {
    color: "#C62828",
  },
  alertDate: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionBtnBordered: {
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  actionBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
  },
  actionBtnChevron: {
    fontSize: 22,
    color: "#BDBDBD",
    fontWeight: "300",
  },
});
