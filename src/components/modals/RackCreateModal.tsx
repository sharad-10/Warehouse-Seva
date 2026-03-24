import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Stick } from "@/src/types/warehouse";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Props = {
  visible: boolean;
  stick: Stick | null;
  title?: string;
  submitLabel?: string;
  deleteLabel?: string;
  rackName: string;
  setRackName: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  bagCount: string;
  setBagCount: (value: string) => void;
  stackCount: string;
  setStackCount: (value: string) => void;
  occupancyPercent: string;
  setOccupancyPercent: (value: string) => void;
  maxOccupancyPercent?: number;
  entryDate: string;
  setEntryDate: (value: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function RackCreateModal({
  visible,
  stick,
  title = "Add Rack",
  submitLabel = "Save Rack",
  deleteLabel = "Delete Rack",
  rackName,
  setRackName,
  material,
  setMaterial,
  bagCount,
  setBagCount,
  stackCount,
  setStackCount,
  occupancyPercent,
  setOccupancyPercent,
  maxOccupancyPercent = 100,
  entryDate,
  setEntryDate,
  onDelete,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLanguage();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const sliderRef = React.useRef<View | null>(null);
  const maxPercent = Math.max(1, Math.min(100, maxOccupancyPercent));
  const numericValue = Math.max(1, Math.min(maxPercent, Number(occupancyPercent) || 1));

  const handleSetOccupancy = React.useCallback((value: number) => {
    setOccupancyPercent(String(Math.max(1, Math.min(maxPercent, Math.round(value)))));
    Keyboard.dismiss();
  }, [maxPercent, setOccupancyPercent]);

  const updateFromPageX = React.useCallback((pageX: number) => {
    if (!sliderWidth || !sliderRef.current) {
      return;
    }

    sliderRef.current.measureInWindow((x) => {
      const relativeX = Math.max(0, Math.min(sliderWidth, pageX - x));
      const nextValue = (relativeX / sliderWidth) * maxPercent;
      handleSetOccupancy(nextValue);
    });
  }, [handleSetOccupancy, maxPercent, sliderWidth]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {t("rack.selectedStick")}: {stick?.name ?? t("rack.noStick")}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t("rack.name")}
            value={rackName}
            onChangeText={setRackName}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TextInput
            style={styles.input}
            placeholder={t("rack.material")}
            value={material}
            onChangeText={setMaterial}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TextInput
            style={styles.input}
            placeholder={t("rack.bags")}
            keyboardType="numeric"
            value={bagCount}
            onChangeText={setBagCount}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TextInput
            style={styles.input}
            placeholder={t("rack.stacks")}
            keyboardType="numeric"
            value={stackCount}
            onChangeText={setStackCount}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <View style={styles.sliderCard}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{t("rack.spaceInStick")}</Text>
              <Text style={styles.sliderValue}>{numericValue}%</Text>
            </View>
            <Text style={styles.sliderHint}>{t("rack.availableToAllocate")}: {maxPercent}%</Text>

            <View
              ref={sliderRef}
              style={styles.sliderTrack}
              onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => {
                updateFromPageX(event.nativeEvent.pageX);
              }}
              onResponderMove={(event) => {
                updateFromPageX(event.nativeEvent.pageX);
              }}
            >
              <View
                style={[
                  styles.sliderFill,
                  { width: `${(numericValue / maxPercent) * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${(numericValue / maxPercent) * 100}%` },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{t("rack.entryDate")}: {entryDate}</Text>
          </TouchableOpacity>

          {showDatePicker ? (
            <DateTimePicker
              value={new Date(entryDate)}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (event.type === "dismissed" || !selectedDate) return;
                setEntryDate(selectedDate.toISOString().split("T")[0]);
              }}
            />
          ) : null}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Keyboard.dismiss();
              onSubmit();
            }}
          >
            <Text style={styles.primaryText}>{submitLabel}</Text>
          </TouchableOpacity>

          {onDelete ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Keyboard.dismiss();
                onDelete();
              }}
            >
              <Text style={styles.deleteText}>{deleteLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
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
    width: "90%",
    backgroundColor: "#FFFDF7",
    borderRadius: 18,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6F4C00",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6D6A7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  sliderCard: {
    borderWidth: 1,
    borderColor: "#E6D6A7",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sliderLabel: {
    color: "#5C4B17",
    fontWeight: "600",
  },
  sliderValue: {
    color: "#8B5E00",
    fontWeight: "700",
  },
  sliderHint: {
    color: "#7A6A3B",
    marginBottom: 10,
    fontSize: 12,
  },
  sliderTrack: {
    height: 16,
    borderRadius: 999,
    backgroundColor: "#F4E7BE",
    justifyContent: "center",
    overflow: "visible",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "#F4B400",
  },
  sliderThumb: {
    position: "absolute",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8B5E00",
    borderWidth: 3,
    borderColor: "#FFF7DC",
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#E6D6A7",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  dateText: {
    color: "#333",
  },
  primaryBtn: {
    backgroundColor: "#F4B400",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: {
    fontWeight: "700",
    color: "#2E2300",
  },
  deleteBtn: {
    backgroundColor: "#FFF0ED",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteText: {
    color: "#B13A1D",
    fontWeight: "700",
  },
  closeText: {
    textAlign: "center",
    color: "#666",
  },
});
