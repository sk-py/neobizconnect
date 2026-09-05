import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { fetchDealerLedger } from "@/modules/dealers/services/dealer-ledger.api";
import { fetchDealerPendingOrders } from "@/modules/dealers/services/dealer-pending-orders.api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STAT_CARDS = [
  { key: "pendingOrders", label: "Pending Orders", icon: "shopping-cart" },
  { key: "proformaInvoices", label: "Proforma Invoices", icon: "file-text" },
  { key: "arInvoices", label: "AR Invoices", icon: "dollar-sign" },
  { key: "arCreditMemos", label: "AR Credit Memos", icon: "credit-card" },
  { key: "targetAssigned", label: "Target Assigned", icon: "target" },
  { key: "achievement", label: "Achievement", icon: "award" },
] as const;

const TABS = [
  { key: "pendingOrders", label: "Pending Orders" },
  { key: "proformaInvoice", label: "Proforma Invoice" },
  { key: "arInvoice", label: "AR Invoice" },
  { key: "arCreditMemo", label: "AR Credit Memo" },
  { key: "ledgerSummary", label: "Ledger Summary" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const formatCurrency = (val: number) =>
  (val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function DealerDetailScreen() {
  const router = useRouter();
  const { cardCode } = useLocalSearchParams<{ cardCode: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("pendingOrders");

  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
  });

  const dealer = data?.find((d) => d.cardCode === cardCode);

  const ledgerQuery = useQuery({
    queryKey: ["dealer-ledger", cardCode],
    queryFn: () => fetchDealerLedger(cardCode),
    enabled: activeTab === "ledgerSummary" && !!cardCode,
  });

  const pendingOrdersQuery = useQuery({
    queryKey: ["dealer-pending-orders", cardCode],
    queryFn: () => fetchDealerPendingOrders(cardCode),
    enabled: activeTab === "pendingOrders" && !!cardCode,
  });

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

  const renderTabContent = () => {
    if (activeTab === "ledgerSummary") {
      if (ledgerQuery.isLoading) {
        return (
          <View style={styles.tabContentBox}>
            <Text style={styles.tabContentTitle}>Loading ledger...</Text>
          </View>
        );
      }

      if (ledgerQuery.isError) {
        return (
          <View style={styles.tabContentBox}>
            <Feather name="alert-triangle" size={26} color={colors.error} />
            <Text style={styles.tabContentTitle}>Couldn't load ledger</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => ledgerQuery.refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const entries = ledgerQuery.data?.AccountBalance ?? [];

      if (entries.length === 0) {
        return (
          <View style={styles.tabContentBox}>
            <View style={styles.tabContentIconCircle}>
              <Feather name="inbox" size={26} color={colors.muted} />
            </View>
            <Text style={styles.tabContentTitle}>No ledger entries</Text>
          </View>
        );
      }

      return (
        <View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Account Balance</Text>
            <Text style={styles.balanceValue}>
              Rs. {formatCurrency(ledgerQuery.data?.TotalCumulativeBalanceLC ?? 0)}
            </Text>
          </View>
          {entries.map((entry, idx) => (
            <View key={idx} style={styles.ledgerRow}>
              <View style={styles.ledgerRowTop}>
                <Text style={styles.ledgerDocName} numberOfLines={1}>
                  {entry.Origin || "Entry"}
                </Text>
                <Text style={styles.ledgerDate}>{formatDate(entry.PostingDate)}</Text>
              </View>
              <Text style={styles.ledgerDetails} numberOfLines={2}>
                {entry.Details}
              </Text>
              <View style={styles.ledgerAmountsRow}>
                {entry.DebitLC > 0 && (
                  <Text style={styles.ledgerDebit}>Debit: Rs. {formatCurrency(entry.DebitLC)}</Text>
                )}
                {entry.CreditLC > 0 && (
                  <Text style={styles.ledgerCredit}>Credit: Rs. {formatCurrency(entry.CreditLC)}</Text>
                )}
                <Text style={styles.ledgerBalance}>
                  Bal: Rs. {formatCurrency(entry.CumulativeBalanceLC)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === "pendingOrders") {
      if (pendingOrdersQuery.isLoading) {
        return (
          <View style={styles.tabContentBox}>
            <Text style={styles.tabContentTitle}>Loading pending orders...</Text>
          </View>
        );
      }
      if (pendingOrdersQuery.isError) {
        return (
          <View style={styles.tabContentBox}>
            <Feather name="alert-triangle" size={26} color={colors.error} />
            <Text style={styles.tabContentTitle}>Couldn't load pending orders</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => pendingOrdersQuery.refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }
      // DEBUG: temporary, check terminal console log for raw shape
      return (
        <View style={styles.tabContentBox}>
          <Text style={styles.tabContentTitle}>Check terminal for raw response</Text>
          <Text style={styles.tabContentSubtitle}>
            Count: {Array.isArray(pendingOrdersQuery.data) ? pendingOrdersQuery.data.length : "not an array"}
          </Text>
        </View>
      );
    }

    // Other tabs still pending their APIs
    const label = TABS.find((t) => t.key === activeTab)?.label ?? "";
    return (
      <View style={styles.tabContentBox}>
        <View style={styles.tabContentIconCircle}>
          <Feather name="inbox" size={26} color={colors.muted} />
        </View>
        <Text style={styles.tabContentTitle}>{label}</Text>
        <Text style={styles.tabContentSubtitle}>Awaiting API endpoint for this tab</Text>
      </View>
    );
  };

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
            Code: {dealer.cardCode} | Mobile:{" "}
            <Text style={styles.infoLink} onPress={() => Linking.openURL(`tel:${dealer.phone1}`)}>
              {dealer.phone1}
            </Text>
            {" | "}Email:{" "}
            <Text style={styles.infoLink} onPress={() => Linking.openURL(`mailto:${dealer.emailAddress}`)}>
              {dealer.emailAddress}
            </Text>
            {" | "}Sales Manager: {dealer.salesManager}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((stat) => (
            <View key={stat.key} style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Feather name={stat.icon as any} size={14} color={colors.textSecondary} />
              </View>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              <View style={styles.statPendingBadge}>
                <Text style={styles.statPendingText}>awaiting API</Text>
              </View>
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderTabContent()}
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
  infoLink: { color: colors.text, fontFamily: typography.semibold },

  scrollContent: { padding: spacing.md },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  statCard: { width: "31%", backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 4 },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  statLabel: { fontSize: 10, fontFamily: typography.semibold, color: colors.textSecondary },
  statPendingBadge: { alignSelf: "flex-start", backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  statPendingText: { fontSize: 8, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },

  tabBar: { marginBottom: spacing.sm },
  tabBarContent: { gap: 6 },
  tabItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  tabContentBox: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: 8 },
  tabContentIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  tabContentTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  tabContentSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },

  balanceCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, alignItems: "center" },
  balanceLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 4 },
  balanceValue: { fontSize: 20, fontFamily: typography.bold, color: colors.primary },

  ledgerRow: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs },
  ledgerRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ledgerDocName: { fontSize: 12, fontFamily: typography.bold, color: colors.text, flex: 1 },
  ledgerDate: { fontSize: 10, fontFamily: typography.medium, color: colors.muted },
  ledgerDetails: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 6 },
  ledgerAmountsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ledgerDebit: { fontSize: 10, fontFamily: typography.semibold, color: colors.error },
  ledgerCredit: { fontSize: 10, fontFamily: typography.semibold, color: colors.success },
  ledgerBalance: { fontSize: 10, fontFamily: typography.semibold, color: colors.text },
});