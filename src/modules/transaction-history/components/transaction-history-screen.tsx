import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { fetchTransactionHistory } from "@/modules/transaction-history/services/transaction-history.api";
import { Transaction } from "@/modules/transaction-history/types";
import { SkeletonList } from "@/components/custom/skeleton";
import { Feather } from "@react-native-vector-icons/feather/static";
import { LegendList } from "@legendapp/list/react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { BackHandler, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getStatusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "success" || normalized === "approved") {
    return { bg: "#F0FDF4", text: colors.success };
  }
  if (normalized === "rejected" || normalized === "cancelled" || normalized === "failed") {
    return { bg: "#FEF2F2", text: colors.error };
  }
  return { bg: "#FFFBEB", text: "#B45309" };
};

const calcAmount = (lines: Transaction["documentLines"]) => {
  if (!lines?.length) return 0;
  return lines.reduce((sum, line) => sum + (line.Quantity || 0) * (line.UnitPrice || 0), 0);
};

const calcQty = (lines: Transaction["documentLines"]) => {
  if (!lines?.length) return 0;
  return lines.reduce((sum, line) => sum + (line.Quantity || 0), 0);
};

const getWarehouse = (lines: Transaction["documentLines"]) => {
  return lines?.[0]?.WarehouseCode || "-";
};

const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  return new Date(isoDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (val: number) =>
  val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TransactionHistoryScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push("/sales-manager-modules");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [router]),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["transaction-history"],
    queryFn: fetchTransactionHistory,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (t) =>
        t.card_name?.toLowerCase().includes(query) ||
        t.cardCode?.toLowerCase().includes(query) ||
        String(t.series ?? "").includes(query),
    );
  }, [data, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderRow = ({ item }: { item: Transaction }) => {
    const statusStyle = getStatusStyle(item.u_DealerStatus);
    const amount = calcAmount(item.documentLines);
    const qty = calcQty(item.documentLines);
    const stock = getWarehouse(item.documentLines);
    const isExpanded = expandedIds.has(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.soBadge}>
            <Feather name="hash" size={11} color={colors.text} />
            <Text style={styles.soNo}>SO-{item.series}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.u_DealerStatus || "Pending"}
            </Text>
          </View>
        </View>

        <Text style={styles.dealerName} numberOfLines={1}>
          {item.card_name}
        </Text>
        <Text style={styles.dealerCode}>{item.cardCode}</Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Date</Text>
            <Text style={styles.statValue}>{formatDate(item.docDate)}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Stock</Text>
            <Text style={styles.statValue}>{stock}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Qty</Text>
            <Text style={styles.statValue}>{qty}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Amount</Text>
            <Text style={styles.amountValue}>Rs. {formatCurrency(amount)}</Text>
          </View>
        </View>

               <TouchableOpacity style={styles.actionRow} onPress={() => toggleExpand(item.id)}>
          <Text style={styles.actionText}>{isExpanded ? "Hide items" : "View items"}</Text>
          <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedBox}>
            {item.documentLines?.map((line, idx) => (
              <View key={idx} style={styles.lineItem}>
                <Text style={styles.lineItemCode} numberOfLines={1}>
                  {line.ItemCode}
                </Text>
                <Text style={styles.lineItemQty}>
                  {line.Quantity} x Rs.{line.UnitPrice}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.push("/sales-manager-modules")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Transaction History</Text>
        </View>
        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by dealer, code, or doc no..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              <Feather name="x-circle" size={13} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={28} color={colors.muted} />
          </View>
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <LegendList
          data={filteredData}
          keyExtractor={(item: Transaction) => String(item.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={220}
          recycleItems
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { padding: spacing.md, gap: spacing.sm },

  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  soBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  soNo: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  statusBadgeText: { fontSize: txtSize.xs, fontFamily: typography.semibold },

  dealerName: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  dealerCode: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 1 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBlock: { minWidth: "45%" },
  statLabel: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  statValue: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },
  amountValue: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.primary },

  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    actionText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary },

  expandedBox: { marginTop: 8, backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm, gap: 6 },
  lineItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lineItemCode: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, flex: 1 },
  lineItemQty: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },
});