import { LiveClock } from "@/components/custom/live-clock";
import { PulseDot } from "@/components/custom/pulse-dot";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { getGreeting } from "@/utils/greeting";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  checkTrackingPermissions,
  requestTrackingPermissions,
  startLiveTracking,
  stopLiveTracking,
} from "../services/tracking-task";
import { useTrackingStore } from "../store/tracking.store";
import { EndVisitModal } from "./end-visit-modal";
import { LocationDisclosureModal } from "./location-disclosure-modal";
import { PunchOutModal } from "./punch-out-modal";
import { TransportModal } from "./transport-modal";
import { VisitModal } from "./visit-modal";

const INK = "#0F172A";
const MUTED = "#64748B";
const ACCENT = colors.primary;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PrimaryButton = ({ title, icon, onPress }: { title: string; icon?: string; onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      style={[styles.primaryBtn, animatedStyle]}
      activeOpacity={0.9}
      onPressIn={() => (scale.value = withTiming(0.98, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      onPress={onPress}
    >
      {icon && <Feather name={icon as any} size={16} color={colors.white} style={{ marginRight: 8 }} />}
      <Text style={styles.primaryBtnText}>{title}</Text>
    </AnimatedTouchable>
  );
};

const TextAction = ({ title, tone = "muted", onPress }: { title: string; tone?: "muted" | "danger"; onPress: () => void }) => (
  <TouchableOpacity style={styles.textAction} activeOpacity={0.6} onPress={onPress}>
    <Text style={[styles.textActionLabel, tone === "danger" && { color: colors.error }]}>{title}</Text>
  </TouchableOpacity>
);

export const SalesManagerHomeScreen = () => {
  const {
    isPunchedIn,
    punchInTime,
    punchOutTime,
    currentTransport,
    activeVisit,
    totalVisitsToday,
    initializeStore,
    punchIn,
    punchOut,
    setTransportMode,
    startVisit,
    endVisit,
  } = useTrackingStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [disclosureVisible, setDisclosureVisible] = useState(false);
  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [endVisitModalVisible, setEndVisitModalVisible] = useState(false);
  const [punchOutModalVisible, setPunchOutModalVisible] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(getGreeting());

  const { user } = useAuth();
  const { navigate } = useRouter();
  const heroOpacity = useSharedValue(0);

  useEffect(() => {
    const loadState = async () => {
      await initializeStore();
      setIsInitializing(false);
      heroOpacity.value = withTiming(1, { duration: 300 });
    };
    loadState();
    
    const greetingInterval = setInterval(() => setCurrentGreeting(getGreeting()), 60000);
    return () => clearInterval(greetingInterval);
  }, []);

  const heroAnimatedStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));

  const handlePunchInClick = async () => {
    const isGranted = await checkTrackingPermissions();
    if (isGranted) {
      await proceedWithPunchIn();
    } else {
      setDisclosureVisible(true);
    }
  };

  const handleDisclosureAccept = async () => {
    setDisclosureVisible(false);
    const granted = await requestTrackingPermissions();
    if (!granted) {
      Alert.alert("Permission Denied", "Background location is required. Enable 'Allow all the time' in Settings.");
      return;
    }
    await proceedWithPunchIn();
  };

  const proceedWithPunchIn = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      await punchIn("Walking");
      await startLiveTracking();
      // Removed syncAttendanceDetails() to prevent race condition override
    } catch (error: any) {
      Alert.alert("Unable to Start", error.message || "Failed to punch in.");
    } finally {
      setIsStarting(false);
    }
  };

  const handlePunchOutConfirm = async () => {
    try {
      await stopLiveTracking();
      await punchOut();
      // Removed syncAttendanceDetails() to prevent race condition override
    } catch (error: any) {
      Alert.alert("Checkout Failed", error.message || "Failed to punch out.");
    }
  };

  const todayString = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  if (isInitializing) {
    return (
      <View style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={{ width: "90%" }}>
          <Text numberOfLines={1} style={styles.greeting}>{currentGreeting}, {user?.name?.trim()}</Text>
          <Text style={styles.date}>{todayString}</Text>
        </View>
        <TouchableOpacity onPress={() => navigate("/profile")} style={styles.profileBtn}>
          <Feather name="user" size={18} color={INK} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerRule} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 1. STATE SECTION */}
        {activeVisit ? (
          <Animated.View style={[styles.activeVisitCard, heroAnimatedStyle]}>
            <View style={styles.activeVisitHeader}>
              <View style={styles.pulseTag}>
                <PulseDot color={colors.success} size={6} />
                <Text style={styles.pulseText}>MEETING IN PROGRESS</Text>
              </View>
              <Text style={styles.timeStarted}>Since {activeVisit.startTime}</Text>
            </View>
            <Text style={styles.activeDealerName}>{activeVisit.dealerName}</Text>
            <Text style={styles.activeDealerAddress}>{activeVisit.dealerAddress}</Text>

            <TouchableOpacity style={styles.endVisitBtn} activeOpacity={0.8} onPress={() => setEndVisitModalVisible(true)}>
              <Text style={styles.endVisitBtnText}>End Meeting & Enter Report</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : isPunchedIn ? (
          <Animated.View style={heroAnimatedStyle}>
            {/* BLOCK A: Tracking Status */}
            <View style={styles.section}>
              <View style={styles.trackingHeaderRow}>
                <View>
                  <Text style={styles.sectionLabel}>CURRENT STATUS</Text>
                  <View style={styles.onDutyContainer}>
                    <Text style={styles.dealerName}>On Duty</Text>
                    <PulseDot color={ACCENT} size={8} />
                  </View>
                  <Text style={styles.metaLine}>Since {punchInTime}</Text>
                </View>
                <TouchableOpacity style={styles.punchOutBox} onPress={() => setPunchOutModalVisible(true)}>
                  <Feather name="power" size={14} color={colors.error} />
                  <Text style={styles.punchOutBoxText}>Punch Out</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.transportRow}>
                <View style={styles.transportInfo}>
                  <Feather name="navigation" size={14} color={MUTED} />
                  <Text style={styles.transportText}>
                    Mode &nbsp;<Text style={styles.transportValue}>{currentTransport}</Text>
                  </Text>
                </View>
                <TextAction title="Change" onPress={() => setTransportModalVisible(true)} />
              </View>
            </View>

            {/* BLOCK B: Field Operations */}
            <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.sectionLabel}>FIELD OPERATIONS</Text>
              <PrimaryButton title="Start Distributor Visit" icon="map-pin" onPress={() => setVisitModalVisible(true)} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.section, styles.offDutySection, heroAnimatedStyle]}>
            <LiveClock />
            <Text style={styles.offDutySubtitle}>
              {punchOutTime ? `Punched out at ${punchOutTime}` : "You are currently not on duty"}
            </Text>
            <PrimaryButton 
              title={isStarting ? "Starting..." : "Punch In & Start Your Day"} 
              icon="power" 
              onPress={handlePunchInClick} 
            />
          </Animated.View>
        )}

        <View style={{ height: spacing.xl }} />

        {/* 2. TODAY'S VISITS SUMMARY */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>TODAY'S VISITS</Text>
            <Text style={styles.sectionCount}>{totalVisitsToday}</Text>
          </View>

          <Text style={styles.emptyVisits}>
            {totalVisitsToday === 0 
              ? "No visits completed yet today." 
              : `You have successfully completed ${totalVisitsToday} visit${totalVisitsToday > 1 ? 's' : ''} today.`}
          </Text>
        </View>
      </ScrollView>

      <LocationDisclosureModal 
        visible={disclosureVisible} 
        onAccept={handleDisclosureAccept} 
        onDecline={() => setDisclosureVisible(false)} 
      />

      <TransportModal
        visible={transportModalVisible}
        currentMode={currentTransport}
        onClose={() => setTransportModalVisible(false)}
        onSelectMode={async (mode, photo) => {
          try {
            await setTransportMode(mode, photo);
          } catch (error: any) {
            Alert.alert("Change Failed", error.message || "Could not update transport mode.");
          }
        }}
      />
      
      <VisitModal 
        visible={visitModalVisible} 
        onClose={() => setVisitModalVisible(false)} 
        onStartVisit={async (id, name, address) => {
          await startVisit(id, name, address);
        }} 
      />
      
      {activeVisit && (
        <EndVisitModal
          visible={endVisitModalVisible}
          dealerName={activeVisit.dealerName}
          onClose={() => setEndVisitModalVisible(false)}
          onSubmit={async (data) => {
            await endVisit(data);
            // Removed syncAttendanceDetails() to prevent race condition override
          }}
        />
      )}
      
      <PunchOutModal
        visible={punchOutModalVisible}
        activeTransport={currentTransport}
        onClose={() => setPunchOutModalVisible(false)}
        onConfirmCheckout={handlePunchOutConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white },
  greeting: { fontSize: 20, fontFamily: typography.bold, color: INK },
  date: { fontSize: 13, fontFamily: typography.medium, color: MUTED, marginTop: 4 },
  profileBtn: { padding: 8, backgroundColor: colors.surface, borderRadius: 20 },
  headerRule: { height: 1, backgroundColor: colors.border },
  content: { padding: spacing.md },
  
  section: { backgroundColor: colors.white, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 11, fontFamily: typography.bold, color: MUTED, marginBottom: spacing.sm, letterSpacing: 0.5 },
  
  trackingHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  onDutyContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  dealerName: { fontSize: 18, fontFamily: typography.bold, color: INK },
  metaLine: { fontSize: 13, fontFamily: typography.medium, color: MUTED, marginTop: 4 },
  
  punchOutBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.error },
  punchOutBoxText: { fontSize: 12, fontFamily: typography.bold, color: colors.error },
  
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  transportRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  transportInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  transportText: { fontSize: 13, fontFamily: typography.medium, color: MUTED },
  transportValue: { fontFamily: typography.bold, color: INK },
  
  textAction: { paddingHorizontal: 8, paddingVertical: 4 },
  textActionLabel: { fontSize: 13, fontFamily: typography.bold, color: MUTED },
  
  activeVisitCard: { backgroundColor: INK, padding: spacing.lg, borderRadius: radius.sm, marginBottom: spacing.lg },
  activeVisitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  pulseTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pulseText: { fontSize: 10, fontFamily: typography.bold, color: colors.success, letterSpacing: 0.5 },
  timeStarted: { fontSize: 12, fontFamily: typography.medium, color: colors.surface },
  activeDealerName: { fontSize: 22, fontFamily: typography.bold, color: colors.white, marginBottom: 4 },
  activeDealerAddress: { fontSize: 13, fontFamily: typography.medium, color: colors.surface, opacity: 0.8 },
  endVisitBtn: { backgroundColor: colors.white, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.xl },
  endVisitBtnText: { color: INK, fontSize: 14, fontFamily: typography.bold },

  offDutySection: { alignItems: "center", paddingVertical: spacing.xxl, borderWidth: 0, backgroundColor: "transparent" },
  offDutySubtitle: { fontSize: 14, fontFamily: typography.medium, color: MUTED, marginBottom: spacing.xl },
  primaryBtn: { backgroundColor: ACCENT, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: radius.sm, paddingHorizontal: spacing.lg },
  primaryBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
  
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionCount: { backgroundColor: colors.surface, color: INK, fontSize: 12, fontFamily: typography.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: "hidden" },
  emptyVisits: { fontSize: 13, fontFamily: typography.medium, color: MUTED, marginTop: spacing.sm },
});