import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, CardField, FieldType, Space, SpaceRole } from "@/src/types/index";
import { AlertPreview } from "@/src/utils/cardAlerts";

const FIELD_ICONS: Record<FieldType, string> = {
  text: "📝",
  number: "🔢",
  currency: "💰",
  date: "📅",
  datetime: "🕐",
  alert: "🔔",
};

function formatFieldValue(field: CardField): string {
  if (!field.value) return "—";
  if (field.type === "currency") return `₹ ${field.value}`;
  if (field.type === "date" || field.type === "datetime" || field.type === "alert") {
    const date = new Date(field.value);
    if (isNaN(date.getTime())) return field.value;
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  }
  return field.value;
}

function CardPreview({ card, onPress }: { card: Card; onPress: () => void }) {
  const previewFields = card.fields.slice(0, 3);
  const hasAlert = card.fields.some((f) => f.type === "alert" && f.value);

  return (
    <TouchableOpacity style={styles.cardPreview} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardPreviewHeader}>
        <Text style={styles.cardPreviewName} numberOfLines={1}>{card.name}</Text>
        {hasAlert && <Text style={styles.alertBadge}>🔔</Text>}
      </View>
      {previewFields.map((field) => (
        <View key={field.id} style={styles.cardPreviewRow}>
          <Text style={styles.cardPreviewIcon}>{FIELD_ICONS[field.type]}</Text>
          <Text style={styles.cardPreviewLabel} numberOfLines={1}>{field.label}</Text>
          <Text style={styles.cardPreviewValue} numberOfLines={1}>{formatFieldValue(field)}</Text>
        </View>
      ))}
      {card.fields.length === 0 && (
        <Text style={styles.noFieldsText}>No fields yet</Text>
      )}
    </TouchableOpacity>
  );
}

type Props = {
  spaces: Space[];
  cards: Card[];
  alerts: AlertPreview[];
  membersCount: number;
  selectedSpaceId: string | null;
  role: SpaceRole;
  onSelectSpace: (id: string) => void;
  onOpenSpaceSheet: () => void;
  onOpenCard: (card: Card) => void;
  onCreateCard: () => void;
  onOpenAlerts: () => void;
  onOpenStaff: () => void;
};

export default function HomeTab({
  spaces,
  cards,
  alerts,
  membersCount,
  selectedSpaceId,
  role,
  onSelectSpace,
  onOpenSpaceSheet,
  onOpenCard,
  onCreateCard,
  onOpenAlerts,
  onOpenStaff,
}: Props) {
  const canEdit = role === "admin" || role === "edit";
  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) ?? null;

  if (spaces.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyScreenIcon}>🏗</Text>
        <Text style={styles.emptyScreenTitle}>No spaces yet</Text>
        <Text style={styles.emptyScreenHint}>
          Tap the button below to create your first space.
        </Text>
        <TouchableOpacity style={styles.emptyCreateBtn} onPress={onOpenSpaceSheet}>
          <Text style={styles.emptyCreateBtnText}>Create a Space</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Space selector chips */}
      <View style={styles.spaceBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spaceChips}>
          {spaces.map((space) => {
            const isActive = space.id === selectedSpaceId;
            return (
              <TouchableOpacity
                key={space.id}
                style={[styles.spaceChip, isActive && styles.spaceChipActive]}
                onPress={() => onSelectSpace(space.id)}
              >
                <Text style={[styles.spaceChipText, isActive && styles.spaceChipTextActive]}>
                  {space.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.manageSpaceChip} onPress={onOpenSpaceSheet}>
            <Text style={styles.manageSpaceChipText}>⚙</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {!selectedSpace ? (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>Select a space above to view cards</Text>
        </View>
      ) : (
        <>
          {/* Stats strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{cards.length}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>

            <View style={styles.statDivider} />

            <TouchableOpacity style={styles.statItem} onPress={onOpenAlerts}>
              <Text style={styles.statIcon}>🔔</Text>
              <Text style={[styles.statValue, alerts.length > 0 && styles.statValueAlert]}>
                {alerts.length}
              </Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={role === "admin" ? onOpenStaff : undefined}
            >
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{membersCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardsHeader}>
            <Text style={styles.cardsTitle}>
              {selectedSpace.name} · {cards.length} {cards.length === 1 ? "card" : "cards"}
            </Text>
            {canEdit && (
              <TouchableOpacity style={styles.addCardBtn} onPress={onCreateCard}>
                <Text style={styles.addCardBtnText}>+ Add Card</Text>
              </TouchableOpacity>
            )}
          </View>

          {cards.length === 0 ? (
            <View style={styles.emptyCards}>
              <Text style={styles.emptyCardsIcon}>🗂</Text>
              <Text style={styles.emptyCardsTitle}>No cards yet</Text>
              {canEdit && (
                <Text style={styles.emptyCardsHint}>Tap "+ Add Card" to get started.</Text>
              )}
            </View>
          ) : (
            <FlatList
              data={cards}
              keyExtractor={(c) => c.id}
              numColumns={2}
              contentContainerStyle={styles.cardsGrid}
              columnWrapperStyle={styles.cardRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <CardPreview card={item} onPress={() => onOpenCard(item)} />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  spaceBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
    paddingVertical: 10,
  },
  spaceChips: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  spaceChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  spaceChipActive: {
    backgroundColor: "#1A237E",
    borderColor: "#1A237E",
  },
  spaceChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#616161",
  },
  spaceChipTextActive: {
    color: "#FFFFFF",
  },
  manageSpaceChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  manageSpaceChipText: {
    fontSize: 16,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E8ECF4",
    marginVertical: 4,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A237E",
  },
  statValueAlert: {
    color: "#F44336",
  },
  statLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  cardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#424242",
  },
  addCardBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addCardBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  cardsGrid: {
    padding: 10,
    paddingBottom: 24,
  },
  cardRow: {
    gap: 10,
    marginBottom: 10,
  },
  cardPreview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 14,
    gap: 6,
    minHeight: 120,
  },
  cardPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardPreviewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A237E",
  },
  alertBadge: {
    fontSize: 14,
  },
  cardPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardPreviewIcon: {
    fontSize: 12,
    flexShrink: 0,
  },
  cardPreviewLabel: {
    fontSize: 11,
    color: "#757575",
    flex: 1,
  },
  cardPreviewValue: {
    fontSize: 11,
    color: "#212121",
    fontWeight: "600",
    flexShrink: 0,
    maxWidth: "45%",
    textAlign: "right",
  },
  noFieldsText: {
    fontSize: 12,
    color: "#BDBDBD",
    fontStyle: "italic",
  },
  noSelectionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  noSelectionText: {
    fontSize: 15,
    color: "#9E9E9E",
    textAlign: "center",
  },
  emptyCards: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  emptyCardsIcon: {
    fontSize: 48,
  },
  emptyCardsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#757575",
  },
  emptyCardsHint: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  emptyScreenIcon: {
    fontSize: 56,
  },
  emptyScreenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#424242",
  },
  emptyScreenHint: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCreateBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
