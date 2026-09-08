import { colors, radius } from "@/constants/theme";
import { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const SkeletonBlock = ({ style }: { style?: ViewStyle }) => {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return <Animated.View style={[styles.block, style, animatedStyle]} />;
};

// A generic skeleton "card" shape reusable for any list screen —
// mimics: title bar, subtitle bar, and a couple of detail rows.
export const SkeletonListCard = () => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <SkeletonBlock style={{ width: "50%", height: 16, borderRadius: 4 }} />
      <SkeletonBlock style={{ width: 50, height: 14, borderRadius: radius.sm }} />
    </View>
    <SkeletonBlock style={{ width: "35%", height: 12, borderRadius: 4, marginTop: 8 }} />
    <View style={styles.divider} />
    <View style={styles.detailRow}>
      <SkeletonBlock style={{ width: "40%", height: 12, borderRadius: 4 }} />
      <SkeletonBlock style={{ width: "30%", height: 12, borderRadius: 4 }} />
    </View>
  </View>
);

export const SkeletonList = ({ count = 6 }: { count?: number }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonListCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  listContainer: { padding: 12 },
});