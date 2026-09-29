import { syncPushToken } from "@/services/pushApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as IntentLauncher from "expo-intent-launcher";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { shareAsync } from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const usePushNotifications = (userId?: number | string | null) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  const lastSyncedTokenRef = useRef<string | null>(null);

  const syncToken = useCallback(
    async (token: string) => {
      if (!userId || lastSyncedTokenRef.current === token) return;

      const pushEnabled = await AsyncStorage.getItem("pushEnabled");
      if (pushEnabled !== "false") {
        lastSyncedTokenRef.current = token;
        await syncPushToken(userId, token);
      }
    },
    [userId],
  );

  const initializePush = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setFcmToken(token);
      await syncToken(token);
    }
    return token;
  }, [userId, syncToken]);

  // TO HANDLE COLD BOOTS & BACKGROUND TAPS
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const data = lastNotificationResponse.notification.request.content.data;

      // If a custom route is present in the payload (e.g. data: { route: "/orders" }),
      // it goes there. Otherwise, it defaults to "/"
      const route = (data?.url || data?.route || "/") as any;

      // Small timeout ensures Expo Router has finished mounting before pushing
      setTimeout(() => {
        router.push(route);
      }, 100);
    }
  }, [lastNotificationResponse, router]);

  // TO HANDLE TOKEN ROTATION & FOREGROUND TAPS
  useEffect(() => {
    if (!userId) return;

    const tokenListener = Notifications.addPushTokenListener(
      async (newToken) => {
        setFcmToken(newToken.data);
        await syncToken(newToken.data);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          action?: string;
          fileUri?: string;
          mimeType?: string;
          url?: string;
          route?: string;
        };

        if (data?.action === "open_downloaded_file" && data?.fileUri) {
          if (Platform.OS === "android") {
            // Android: Force open the default PDF viewer app
            IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: data.fileUri,
              flags: 1,
              type: data.mimeType || "application/pdf",
            }).catch((err) => console.error("Failed to open file:", err));
          } else {
            // iOS: Trigger the native Share Sheet so they can Quick Look or Save to Files
            shareAsync(data.fileUri, {
              mimeType: data.mimeType || "application/pdf",
              UTI: "com.adobe.pdf",
            }).catch(console.error);
          }
          return;
        }

        const route = (data?.url || data?.route || "/dashboard") as any;
        router.push(route);
      });

    return () => {
      tokenListener.remove();
      responseListener.remove();
    };
  }, [userId, syncToken, router]);

  return { fcmToken, initializePush };
};

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    Alert.alert("Error", "Must use a physical device for Push Notifications");
    return null;
  }

  if (Platform.OS === "android") {
    await Promise.all([
      Notifications.setNotificationChannelAsync("alerts_critical", {
        name: "Critical Alerts",
        importance: Notifications.AndroidImportance.MAX,
        sound: "notifications_sound.wav",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      }),
      Notifications.setNotificationChannelAsync("updates_operational", {
        name: "Order & Account Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
      }),
      Notifications.setNotificationChannelAsync("marketing_promotional", {
        name: "Promotions & News",
        importance: Notifications.AndroidImportance.DEFAULT,
      }),
    ]);
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Failed to get push token for push notifications!",
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.error("Token Fetch Error:", error);
    return null;
  }
}
