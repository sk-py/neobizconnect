import { BASE_URL } from "@/constants/config";
import { api } from "@/services/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import * as Battery from "expo-battery";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";

export const LOCATION_TRACKING_TASK_NAME = "SALES_MANAGER_LIVE_TRACKING";
const API_URL = BASE_URL + "/Add/Live/Locations/Save";

export const sendLocationUpdate = async (location: Location.LocationObject) => {
  try {
    // 1. Stale Session Check (Kill switch for abandoned overnight sessions)
    const punchInDate = await AsyncStorage.getItem("tracking_punch_in_date");
    const today = format(new Date(), "yyyy-MM-dd");

    if (punchInDate && punchInDate !== today) {
      console.warn(
        "[Background Tracking] Stale session detected. Auto-killing task.",
      );
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
      await AsyncStorage.multiRemove([
        "tracking_punch_in_date",
        "tracking_current_transport",
        "tracking_active_visit_id",
      ]);
      return;
    }

    // 2. Gather Hardware & Context Data
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const battery = batteryLevel > 0 ? Math.round(batteryLevel * 100) : 100;

    const networkState = await Network.getNetworkStateAsync();

    const currentTransport =
      (await AsyncStorage.getItem("tracking_current_transport")) || "Walking";
    const activeVisitId = await AsyncStorage.getItem(
      "tracking_active_visit_id",
    );

    // 3. Construct Live Tracking Payload
    const payload = {
      latitude: location.coords.latitude.toFixed(6),
      longitude: location.coords.longitude.toFixed(6),
      locationDate: format(new Date(location.timestamp), "yyyy-MM-dd"),
      locationTime: format(new Date(location.timestamp), "HH:mm:ss"),
      data_json: [
        {
          accuracy: location.coords.accuracy ?? 0,
          speed: location.coords.speed ?? 0,
          battery,
          transportMode: currentTransport,
          activeVisitId: activeVisitId || null,
          deviceBrand: Device.brand || "Unknown",
          deviceModel: Device.modelName || "Unknown",
          osName: Device.osName || "Unknown",
          osVersion: Device.osVersion || "Unknown",
          networkType: networkState.type || "UNKNOWN",
          isConnected: networkState.isConnected ?? false,
        },
      ],
    };

    console.log("[Background Tracking] Dispatching live payload:", payload);
    await api.post(API_URL, payload);
  } catch (error) {
    console.error("[Background Tracking Error]:", error);
  }
};

// 1. Task Definition (Root scope execution)
TaskManager.defineTask(LOCATION_TRACKING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("[TaskManager] Location update failed:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const latestLocation = locations[locations.length - 1];
      await sendLocationUpdate(latestLocation);
    }
  }
});

export const checkTrackingPermissions = async (): Promise<boolean> => {
  try {
    const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    return fgStatus === "granted" && bgStatus === "granted";
  } catch {
    return false;
  }
};

// 2. Permission Sequence Flow (With Hardware GPS Race Condition Fix)
export const requestTrackingPermissions = async (): Promise<boolean> => {
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") return false;

  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") return false;

  let servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    await Location.enableNetworkProviderAsync();

    let retries = 5;
    while (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      servicesEnabled = await Location.hasServicesEnabledAsync();
      if (servicesEnabled) break;
      retries--;
    }

    if (!servicesEnabled) return false;
  }

  return true;
};

// 3. Start Live Updates
export const startLiveTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    LOCATION_TRACKING_TASK_NAME,
  );
  if (isRegistered) return;

  try {
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    await sendLocationUpdate(currentLocation);
  } catch (e) {
    console.warn(
      "[Tracking] Initial ping failed, waiting for background task.",
    );
  }

  await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 0,
    deferredUpdatesInterval: 10000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "NeoBiz Connect",
      notificationBody: "Live tracking is active.",
      notificationColor: "#0F172A",
    },
  });
};

// 4. Stop Live Updates
export const stopLiveTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    LOCATION_TRACKING_TASK_NAME,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME);
  }
};
