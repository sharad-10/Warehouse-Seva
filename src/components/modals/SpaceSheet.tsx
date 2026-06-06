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
import { Space, SpaceRole } from "@/src/types/index";

type Props = {
  visible: boolean;
  spaces: Space[];
  currentSpaceId: string | null;
  draftName: string;
  setDraftName: (name: string) => void;
  onSelect: (spaceId: string) => void;
  onCreate: () => void;
  onRename: (spaceId: string) => void;
  onDelete: (spaceId: string) => void;
  onClose: () => void;
  userRole: SpaceRole;
};

export default function SpaceSheet({
  visible,
  spaces,
  currentSpaceId,
  draftName,
  setDraftName,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onClose,
  userRole,
}: Props) {
  const isAdmin = userRole === "admin";

  const confirmDelete = (spaceId: string, spaceName: string) => {
    Alert.alert(
      "Delete Space?",
      `"${spaceName}" and all its cards will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(spaceId) },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Spaces</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {spaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏗</Text>
                <Text style={styles.emptyTitle}>No spaces yet</Text>
                <Text style={styles.emptyHint}>Create your first space below to start adding cards.</Text>
              </View>
            ) : (
              <View style={styles.spaceList}>
                {spaces.map((space) => {
                  const isActive = space.id === currentSpaceId;
                  return (
                    <TouchableOpacity
                      key={space.id}
                      style={[styles.spaceRow, isActive && styles.spaceRowActive]}
                      onPress={() => { onSelect(space.id); onClose(); }}
                      activeOpacity={0.7}
                    >
                      {isActive && <View style={styles.activeIndicator} />}
                      <View style={styles.spaceRowContent}>
                        <Text style={[styles.spaceName, isActive && styles.spaceNameActive]}>
                          {space.name}
                        </Text>
                        <Text style={styles.spaceMeta}>
                          {isActive ? "✓ Active" : "Tap to switch"}
                        </Text>
                      </View>
                      {isAdmin && (
                        <View style={styles.rowActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onRename(space.id)}
                          >
                            <Text style={styles.actionBtnText}>✏</Text>
                          </TouchableOpacity>
                          {!isActive && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.actionBtnDanger]}
                              onPress={() => confirmDelete(space.id, space.name)}
                            >
                              <Text style={styles.actionBtnText}>🗑</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.createSection}>
              <Text style={styles.createLabel}>Create New Space</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Space name (e.g. Godown A, My Shop)"
                placeholderTextColor="#9E9E9E"
                returnKeyType="done"
                onSubmitEditing={() => { Keyboard.dismiss(); onCreate(); }}
              />
              <TouchableOpacity
                style={[styles.createBtn, !draftName.trim() && styles.createBtnDisabled]}
                onPress={() => { Keyboard.dismiss(); onCreate(); }}
                disabled={!draftName.trim()}
              >
                <Text style={styles.createBtnText}>Create Space</Text>
              </TouchableOpacity>
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingBottom: 28,
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
    borderBottomColor: "#F0F0F0",
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
  scroll: {
    flexShrink: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  emptyHint: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
  },
  spaceList: {
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  spaceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  spaceRowActive: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  activeIndicator: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#2196F3",
  },
  spaceRowContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
  },
  spaceNameActive: {
    color: "#1565C0",
    fontWeight: "700",
  },
  spaceMeta: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 12,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDanger: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  actionBtnText: {
    fontSize: 14,
  },
  createSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  createLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#212121",
  },
  createBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  createBtnDisabled: {
    backgroundColor: "#BDBDBD",
  },
  createBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
