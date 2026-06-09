import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FreeSpace } from "@/src/types/index";

type Props = {
  freeSpaces: FreeSpace[];
  loading: boolean;
  currentUserId: string;
  onPostNew: () => void;
  onEditItem: (item: FreeSpace) => void;
  onDeleteItem: (id: string) => void;
};

type CardProps = {
  item: FreeSpace;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
};

function FreeSpaceCard({ item, currentUserId, onEdit, onDelete }: CardProps) {
  const isOwner = item.ownerId === currentUserId;
  const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        {isOwner && (
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>MY LISTING</Text>
          </View>
        )}
      </View>

      {/* Location */}
      <Text style={styles.cardDetail}>📍 {item.city}{item.address ? ` · ${item.address}` : ""}</Text>

      {/* Space info row */}
      <View style={styles.infoRow}>
        <Text style={styles.cardDetail}>📐 {item.areaSqm} m²</Text>
        {item.goodsTypes ? (
          <Text style={[styles.cardDetail, styles.infoRowRight]} numberOfLines={1}>
            🗂 {item.goodsTypes}
          </Text>
        ) : null}
      </View>

      {/* Contact row */}
      <View style={styles.infoRow}>
        <Text style={styles.cardDetail}>📞 {item.contactPhone}</Text>
        {item.contactEmail ? (
          <Text style={[styles.cardDetail, styles.infoRowRight, styles.emailText]} numberOfLines={1}>
            ✉ {item.contactEmail}
          </Text>
        ) : null}
      </View>

      {/* Notes */}
      {item.notes ? (
        <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
      ) : null}

      {/* Footer */}
      <Text style={styles.postedBy}>Posted by {item.ownerName} · {dateStr}</Text>

      {/* Owner actions */}
      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Text style={styles.editBtnText}>✏ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert("Delete Listing", `Remove "${item.title}"?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
          >
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function FreeSpacesTab({
  freeSpaces,
  loading,
  currentUserId,
  onPostNew,
  onEditItem,
  onDeleteItem,
}: Props) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Free Spaces{freeSpaces.length > 0 ? ` · ${freeSpaces.length}` : ""}
        </Text>
        <TouchableOpacity style={styles.postBtn} onPress={onPostNew}>
          <Text style={styles.postBtnText}>+ Post Space</Text>
        </TouchableOpacity>
      </View>

      {freeSpaces.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏭</Text>
          <Text style={styles.emptyTitle}>No free spaces listed yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to post an available space.</Text>
        </View>
      ) : (
        <FlatList
          data={freeSpaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FreeSpaceCard
              item={item}
              currentUserId={currentUserId}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A237E",
  },
  postBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A237E",
  },
  ownerBadge: {
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#90CAF9",
    flexShrink: 0,
  },
  ownerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1565C0",
    letterSpacing: 0.5,
  },
  cardDetail: {
    fontSize: 13,
    color: "#424242",
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoRowRight: {
    flex: 1,
    textAlign: "right",
  },
  emailText: {
    color: "#616161",
  },
  notesText: {
    fontSize: 13,
    color: "#757575",
    fontStyle: "italic",
    marginTop: 2,
  },
  postedBy: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 4,
  },
  ownerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  editBtn: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  editBtnText: {
    color: "#1565C0",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  deleteBtnText: {
    color: "#C62828",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
  },
});
