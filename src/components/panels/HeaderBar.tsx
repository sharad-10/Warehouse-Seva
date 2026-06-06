import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  spaceName: string | null;
  onOpenSpaceSheet: () => void;
};

export default function HeaderBar({ spaceName, onOpenSpaceSheet }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Warehouse Seva</Text>

      <TouchableOpacity style={styles.spaceChip} onPress={onOpenSpaceSheet}>
        <Text style={styles.spaceChipText} numberOfLines={1}>
          {spaceName ?? "Select Space"}
        </Text>
        <Text style={styles.spaceChipIcon}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1A237E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  spaceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 140,
    gap: 4,
    flexShrink: 0,
  },
  spaceChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  spaceChipIcon: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    flexShrink: 0,
  },
});
