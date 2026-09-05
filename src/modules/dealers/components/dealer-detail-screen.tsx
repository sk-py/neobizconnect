import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { fetchDealerLedger } from "@/modules/dealers/services/dealer-ledger.api";
import { fetchDealerPendingOrders } from "@/modules/dealers/services/dealer-pending-orders.api";
import { fetchDealerProformaInvoices } from "@/modules/dealers/services/dealer-proforma-invoice.api";
import { fetchDealerArInvoices } from "@/modules/dealers/services/dealer-ar-invoice.api";
import { fetchDealerArCreditMemos } from "@/modules/dealers/services/dealer-ar-credit-memo.api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const pick = (obj: any, keys: string[]): any => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

const DOC_NO_KEYS = ["DocNum", "docNum", "OrderNo", "ProformaNo", "InvoiceNo", "CreditNo", "DocEntry"];
const CARD_CODE_KEYS = ["CardCode", "cardCode", "ClientCode"];
const CARD_NAME_KEYS = ["CardName", "cardName", "ClientName"];
const DATE_KEYS = ["DocDate", "docDate", "OrderDate", "ProformaDate", "InvoiceDate", "PostingDate"];
const STATUS_KEYS = ["DocumentStatus", "Status", "u_DealerStatus", "U_DealerStatus", "DealerStatus"];
const QTY_KEYS = ["Quantity", "TotalQty", "U_TotalQty", "Qty"];
const AMOUNT_KEYS = ["DocTotal", "docTotal", "Amount", "TotalAmount"];

const getStatusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("open") || normalized.includes("pending")) {
    return { bg: "#FFFBEB", text: "#B45309" };
  }
  if (normalized.includes("close") || normalized.includes("approved") || normalized.includes("paid")) {
    return { bg: "#F0FDF4", text: colors.success };
  }
  if (normalized.includes("cancel") || normalized.includes("reject")) {
    return { bg: "#FEF2F2", text: colors.error };
  }
  return { bg: colors.surface, text: colors.textSecondary };
};

type GenericDocCardProps = { item: any; docPrefix: string };

const GenericDocCard = ({ item, docPrefix }: GenericDocCardProps) => {
  const docNo = pick(item, DOC_NO_KEYS);
  const cardName = pick(item, CARD_NAME_KEYS);
  const cardCode = pick(item, CARD_CODE_KEYS);
  const date = pick(item, DATE_KEYS);
  const status = pick(item, STATUS_KEYS);
  const qty = pick(item, QTY_KEYS);
  const amount = pick(item, AMOUNT_KEYS);
  const statusStyle = getStatusStyle(status);

  return (
    <View style={styles.ledgerCard}>
      <View style={styles.ledgerCardTop}>
        <Text style={styles.ledgerDocName} numberOfLines={1}>
          {docPrefix}
          {docNo ?? "-"}
        </Text>
        {status && (
          <View style={[styles.ledgerTypeBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.ledgerTypeBadgeText, { color: statusStyle.text }]}>{status}</Text>
          </View>
        )}
      </View>

      {(cardName || cardCode) && (
        <Text style={styles.ledgerDetails} numberOfLines={1}>
          {cardName}
          {cardCode ? ` (${cardCode})` : ""}
        </Text>
      )}

      <View style={styles.ledgerDivider} />

      <View style={styles.ledgerInfoRow}>
        <View style={styles.ledgerInfoBlock}>
          <Text style={styles.ledgerInfoLabel}>Date</Text>
          <Text style={styles.ledgerInfoValue}>{date ? formatDate(date) : "-"}</Text>
        </View>
        {qty !== undefined && (
          <View style={styles.ledgerInfoBlock}>
            <Text style={styles.ledgerInfoLabel}>Qty</Text>
            <Text style={styles.ledgerInfoValue}>{qty}</Text>
          </View>
        )}
      </View>

      {amount !== undefined && (
        <View style={styles.ledgerBalanceRow}>
          <Text style={styles.ledgerBalanceLabel}>Amount</Text>
          <Text style={styles.ledgerBalanceValue}>Rs. {formatCurrency(amount)}</Text>
        </View>
      )}
    </View>
  );
};

const renderGenericDocList = (
  query: UseQueryResult<any>,
  docPrefix: string,
  emptyLabel: string,
) => {
  if (query.isLoading) {
    return (
      <View style={styles.tabContentBox}>
        <Text style={styles.tabContentTitle}>Loading...</Text>
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.tabContentBox}>
        <Feather name="alert-triangle" size={26} color={colors.error} />
        <Text style={styles.tabContentTitle}>Couldn't load data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = Array.isArray(query.data) ? query.data : [];

  if (items.length === 0) {
    return (
      <View style={styles.tabContentBox}>
        <View style={styles.tabContentIconCircle}>
          <Feather name="inbox" size={26} color={colors.muted} />
        </View>
        <Text style={styles.tabContentTitle}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View>
      {items.map((item, idx) => (
        <GenericDocCard key={idx} item={item} docPrefix={docPrefix} />
      ))}
    </View>
  );
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
    enabled: !!cardCode,
  });

  const pendingOrdersQuery = useQuery({
    queryKey: ["dealer-pending-orders", cardCode],
    queryFn: () => fetchDealerPendingOrders(cardCode),
    enabled: !!cardCode,
  });

  const proformaInvoiceQuery = useQuery({
    queryKey: ["dealer-proforma-invoice", cardCode],
    queryFn: () => fetchDealerProformaInvoices(cardCode),
    enabled: !!cardCode,
  });

  const arInvoiceQuery = useQuery({
    queryKey: ["dealer-ar-invoice", cardCode],
    queryFn: () => fetchDealerArInvoices(cardCode),
    enabled: !!cardCode,
  });

  const arCreditMemoQuery = useQuery({
    queryKey: ["dealer-ar-credit-memo", cardCode],
    queryFn: () => fetchDealerArCreditMemos(cardCode),
    enabled: !!cardCode,
  });

  const getCount = (query: UseQueryResult<any>) =>
    Array.isArray(query.data) ? query.data.length : query.isLoading ? null : 0;

  const STAT_CARDS = [
    {
      key: "pendingOrders",
      label: "Pending Orders",
      icon: "shopping-cart",
      bg: "#DBEAFE",
      iconColor: "#2563EB",
      value: getCount(pendingOrdersQuery),
    },
    {
      key: "proformaInvoices",
      label: "Proforma Invoices",
      icon: "file-text",
      bg: "#EDE9FE",
      iconColor: "#7C3AED",
      value: getCount(proformaInvoiceQuery),
    },
    {
      key: "arInvoices",
      label: "AR Invoices",
      icon: "check-circle",
      bg: "#DCFCE7",
      iconColor: "#16A34A",
      value: getCount(arInvoiceQuery),
    },
    {
      key: "arCreditMemos",
      label: "AR Credit Memos",
      icon: "rotate-ccw",
      bg: "#FEE2E2",
      iconColor: "#DC2626",
      value: getCount(arCreditMemoQuery),
    },
    {
      key: "targetAssigned",
      label: "Target Assigned",
      icon: "target",
      bg: "#FEF3C7",
      iconColor: "#D97706",
      value: null,
    },
    {
      key: "achievement",
      label: "Achievement",
      icon: "award",
      bg: "#FFEDD5",
      iconColor: "#EA580C",
      value: null,
    },
  ] as const;

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
          {entries.map((entry, idx) => {
            const isDebit = entry.DebitLC > 0;
            return (
              <View key={idx} style={styles.ledgerCard}>
                <View style={styles.ledgerCardTop}>
                  <Text style={styles.ledgerDocName} numberOfLines={1}>
                    {entry.Origin || "Entry"}
                  </Text>
                  <View
                    style={[
                      styles.ledgerTypeBadge,
                      isDebit ? styles.ledgerTypeBadgeDebit : styles.ledgerTypeBadgeCredit,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ledgerTypeBadgeText,
                        isDebit ? styles.ledgerTypeTextDebit : styles.ledgerTypeTextCredit,
                      ]}
                    >
                      {isDebit ? "Debit" : "Credit"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ledgerDetails} numberOfLines={2}>
                  {entry.Details}
                </Text>

                <View style={styles.ledgerDivider} />

                <View style={styles.ledgerInfoRow}>
                  <View style={styles.ledgerInfoBlock}>
                    <Text style={styles.ledgerInfoLabel}>Date</Text>
                    <Text style={styles.ledgerInfoValue}>{formatDate(entry.PostingDate)}</Text>
                  </View>
                  <View style={styles.ledgerInfoBlock}>
                    <Text style={styles.ledgerInfoLabel}>Amount</Text>
                    <Text style={styles.ledgerInfoValue}>
                      Rs. {formatCurrency(isDebit ? entry.DebitLC : entry.CreditLC)}
                    </Text>
                  </View>
                </View>

                <View style={styles.ledgerBalanceRow}>
                  <Text style={styles.ledgerBalanceLabel}>Running Balance</Text>
                  <Text style={styles.ledgerBalanceValue}>
                    Rs. {formatCurrency(entry.CumulativeBalanceLC)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (activeTab === "pendingOrders") {
      return renderGenericDocList(pendingOrdersQuery, "SO-", "No pending orders");
    }

    if (activeTab === "proformaInvoice") {
      return renderGenericDocList(proformaInvoiceQuery, "PI-", "No proforma invoices");
    }

    if (activeTab === "arInvoice") {
      return renderGenericDocList(arInvoiceQuery, "INV-", "No AR invoices");
    }

    if (activeTab === "arCreditMemo") {
      return renderGenericDocList(arCreditMemoQuery, "CM-", "No AR credit memos");
    }

    return null;
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

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="hash" size={12} color={colors.muted} />
              <Text style={styles.infoText}>{dealer.cardCode}</Text>
            </View>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL(`tel:${dealer.phone1}`)}
            >
              <Feather name="phone" size={12} color={colors.muted} />
              <Text style={[styles.infoText, styles.infoTextLink]}>{dealer.phone1}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL(`mailto:${dealer.emailAddress}`)}
            >
              <Feather name="mail" size={12} color={colors.muted} />
              <Text style={[styles.infoText, styles.infoTextLink]} numberOfLines={1}>
                {dealer.emailAddress}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoItem}>
              <Feather name="user" size={12} color={colors.muted} />
              <Text style={styles.infoText} numberOfLines={1}>
                {dealer.salesManager}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((stat) => (
            <View key={stat.key} style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: stat.bg }]}>
                <Feather name={stat.icon as any} size={20} color={stat.iconColor} />
              </View>
              <Text style={styles.statValue}>{stat.value === null ? "--" : stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              {stat.value === null && (
                <View style={styles.statPendingBadge}>
                  <Text style={styles.statPendingText}>awaiting API</Text>
                </View>
              )}
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

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
  infoText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flexShrink: 1 },
  infoTextLink: { color: colors.text, fontFamily: typography.semibold },

  scrollContent: { padding: spacing.md },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  statCard: { width: "47%", backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 22, fontFamily: typography.bold, color: colors.text },
  statLabel: { fontSize: 12, fontFamily: typography.semibold, color: colors.textSecondary },
  statPendingBadge: { alignSelf: "flex-start", backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  statPendingText: { fontSize: 9, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },

  tabBar: { marginBottom: spacing.sm },
  tabBarContent: { gap: 6 },
    tabItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  tabContentBox: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: 8 },
  tabContentIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  tabContentTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  tabContentSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },

  balanceCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, alignItems: "center" },
  balanceLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 6 },
  balanceValue: { fontSize: 24, fontFamily: typography.bold, color: colors.primary },

  ledgerCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  ledgerCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  ledgerDocName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  ledgerTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
  ledgerTypeBadgeDebit: { backgroundColor: "#FEF2F2" },
  ledgerTypeBadgeCredit: { backgroundColor: "#F0FDF4" },
  ledgerTypeBadgeText: { fontSize: 11, fontFamily: typography.bold },
  ledgerTypeTextDebit: { color: colors.error },
  ledgerTypeTextCredit: { color: colors.success },
  ledgerDetails: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.sm },
  ledgerDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  ledgerInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  ledgerInfoBlock: { flex: 1 },
  ledgerInfoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  ledgerInfoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  ledgerBalanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  ledgerBalanceLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  ledgerBalanceValue: { fontSize: 14, fontFamily: typography.bold, color: colors.primary },
});