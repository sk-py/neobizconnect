import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STAT_CARDS = [
  { key: "pendingOrders", label: "Pending Orders", icon: "shopping-cart" },
  { key: "proformaInvoices", label: "Proforma Invoices", icon: "file-text" },
  { key: "arInvoices", label: "AR Invoices", icon: "dollar-sign" },
  { key: "arCreditMemos", label: "AR Credit Memos", icon: "credit-card" },
  { key: "targetAssigned", label: "Target Assigned", icon: "target" },
  { key: "achievement", label: "Achievement", icon: "award" },
] as const;

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/*
          IMPORTANT: These stat cards are UI placeholders only.
          The real numbers require separate API endpoints (per dealer)
          that we don't have yet. Do NOT treat the "--" as real data.
          Swap in real values once the TL provides these endpoints.
        */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((stat) => (
            <View key={stat.key} style={styles.statCard}>
              <Feather name={stat.icon as any} size={16} color={colors.primary} />
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statPending}>awaiting API</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },

  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
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

  scrollContent: { padding: spacing.md },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "31%", backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: "flex-start", gap: 4 },
  statValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  statLabel: { fontSize: 10, fontFamily: typography.semibold, color: colors.textSecondary },
  statPending: { fontSize: 9, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },
});