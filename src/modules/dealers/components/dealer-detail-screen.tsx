import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DealerDetailScreen() {
  const router = useRouter();
  const { cardCode } = useLocalSearchParams<{ cardCode: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
  });

  const dealer = data?.find((d) => d.cardCode === cardCode);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerBox}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dealer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerBox}>
          <Feather name="alert-circle" size={40} color={colors.muted} />
          <Text style={styles.text}>Dealer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = dealer.portalStatus === "Yes" && dealer.lock_status !== 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.dealerName}>{dealer.cardName}</Text>
            <View style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillInactive]}>
              <Text style={[styles.statusPillText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <Text style={styles.infoLine}>
            Code: {dealer.cardCode} | Mobile: {dealer.phone1} | Email: {dealer.emailAddress} | Sales Manager: {dealer.salesManager}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },

  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  headerTitleBlock: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  dealerName: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.xl },
  statusPillActive: { backgroundColor: "#F0FDF4" },
  statusPillInactive: { backgroundColor: colors.surface },
  statusPillText: { fontSize: 10, fontFamily: typography.bold },
  statusTextActive: { color: colors.success },
  statusTextInactive: { color: colors.muted },
  infoLine: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, lineHeight: 16 },
});