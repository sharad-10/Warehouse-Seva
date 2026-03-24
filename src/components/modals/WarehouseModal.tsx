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

import { Stick, Warehouse, WarehouseRole } from "@/src/types/warehouse";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Props = {
  visible: boolean;
  warehouses: Warehouse[];
  currentWarehouseId: string | null;
  currentWarehouseName: string | null;
  sticks: Stick[];
  draftName: string;
  setDraftName: (name: string) => void;
  stickName: string;
  setStickName: (name: string) => void;
  onSelect: (warehouseId: string) => void;
  onCreate: () => void;
  onCreateStick: () => void;
  onDeleteStick: (stickId: string) => void;
  onRename: (warehouseId: string) => void;
  onDelete: (warehouseId: string) => void;
  onClose: () => void;
  userRole: WarehouseRole;
};

export default function WarehouseModal({
  visible,
  warehouses,
  currentWarehouseId,
  currentWarehouseName,
  sticks,
  draftName,
  setDraftName,
  stickName,
  setStickName,
  onSelect,
  onCreate,
  onCreateStick,
  onDeleteStick,
  onRename,
  onDelete,
  onClose,
  userRole,
}: Props) {
  const { t } = useLanguage();
  const hasWarehouses = warehouses.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t("warehouse.manage")}</Text>
          <Text style={styles.subtitle}>{t("warehouse.manageSubtitle")}</Text>

          {hasWarehouses ? (
            <ScrollView style={styles.list}>
              {warehouses.map((warehouse) => {
                const isSelected = warehouse.id === currentWarehouseId;

                return (
                  <TouchableOpacity
                    key={warehouse.id}
                    style={[styles.item, isSelected && styles.selectedItem]}
                    onPress={() => onSelect(warehouse.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{warehouse.name}</Text>
                      <Text style={styles.itemMeta}>
                        {isSelected ? t("common.currentlyActive") : t("common.tapToSwitch")}
                      </Text>
                    </View>

                    {userRole === "admin" && isSelected ? (
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={styles.smallBtn}
                          onPress={() => onRename(warehouse.id)}
                        >
                          <Text>{t("common.rename")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.dangerBtn]}
                          onPress={() => onDelete(warehouse.id)}
                        >
                          <Text style={styles.dangerText}>{t("common.delete")}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t("warehouse.empty")}</Text>
              <Text style={styles.emptyText}>
                {t("warehouse.emptyDesc")}
              </Text>
            </View>
          )}

          <TextInput
            placeholder={t("warehouse.nameInput")}
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <View style={styles.actionRowBlock}>
            <TouchableOpacity style={styles.btn} onPress={onCreate}>
              <Text style={styles.btnText}>{t("warehouse.create")}</Text>
            </TouchableOpacity>

            {currentWarehouseId && userRole === "admin" ? (
              <TouchableOpacity
                style={[styles.btn, styles.secondaryBtn]}
                onPress={() => onRename(currentWarehouseId)}
              >
                <Text style={[styles.btnText, styles.secondaryBtnText]}>
                  {t("warehouse.renameSelected")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.divider} />

          <Text style={styles.title}>{t("warehouse.addStick")}</Text>
          <Text style={styles.subtitle}>
            {t("warehouse.addStickSubtitle")} {currentWarehouseName ?? t("settings.noWarehouse")}.
          </Text>

          {currentWarehouseId ? (
            <>
              <ScrollView style={styles.stickList}>
                {sticks.length === 0 ? (
                  <Text style={styles.emptyText}>{t("warehouse.stickEmpty")}</Text>
                ) : (
                  sticks.map((stick) => (
                    <View key={stick.id} style={styles.stickItem}>
                      <Text style={styles.itemTitle}>{stick.name}</Text>
                      {userRole === "admin" ? (
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.dangerBtn]}
                          onPress={() => onDeleteStick(stick.id)}
                        >
                          <Text style={styles.dangerText}>{t("common.delete")}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>

              <TextInput
                placeholder={t("warehouse.stickName")}
                value={stickName}
                onChangeText={setStickName}
                style={styles.input}
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.btn} onPress={onCreateStick}>
                <Text style={styles.btnText}>{t("warehouse.addStick")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t("warehouse.selectFirst")}</Text>
              <Text style={styles.emptyText}>
                {t("warehouse.selectFirstDesc")}
              </Text>
            </View>
          )}

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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modal: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fffdf7",
    padding: 20,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#8B5E00",
  },
  subtitle: {
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  list: {
    maxHeight: 280,
    marginBottom: 12,
  },
  item: {
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedItem: {
    backgroundColor: "#FFF4CC",
  },
  itemTitle: {
    fontWeight: "700",
  },
  itemMeta: {
    color: "#666",
    marginTop: 3,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dangerBtn: {
    backgroundColor: "#FFF0ED",
    borderColor: "#F1B0A5",
  },
  dangerText: {
    color: "#B13A1D",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9D5A1",
    marginBottom: 14,
  },
  stickList: {
    maxHeight: 120,
    marginBottom: 12,
  },
  stickItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9D5A1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
    color: "#8B5E00",
  },
  emptyText: {
    color: "#666",
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#F4B400",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  actionRowBlock: {
    marginBottom: 4,
  },
  secondaryBtn: {
    backgroundColor: "#FFF4CC",
    borderWidth: 1,
    borderColor: "#E9D5A1",
  },
  btnText: {
    fontWeight: "700",
    color: "#2E2300",
  },
  secondaryBtnText: {
    color: "#6B4C00",
  },
  closeText: {
    textAlign: "center",
    color: "#555",
  },
});
