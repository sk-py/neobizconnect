import { BASE_URL } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { LiveLocationPayload } from "../types";

export const LOCATION_TRACKING_TASK_NAME = "SALES_MANAGER_LIVE_TRACKING";
const API_URL = BASE_URL + "/Add/Live/Locations/Save";

// Helper to push location data to the backend
export const sendLocationUpdate = async (location: Location.LocationObject) => {
  try {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const battery = batteryLevel > 0 ? Math.round(batteryLevel * 100) : 100;

    // Retrieve transient state from storage for background context
    const currentTransport =
      (await AsyncStorage.getItem("tracking_current_transport")) || "Walking";
    const activeVisitId = await AsyncStorage.getItem(
      "tracking_active_visit_id",
    );

    const payload: LiveLocationPayload = {
      latitude: location.coords.latitude.toFixed(6),
      longitude: location.coords.longitude.toFixed(6),
      locationDate: format(new Date(location.timestamp), "yyyy-MM-dd"),
      locationTime: format(new Date(location.timestamp), "HH:mm:ss"),
      data_json: [
        {
          accuracy: location.coords.accuracy ?? 0,
          speed: location.coords.speed ?? 0,
          battery,
          transportMode: currentTransport as any,
          activeVisitId: activeVisitId || null,
        },
      ],
    };

    console.log("[Background Tracking] Dispatching location payload:", payload);
    // await api.post(API_URL, payload);
  } catch (error) {
    console.error("[Background Tracking Error]:", error);
  }
};

// 1. Task Definition (Must be defined at the root scope)
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

// 2. Permission Sequence Flow
export const requestTrackingPermissions = async (): Promise<boolean> => {
  // Step 1: Request Foreground Permission first
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    return false;
  }

  // Step 2: Request Background Permission
  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();
  return bgStatus === "granted";
};

// 3. Start Live Updates
export const startLiveTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    LOCATION_TRACKING_TASK_NAME,
  );
  if (isRegistered) return;

  // Send an immediate first location ping
  const currentLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  await sendLocationUpdate(currentLocation);

  // Start background location updates (Interval ~10 seconds)
  await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    deferredUpdatesInterval: 10000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "NeoBizConnect Tracking Active",
      notificationBody: "Monitoring your daily route and field visits.",
      notificationColor: "#000000",
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
