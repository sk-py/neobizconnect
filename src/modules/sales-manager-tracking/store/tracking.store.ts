import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { ActiveVisit, CompletedVisit, TransportMode } from "../types";

type TrackingStore = {
  isPunchedIn: boolean;
  punchInTime: string | null;
  currentTransport: TransportMode;
  odometerStartPhoto: string | null;
  activeVisit: ActiveVisit | null;
  completedVisits: CompletedVisit[];

  initializeStore: () => Promise<void>;
  punchIn: (transport: TransportMode, photoUri?: string) => Promise<void>;
  punchOut: () => Promise<void>;
  setTransportMode: (mode: TransportMode, photoUri?: string) => Promise<void>;
  startVisit: (visit: ActiveVisit) => Promise<void>;
  endVisit: (
    conclusionData: Omit<CompletedVisit, keyof ActiveVisit | "endTime">,
  ) => Promise<void>;
};

export const useTrackingStore = create<TrackingStore>((set, get) => ({
  isPunchedIn: false,
  punchInTime: null,
  currentTransport: "Walking",
  odometerStartPhoto: null,
  activeVisit: null,
  completedVisits: [],

  initializeStore: async () => {
    try {
      const isPunchedIn =
        (await AsyncStorage.getItem("tracking_is_punched_in")) === "true";
      const punchInTime = await AsyncStorage.getItem("tracking_punch_in_time");
      const currentTransport =
        ((await AsyncStorage.getItem(
          "tracking_current_transport",
        )) as TransportMode) || "Walking";
      const activeVisit = JSON.parse(
        (await AsyncStorage.getItem("tracking_active_visit")) || "null",
      );
      const completedVisits = JSON.parse(
        (await AsyncStorage.getItem("tracking_completed_visits")) || "[]",
      );

      set({
        isPunchedIn,
        punchInTime,
        currentTransport,
        activeVisit,
        completedVisits,
      });
    } catch (e) {
      console.error("[TrackingStore] Hydration Error:", e);
    }
  },

  punchIn: async (transport, photoUri) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    await AsyncStorage.setItem("tracking_is_punched_in", "true");
    await AsyncStorage.setItem("tracking_punch_in_time", time);
    await AsyncStorage.setItem("tracking_current_transport", transport);
    if (photoUri)
      await AsyncStorage.setItem("tracking_odometer_start", photoUri);

    set({
      isPunchedIn: true,
      punchInTime: time,
      currentTransport: transport,
      odometerStartPhoto: photoUri || null,
    });
  },

  punchOut: async () => {
    await AsyncStorage.multiRemove([
      "tracking_is_punched_in",
      "tracking_punch_in_time",
      "tracking_current_transport",
      "tracking_odometer_start",
      "tracking_active_visit",
      "tracking_active_visit_id",
    ]);

    set({
      isPunchedIn: false,
      punchInTime: null,
      currentTransport: "Walking",
      odometerStartPhoto: null,
      activeVisit: null,
    });
  },

  setTransportMode: async (mode, photoUri) => {
    await AsyncStorage.setItem("tracking_current_transport", mode);
    if (photoUri)
      await AsyncStorage.setItem("tracking_odometer_start", photoUri);
    set({ currentTransport: mode, odometerStartPhoto: photoUri || null });
  },

  startVisit: async (visit) => {
    await AsyncStorage.setItem("tracking_active_visit", JSON.stringify(visit));
    await AsyncStorage.setItem("tracking_active_visit_id", visit.id);
    set({ activeVisit: visit });
  },

  endVisit: async (conclusionData) => {
    const { activeVisit, completedVisits } = get();
    if (!activeVisit) return;

    const completed: CompletedVisit = {
      ...activeVisit,
      endTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...conclusionData,
    };

    const updated = [completed, ...completedVisits];
    await AsyncStorage.setItem(
      "tracking_completed_visits",
      JSON.stringify(updated),
    );
    await AsyncStorage.removeItem("tracking_active_visit");
    await AsyncStorage.removeItem("tracking_active_visit_id");

    set({ activeVisit: null, completedVisits: updated });
  },
}));
