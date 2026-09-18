import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { fetchTransactionHistory } from "@/modules/transaction-history/services/transaction-history.api";
import { Transaction } from "@/modules/transaction-history/types";
import { SkeletonList } from "@/components/custom/skeleton";
import { Feather } from "@react-native-vector-icons/feather/static";
import { LegendList } from "@legendapp/list/react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { BackHandler, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const { user } = useAuth();
  const isAdmin = user?.authority === "Admin" || user?.authority === "Super Admin";

  const goBack = () => {
    if (isAdmin) {
      router.push("/dashboard");
    } else {
      router.push("/sales-manager-modules");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [router, isAdmin]),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

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

  const renderRow = ({ item }: { item: Transaction }) => {
    const statusStyle = getStatusStyle(item.u_DealerStatus);
    const amount = calcAmount(item.documentLines);
    const qty = calcQty(item.documentLines);
    const stock = getWarehouse(item.documentLines);

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

        {isAdmin && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setSelectedTxn(item)}
          >
            <Feather name="eye" size={14} color={colors.textSecondary} />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={goBack}
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
        />
      )}

      <Modal
        visible={selectedTxn !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTxn(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedTxn(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <>
                <View style={styles.modalSummaryBox}>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>SO No</Text>
                    <Text style={styles.modalSummaryValue}>{selectedTxn.series}</Text>
                  </View>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Date</Text>
                    <Text style={styles.modalSummaryValue}>{formatDate(selectedTxn.docDate)}</Text>
                  </View>
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Amount</Text>
                    <Text style={styles.modalSummaryValue}>
                      ₹{formatCurrency(calcAmount(selectedTxn.documentLines))}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalStatusLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(selectedTxn.u_DealerStatus).bg }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusStyle(selectedTxn.u_DealerStatus).text }]}>
                      {selectedTxn.u_DealerStatus || "Pending"}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.modalLineList}>
                  {selectedTxn.documentLines?.map((line, idx) => (
                    <View key={idx} style={styles.modalLineItem}>
                      <View style={styles.modalLineItemLeft}>
                        <Text style={styles.modalLineItemCode} numberOfLines={1}>
                          {line.ItemCode}
                        </Text>
                        <Text style={styles.modalLineItemSub} numberOfLines={1}>
                          {line.ItemCode}
                        </Text>
                      </View>
                      <View style={styles.modalLineItemRight}>
                        <Text style={styles.modalLineItemQtyLabel}>Qty</Text>
                        <Text style={styles.modalLineItemQty}>{line.Quantity}</Text>
                        <Text style={styles.modalLineItemTotalLabel}>Total</Text>
                        <Text style={styles.modalLineItemTotal}>
                          ₹{formatCurrency((line.Quantity || 0) * (line.UnitPrice || 0))}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "80%", padding: spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },

  modalSummaryBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 10 },
  modalSummaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalSummaryLabel: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary },
  modalSummaryValue: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },

  modalStatusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.md, marginBottom: spacing.sm },
  modalStatusLabel: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary },

  modalLineList: { maxHeight: 320, marginTop: spacing.sm },
  modalLineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalLineItemLeft: { flex: 1, marginRight: spacing.sm },
  modalLineItemCode: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  modalLineItemSub: { fontSize: txtSize.small, fontFamily: typography.regular, color: colors.textSecondary, marginTop: 2 },
  modalLineItemRight: { alignItems: "flex-end" },
  modalLineItemQtyLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  modalLineItemQty: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  modalLineItemTotalLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  modalLineItemTotal: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },
});