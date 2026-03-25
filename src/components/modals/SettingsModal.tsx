import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Rack, Stick, Warehouse, WarehouseRole } from "@/src/types/warehouse";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AppLanguage } from "@/src/i18n/translations";

type Props = {
  visible: boolean;
  warehouse: Warehouse | null;
  sticks: Stick[];
  racks: Rack[];
  userRole: WarehouseRole;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  onUpdateWarehouse: (data: Partial<Warehouse>) => void;
  onOpenProfile: () => void;
  onOpenStaff: () => void;
  onExportWarehouse: () => void;
  onClose: () => void;
};

export default function SettingsModal({
  visible,
  warehouse,
  sticks,
  racks,
  userRole,
  language,
  onChangeLanguage,
  onUpdateWarehouse,
  onOpenProfile,
  onOpenStaff,
  onExportWarehouse,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const singleStickArea = (warehouse?.stickWidth ?? 0) * (warehouse?.stickLength ?? 0);
  const totalWarehouseArea = sticks.length * singleStickArea;
  const occupiedArea = racks.reduce(
    (sum, rack) => sum + ((rack.width ?? 0) * (rack.depth ?? 0)),
    0,
  );
  const totalSpaceLeft = Math.max(0, totalWarehouseArea - occupiedArea);
  const canEditLayout = userRole === "admin" || userRole === "edit";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t("settings.title")}</Text>
          <Text style={styles.subtitle}>{t("settings.subtitle")}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("settings.overview")}</Text>
              <Text style={styles.dataLine}>
                {t("settings.activeWarehouse")}: {warehouse?.name ?? t("settings.noWarehouse")}
              </Text>
              <Text style={styles.dataLine}>{t("settings.totalSticks")}: {sticks.length}</Text>
              <Text style={styles.dataLine}>{t("settings.totalRacks")}: {racks.length}</Text>
              <Text style={styles.dataLine}>{t("settings.spaceLeft")}: {totalSpaceLeft.toFixed(0)} sq ft</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[styles.languageChip, language === "en" && styles.languageChipActive]}
                  onPress={() => onChangeLanguage("en")}
                >
                  <Text style={language === "en" ? styles.languageChipTextActive : styles.languageChipText}>
                    {t("settings.english")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.languageChip, language === "hi" && styles.languageChipActive]}
                  onPress={() => onChangeLanguage("hi")}
                >
                  <Text style={language === "hi" ? styles.languageChipTextActive : styles.languageChipText}>
                    {t("settings.hindi")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {warehouse ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("settings.stickLayout")}</Text>
                <Text style={styles.helperText}>
                  {t("settings.stickSize")}: {warehouse.stickWidth} ft x {warehouse.stickLength} ft
                </Text>

                <View style={styles.layoutRow}>
                  <Text style={styles.dataLine}>{t("settings.rows")}: {warehouse.stickRows}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickRows: Math.max(1, warehouse.stickRows - 1) })}
                    >
                      <Text style={styles.smallBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickRows: warehouse.stickRows + 1 })}
                    >
                      <Text style={styles.smallBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.layoutRow}>
                  <Text style={styles.dataLine}>{t("settings.columns")}: {warehouse.stickCols}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickCols: Math.max(1, warehouse.stickCols - 1) })}
                    >
                      <Text style={styles.smallBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, !canEditLayout && styles.disabledBtn]}
                      disabled={!canEditLayout}
                      onPress={() => onUpdateWarehouse({ stickCols: warehouse.stickCols + 1 })}
                    >
                      <Text style={styles.smallBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
              {warehouse ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onExportWarehouse}>
                  <Text style={styles.secondaryText}>{t("settings.exportExcel")}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={onOpenProfile}>
                <Text style={styles.primaryText}>{t("settings.profile")}</Text>
              </TouchableOpacity>

              {userRole === "admin" ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenStaff}>
                  <Text style={styles.secondaryText}>{t("settings.staff")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modal: {
    width: "92%",
    maxHeight: "84%",
    backgroundColor: "#FFFDF7",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5E3F00",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6D654E",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#7A5200",
    marginBottom: 8,
  },
  helperText: {
    color: "#6D654E",
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  languageChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9D5A1",
  },
  languageChipActive: {
    backgroundColor: "#C98B00",
    borderColor: "#C98B00",
  },
  languageChipText: {
    color: "#6B4C00",
    fontWeight: "700",
  },
  languageChipTextActive: {
    color: "#FFF8E3",
    fontWeight: "700",
  },
  dataLine: {
    color: "#3E2A00",
    marginBottom: 6,
  },
  layoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: {
    fontSize: 20,
    color: "#6B4C00",
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.45,
  },
  primaryBtn: {
    backgroundColor: "#C98B00",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: {
    color: "#FFF8E3",
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#FFF4CC",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9D5A1",
    marginBottom: 10,
  },
  secondaryText: {
    color: "#6B4C00",
    fontWeight: "700",
  },
  closeText: {
    textAlign: "center",
    color: "#7A5200",
    fontWeight: "700",
    marginTop: 4,
  },
});
