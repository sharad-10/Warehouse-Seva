import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { arrayUnion, doc, setDoc } from "firebase/firestore";

import { db } from "@/src/firebase/config";
import { Rack, Stick } from "@/src/types/warehouse";
import { getUpcomingRackAlertDates } from "@/src/utils/rackAlerts";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_KIND = "rack-alert";

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId ??
  undefined;

const toScheduledDate = (date: Date, now: Date) => {
  const scheduledDate = new Date(date);
  scheduledDate.setHours(9, 0, 0, 0);

  if (scheduledDate.getTime() <= now.getTime() + 30_000) {
    return new Date(now.getTime() + 60_000);
  }

  return scheduledDate;
};

export function useRackAlertNotifications(
  userId: string | null,
  warehouseName: string | null,
  racks: Rack[],
  sticks: Stick[],
) {
  const [permissionGranted, setPermissionGranted] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web" || !userId) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("rack-alerts", {
          name: "Rack Alerts",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
        });
      }

      const existingPermission = await Notifications.getPermissionsAsync();
      let finalStatus = existingPermission.status;

      if (finalStatus !== "granted") {
        const requestedPermission = await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermission.status;
      }

      if (cancelled) {
        return;
      }

      const granted = finalStatus === "granted";
      setPermissionGranted(granted);

      if (!granted) {
        return;
      }

      const projectId = getProjectId();
      if (!projectId) {
        return;
      }

      try {
        const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        await setDoc(
          doc(db, "users", userId),
          {
            expoPushTokens: arrayUnion(expoPushToken.data),
            lastPushTokenAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch {
        // Token registration is best-effort. Local notifications still work without this.
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (Platform.OS === "web" || !permissionGranted || !userId) {
      return;
    }

    let cancelled = false;

    const syncNotifications = async () => {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const rackAlertNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.kind === NOTIFICATION_KIND,
      );

      await Promise.all(
        rackAlertNotifications.map((notification) =>
          Notifications.cancelScheduledNotificationAsync(notification.identifier),
        ),
      );

      const stickNameById = new Map(sticks.map((stick) => [stick.id, stick.name]));
      const now = new Date();

      for (const rack of racks) {
        const stickName = stickNameById.get(rack.stickId ?? "") ?? "Unknown Stick";

        for (const alert of rack.alerts ?? []) {
          const triggerDates = getUpcomingRackAlertDates(rack.entryDate, alert, 12);

          for (const triggerDate of triggerDates) {
            if (cancelled) {
              return;
            }

            const scheduledDate = toScheduledDate(triggerDate, now);

            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Warehouse Seva",
                body: `Medicine reminder: ${rack.name}${rack.material ? ` (${rack.material})` : ""} in ${stickName}${warehouseName ? `, ${warehouseName}` : ""}`,
                sound: "default",
                data: {
                  kind: NOTIFICATION_KIND,
                  rackId: rack.id,
                  stickId: rack.stickId ?? "",
                  warehouseName: warehouseName ?? "",
                  triggerDate: triggerDate.toISOString().split("T")[0],
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: scheduledDate,
                channelId: "rack-alerts",
              },
            });
          }
        }
      }
    };

    void syncNotifications();

    return () => {
      cancelled = true;
    };
  }, [permissionGranted, racks, sticks, userId, warehouseName]);

  return {
    notificationsEnabled: permissionGranted,
  };
}
