import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "@/src/types/index";
import { AlertPreview, formatAlertDate, getAlertPreviews } from "@/src/utils/cardAlerts";

function AlertRow({ preview }: { preview: AlertPreview }) {
  return (
    <View style={[styles.alertRow, preview.isDue && styles.alertRowDue]}>
      <View style={[styles.alertDot, preview.isDue && styles.alertDotDue]} />
      <View style={styles.alertContent}>
        <Text style={[styles.alertMessage, preview.isDue && styles.alertMessageDue]}>
          {preview.message}
        </Text>
        <Text style={styles.alertDate}>{formatAlertDate(preview.alertDate)}</Text>
      </View>
    </View>
  );
}

function Section({ title, items, emptyText, headerStyle }: { title: string; items: AlertPreview[]; emptyText: string; headerStyle?: object }) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, headerStyle]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.length > 0 && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionBody}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          items.map((preview) => (
            <AlertRow key={`${preview.cardId}-${preview.fieldId}`} preview={preview} />
          ))
        )}
      </View>
    </View>
  );
}

type Props = {
  cards: Card[];
};

export default function AlertsTab({ cards }: Props) {
  const allAlerts = getAlertPreviews(cards, 7);
  const due = allAlerts.filter((a) => a.isDue);
  const upcoming = allAlerts.filter((a) => a.isUpcoming);
  const future = allAlerts.filter((a) => !a.isDue && !a.isUpcoming);

  if (allAlerts.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No alerts set</Text>
        <Text style={styles.emptyHint}>
          Add an "Alert" field to any card to see reminders here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Section
        title="Due Now"
        items={due}
        emptyText="No overdue alerts"
        headerStyle={styles.dueSectionHeader}
      />
      <Section
        title="Upcoming (7 days)"
        items={upcoming}
        emptyText="Nothing due soon"
        headerStyle={styles.upcomingSectionHeader}
      />
      {future.length > 0 && (
        <Section
          title="Future"
          items={future}
          emptyText=""
          headerStyle={styles.futureSectionHeader}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 32,
  },
  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
    backgroundColor: "#F5F7FA",
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#757575",
  },
  emptyHint: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F5F7FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
  },
  dueSectionHeader: {
    backgroundColor: "#FFEBEE",
  },
  upcomingSectionHeader: {
    backgroundColor: "#FFF3E0",
  },
  futureSectionHeader: {
    backgroundColor: "#E3F2FD",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  sectionBadge: {
    backgroundColor: "#1A237E",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  sectionBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionBody: {
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
    paddingVertical: 16,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  alertRowDue: {
    backgroundColor: "#FFF8F8",
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginTop: 4,
    flexShrink: 0,
  },
  alertDotDue: {
    backgroundColor: "#F44336",
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    lineHeight: 19,
  },
  alertMessageDue: {
    color: "#C62828",
  },
  alertDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
});
