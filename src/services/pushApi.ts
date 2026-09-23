import { Platform } from "react-native";

// const API_BASE_URL = "http://10.100.21.156:3500";
const API_BASE_URL = "https://mail.actifyzone.com/notify";
const APP_ID = "neobiz-connect";

export const syncPushToken = async (
  userId: number | string,
  token: string,
): Promise<boolean> => {
  if (!userId || !token) {
    console.warn("[Push API] Missing userId or token. Aborting sync.");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": APP_ID,
      },
      body: JSON.stringify({
        userId: Number(userId),
        token,
        platform: Platform.OS, // Automatically resolves to 'android' or 'ios'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    console.log("[Push API] Token synced successfully");
    return true;
  } catch (error) {
    console.error("[Push API] Sync failed:", error);
    return false;
  }
};

export const removePushToken = async (
  userId: number | string,
  token: string,
): Promise<boolean> => {
  if (!userId || !token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/unsubscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": APP_ID,
      },
      body: JSON.stringify({
        userId: Number(userId),
        token,
      }),
    });

    if (!response.ok) throw new Error("Unsubscribe failed");

    console.log("[Push API] Token removed successfully");
    return true;
  } catch (error) {
    console.error("[Push API] Remove failed:", error);
    return false;
  }
};
