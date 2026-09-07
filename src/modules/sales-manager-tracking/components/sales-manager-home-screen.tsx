import { LiveClock } from "@/components/custom/live-clock";
import { PulseDot } from "@/components/custom/pulse-dot";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { getGreeting } from "@/utils/greeting";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
  requestTrackingPermissions,
  startLiveTracking,
  stopLiveTracking,
} from "../services/tracking-task";
import { useTrackingStore } from "../store/tracking.store";
import { EndVisitModal } from "./end-visit-modal";
import { PunchOutModal } from "./punch-out-modal";
import { TransportModal } from "./transport-modal";
import { VisitModal } from "./visit-modal";

const INK = "#0F172A";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const HAIRLINE = "#E2E8F0";
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
    currentTransport,
    activeVisit,
    completedVisits,
    initializeStore,
    punchIn,
    punchOut,
    setTransportMode,
    startVisit,
    endVisit,
  } = useTrackingStore();

  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [endVisitModalVisible, setEndVisitModalVisible] = useState(false);
  const [punchOutModalVisible, setPunchOutModalVisible] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(getGreeting());

  const { user } = useAuth()
  const { navigate } = useRouter()

  useEffect(() => {
    initializeStore();
    // Optional: Refresh greeting every minute in case they leave the app open across boundaries
    const greetingInterval = setInterval(() => setCurrentGreeting(getGreeting()), 60000);
    return () => clearInterval(greetingInterval);
  }, []);

  const heroOpacity = useSharedValue(0);
  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 300 });
  }, []);
  const heroAnimatedStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));

  const handlePunchIn = async () => {
    const granted = await requestTrackingPermissions();
    if (!granted) {
      Alert.alert(
        "Permission Denied",
        "Background location is required to track your sales route. Enable 'Allow all the time' in Settings."
      );
      return;
    }
    await punchIn("Walking");
    await startLiveTracking();
  };

  const handlePunchOutConfirm = async (data?: any) => {
    if (data) console.log("[SalesManagerHome] Closing Odometer Data:", data);
    await stopLiveTracking();
    await punchOut();
  };

  const navigateToProfile = () => {
    navigate("/profile")
  }

  const todayString = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={{ width: "90%" }}>
          <Text numberOfLines={1} style={styles.greeting}>{currentGreeting}, {user?.name?.trim()}</Text>
          <Text style={styles.date}>{todayString}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={navigateToProfile} style={styles.profileBtn}>
            <Feather name="user" size={18} color={INK} />
          </TouchableOpacity>
        </View>
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
              <PrimaryButton title="Start Dealer Visit" icon="map-pin" onPress={() => setVisitModalVisible(true)} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.section, styles.offDutySection, heroAnimatedStyle]}>
            <LiveClock />
            <Text style={styles.offDutySubtitle}>You are currently not on duty</Text>
            <PrimaryButton title="Punch In & Start Your Day" icon="power" onPress={handlePunchIn} />
          </Animated.View>
        )}

        <View style={{ height: spacing.xl }} />

        {/* 2. TODAY'S VISITS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>TODAY'S VISITS</Text>
            <Text style={styles.sectionCount}>{completedVisits.length}</Text>
          </View>

          {completedVisits.length === 0 ? (
            <Text style={styles.emptyVisits}>No visits completed yet today.</Text>
          ) : (
            completedVisits.map((item, i) => (
              <View key={item.id} style={[styles.historyRow, i === 0 && styles.historyRowFirst]}>
                <View style={styles.historyRowHeader}>
                  <Text style={styles.historyName}>{item.dealerName}</Text>
                  <Text style={styles.historyDuration}>
                    {item.startTime} – {item.endTime}
                  </Text>
                </View>
                <Text style={styles.historyConclusion} numberOfLines={2}>
                  {item.conclusion}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TransportModal
        visible={transportModalVisible}
        currentMode={currentTransport}
        onClose={() => setTransportModalVisible(false)}
        onSelectMode={(mode, photo) => setTransportMode(mode, photo)}
      />
      <VisitModal visible={visitModalVisible} onClose={() => setVisitModalVisible(false)} onStartVisit={(visit) => startVisit(visit)} />
      {activeVisit && (
        <EndVisitModal
          visible={endVisitModalVisible}
          dealerName={activeVisit.dealerName}
          onClose={() => setEndVisitModalVisible(false)}
          onSubmit={(conclusion) => endVisit(conclusion)}
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
  safeArea: { flex: 1, backgroundColor: colors.white },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  greeting: { fontSize: 20, fontFamily: typography.bold, color: INK, letterSpacing: -0.7 },
  date: { fontSize: 12, fontFamily: typography.medium, color: MUTED, marginTop: 2 },
  headerRight: { alignItems: "flex-end", gap: 6, justifyContent: "center" },
  profileBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: HAIRLINE },
  headerRule: { height: 1, backgroundColor: HAIRLINE, marginHorizontal: spacing.lg },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },

  // Sections
  section: { paddingBottom: spacing.xl, marginBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: HAIRLINE },
  sectionLabel: { fontSize: 11, fontFamily: typography.bold, color: MUTED, letterSpacing: 0.8, marginBottom: spacing.sm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sectionCount: { fontSize: 11, fontFamily: typography.bold, color: FAINT },

  // Tracking Row Layout
  trackingHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  onDutyContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  dealerName: { fontSize: 22, fontFamily: typography.bold, color: INK, letterSpacing: -0.3 },
  dealerAddress: { fontSize: 13, fontFamily: typography.regular, color: MUTED, marginBottom: 6 },
  metaLine: { fontSize: 12, fontFamily: typography.medium, color: FAINT },

  divider: { height: 1, backgroundColor: HAIRLINE, marginVertical: spacing.lg },

  // Active Visit Dark Card
  activeVisitCard: { backgroundColor: "#1E293B", padding: spacing.xl, borderRadius: 12, marginBottom: spacing.xl },
  activeVisitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  pulseTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 68, 68, 0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  pulseText: { color: "#FCA5A5", fontSize: 10, fontFamily: typography.bold, letterSpacing: 0.5 },
  timeStarted: { color: "#94A3B8", fontSize: 11, fontFamily: typography.medium },
  activeDealerName: { fontSize: 20, fontFamily: typography.bold, color: colors.white, marginBottom: 4 },
  activeDealerAddress: { fontSize: 13, fontFamily: typography.regular, color: "#94A3B8", marginBottom: spacing.xl, lineHeight: 20 },
  endVisitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#059669", paddingVertical: 14, borderRadius: 6 },
  endVisitBtnText: { color: colors.white, fontSize: 14, fontFamily: typography.bold },

  // Off-duty state
  offDutySection: { alignItems: "center", paddingTop: spacing.md, borderBottomWidth: 0, marginBottom: 0 },
  offDutySubtitle: { fontSize: 13, fontFamily: typography.medium, color: MUTED, marginBottom: spacing.xl },

  // Buttons & Actions
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", paddingVertical: 15, borderRadius: 6, backgroundColor: ACCENT },
  primaryBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white, letterSpacing: 0.2 },
  textAction: { paddingVertical: 2 },
  textActionLabel: { fontSize: 13, fontFamily: typography.bold, color: ACCENT },

  punchOutBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  punchOutBoxText: { fontSize: 12, fontFamily: typography.bold, color: colors.error },

  // Transport row
  transportRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  transportInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  transportText: { fontSize: 13, fontFamily: typography.medium, color: MUTED },
  transportValue: { fontFamily: typography.bold, color: INK },

  // Today's visits
  emptyVisits: { fontSize: 13, fontFamily: typography.medium, color: FAINT, paddingVertical: spacing.xs },
  historyRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: HAIRLINE },
  historyRowFirst: { borderTopWidth: 0, paddingTop: 0 },
  historyRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyName: { fontSize: 13, fontFamily: typography.bold, color: INK },
  historyDuration: { fontSize: 11, fontFamily: typography.medium, color: FAINT },
  historyConclusion: { fontSize: 12, fontFamily: typography.regular, color: MUTED, marginTop: 2 },
});