import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Props = {
  openQuickAdd: () => void;
  openSettings: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

/* =========================
   Component
========================= */

export default function HeaderBar({
  openQuickAdd,
  openSettings,
  searchQuery,
  setSearchQuery,
}: Props) {
  const { t } = useLanguage();

  return (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openQuickAdd} style={styles.iconBtn}>
          <Text style={styles.iconText}>+</Text>
        </TouchableOpacity>

        <Text style={styles.appTitle}>{t("app.title")}</Text>

        <TouchableOpacity
          onPress={openSettings}
          style={[styles.iconBtn, styles.settingsBtn]}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("header.searchStick")}
          placeholderTextColor="#907B45"
        />
      </View>
    </View>
  );
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: "#C98B00",
    paddingBottom: 12,
  },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "700",
    color: "#5A3B00",
  },
  settingsBtn: {
    marginLeft: "auto",
  },
  appTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#FFF8E3",
    fontSize: 20,
    fontWeight: "700",
    pointerEvents: "none",
  },
  settingsIcon: {
    fontSize: 22,
    lineHeight: 22,
    color: "#5A3B00",
  },
  searchRow: {
    paddingHorizontal: 15,
  },
  searchInput: {
    backgroundColor: "#FFF4CC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#4D3300",
    borderWidth: 1,
    borderColor: "#E7C86E",
  },
});
