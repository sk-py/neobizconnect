import { api } from "@/services/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import * as Location from "expo-location";
import { create } from "zustand";
import { startLiveTracking, stopLiveTracking } from "../services/tracking-task";

export type TransportMode =
  | "Walking"
  | "Bus"
  | "Train"
  | "Auto"
  | "Car (Personal)"
  | "Bike (Personal)"
  | "Other";

export interface ActiveVisit {
  id: string; // Maps to fieldvisit_id
  dealerId: string;
  dealerName: string;
  dealerAddress: string;
  startTime: string;
}

interface TrackingState {
  isPunchedIn: boolean;
  punchInTime: string | null;
  punchOutTime: string | null;
  currentTransport: TransportMode;
  activeVisit: ActiveVisit | null;
  totalVisitsToday: number;
  attendanceId: number | null;

  initializeStore: () => Promise<void>;
  syncAttendanceDetails: () => Promise<void>;
  punchIn: (mode: TransportMode) => Promise<void>;
  punchOut: () => Promise<void>;
  setTransportMode: (
    mode: TransportMode,
    photoUris?: string[],
  ) => Promise<void>;
  startVisit: (
    distributorId: number,
    distributorName: string,
    distributorAddress: string,
  ) => Promise<void>;
  endVisit: (data: {
    conclusion: string;
    visit_reason: string;
    remarks: string;
    future_prospects: string;
  }) => Promise<void>;
}

export const fetchCurrentLocation =
  async (): Promise<Location.LocationObject> => {
    try {
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      return loc;
    } catch (error) {
      console.warn("[TrackingStore] Retrying location fetch...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });
      } catch (retryError) {
        throw new Error(
          "Unable to fetch current location. Please ensure you are outdoors or have a clear signal.",
        );
      }
    }
  };

export const useTrackingStore = create<TrackingState>((set, get) => ({
  isPunchedIn: false,
  punchInTime: null,
  punchOutTime: null,
  currentTransport: "Walking",
  activeVisit: null,
  totalVisitsToday: 0,
  attendanceId: null,

  initializeStore: async () => {
    const punchInDate = await AsyncStorage.getItem("tracking_punch_in_date");
    const today = format(new Date(), "yyyy-MM-dd");

    if (punchInDate && punchInDate !== today) {
      // 1. Wipe stale sessions from previous days
      await AsyncStorage.multiRemove([
        "tracking_punch_in_date",
        "tracking_current_transport",
        "tracking_active_visit_id",
      ]);
      await stopLiveTracking();

      set({
        isPunchedIn: false,
        punchInTime: null,
        punchOutTime: null,
        activeVisit: null,
        currentTransport: "Walking",
      });
    } else {
      // 2. Trust local storage for instant UI load
      if (punchInDate === today) {
        const savedMode = await AsyncStorage.getItem(
          "tracking_current_transport",
        );
        set({
          isPunchedIn: true,
          currentTransport: (savedMode as TransportMode) || "Walking",
        });
        // Restart the background service just in case the OS killed it during app close
        startLiveTracking();
      }

      // 3. Silently fetch exact data from backend to ensure accuracy
      await get().syncAttendanceDetails();
    }
  },

  syncAttendanceDetails: async () => {
    try {
      const response = await api.get("/Get/Attendance/Details");
      const data = response.data;

      // Bulletproof checks for null, undefined, or empty strings
      const hasInTime = !!data.in_time && data.in_time.trim() !== "";
      const hasOutTime =
        !!data.out_time &&
        data.out_time.trim() !== "" &&
        data.out_time !== "null";

      const isPunchedIn = hasInTime && !hasOutTime;
      const mode =
        data.travel_mode && data.travel_mode.trim() !== ""
          ? data.travel_mode
          : "Walking";

      let activeVisit = null;
      if (data.active_visit) {
        activeVisit = {
          id: data.active_visit.fieldvisit_id.toString(),
          dealerId: "",
          dealerName: data.active_visit.locations,
          dealerAddress: "",
          startTime: data.active_visit.attendance_time,
        };
        await AsyncStorage.setItem("tracking_active_visit_id", activeVisit.id);
      }

      // Force local storage to match backend reality if they differ
      if (isPunchedIn) {
        await AsyncStorage.setItem(
          "tracking_punch_in_date",
          format(new Date(), "yyyy-MM-dd"),
        );
        await AsyncStorage.setItem("tracking_current_transport", mode);
      } else {
        await AsyncStorage.multiRemove([
          "tracking_punch_in_date",
          "tracking_current_transport",
          "tracking_active_visit_id",
        ]);
        await stopLiveTracking();
      }

      set({
        isPunchedIn,
        punchInTime: hasInTime ? data.in_time : null,
        punchOutTime: hasOutTime ? data.out_time : null,
        currentTransport: mode as TransportMode,
        totalVisitsToday: data.visit_count || 0,
        activeVisit,
      });
    } catch (error) {
      console.error("[TrackingStore] Sync Attendance Error:", error);
    }
  },

  punchIn: async (mode) => {
    try {
      const loc = await fetchCurrentLocation();
      const payload = {
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
      };

      const response = await api.post("/Add/Attendance/Save", payload);
      const newAttendanceId = response.data?.id || 2;
      const now = new Date();

      await AsyncStorage.setItem(
        "tracking_punch_in_date",
        format(now, "yyyy-MM-dd"),
      );
      await AsyncStorage.setItem("tracking_current_transport", mode);

      set({
        isPunchedIn: true,
        punchInTime: format(now, "hh:mm a"),
        punchOutTime: null,
        currentTransport: mode,
        attendanceId: newAttendanceId,
      });
    } catch (e: any) {
      console.error("[TrackingStore] Punch In Error:", e);
      throw e;
    }
  },

  punchOut: async () => {
    try {
      const loc = await fetchCurrentLocation();
      const payload = {
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
      };

      await api.post("/Add/Attendance/Save", payload);

      await AsyncStorage.multiRemove([
        "tracking_punch_in_date",
        "tracking_current_transport",
        "tracking_active_visit_id",
      ]);

      set({
        isPunchedIn: false,
        punchOutTime: format(new Date(), "hh:mm a"),
        activeVisit: null,
        attendanceId: null,
        currentTransport: "Walking",
      });
    } catch (e: any) {
      console.error("[TrackingStore] Punch Out Error:", e);
      throw e;
    }
  },

  setTransportMode: async (mode, photoUris = []) => {
    try {
      const loc = await fetchCurrentLocation();
      const formData = new FormData();

      formData.append("travel_mode", mode);
      formData.append("latitude", loc.coords.latitude.toString());
      formData.append("longitude", loc.coords.longitude.toString());

      if (photoUris && photoUris.length > 0) {
        photoUris.forEach((uri, index) => {
          const filename =
            uri.split("/").pop() || `odometer_${Date.now()}_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
          formData.append("files", { uri, name: filename, type } as any);
        });
      } else {
        formData.append("files", "");
      }

      await api.post("/Add/Travel/Save", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await AsyncStorage.setItem("tracking_current_transport", mode);
      set({ currentTransport: mode });
    } catch (e: any) {
      console.error("[TrackingStore] Set Transport Mode Error:", e);
      throw e;
    }
  },

  startVisit: async (distributorId, distributorName, distributorAddress) => {
    try {
      const loc = await fetchCurrentLocation();

      const payload = {
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
        customer_name: distributorName,
        distributor_id: distributorId,
      };

      const response = await api.post("/Add/Visit/Save", payload);
      const visitId = response.data?.id?.toString();

      const visit: ActiveVisit = {
        id: visitId,
        dealerId: distributorId.toString(),
        dealerName: distributorName,
        dealerAddress: distributorAddress,
        startTime: format(new Date(), "hh:mm a"),
      };

      await AsyncStorage.setItem("tracking_active_visit_id", visit.id);
      set({ activeVisit: visit });
    } catch (e: any) {
      console.error("[TrackingStore] Start Visit Error:", e);
      throw e;
    }
  },

  endVisit: async (data) => {
    const visit = get().activeVisit;
    if (!visit) return;

    try {
      const loc = await fetchCurrentLocation();
      const payload = {
        id: Number(visit.id),
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
        ...data,
      };

      await api.post("/End/Visit/Save", payload);
      await AsyncStorage.removeItem("tracking_active_visit_id");

      set((state) => ({
        activeVisit: null,
        totalVisitsToday: state.totalVisitsToday + 1,
      }));
    } catch (e: any) {
      console.error("[TrackingStore] End Visit Error:", e);
      throw e;
    }
  },
}));
