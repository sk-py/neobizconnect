import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { fetchArCreditMemos, fetchArCreditMemoStats } from "@/modules/order-history/services/ar-credit-memo.api";
import { ArCreditMemoDocument } from "@/modules/order-history/types";
import { useAuthStore } from "@/store/auth.store";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


export default function ArCreditMemoScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDetails, setSelectedDetails] = useState<ArCreditMemoDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
      const canSeeClientCode = user?.authority === "Admin" || user?.authority === "Super Admin" || user?.authority === "Sales Manager";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["ar-credit-memo-stats"],
    queryFn: fetchArCreditMemoStats,
  });

  const { data: creditMemos = [], isLoading: listLoading, isRefetching, refetch } = useQuery({
    queryKey: ["ar-credit-memo-list"],
    queryFn: fetchArCreditMemos,
  });

    const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const withoutTime = String(dateString)
      .split("T")[0]
      .replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(\s?(AM|PM))?$/i, "")
      .trim();
    const ymd = withoutTime.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const [, year, month, day] = ymd;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    const date = new Date(withoutTime);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return creditMemos;
    const query = searchQuery.toLowerCase();
    return creditMemos.filter(
      (item) =>
        item.arcreditmemono?.toLowerCase().includes(query) ||
        item.customer_name?.toLowerCase().includes(query) ||
        item.customer_code?.toLowerCase().includes(query),
    );
  }, [creditMemos, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMemos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedMemos = useMemo(
    () => filteredMemos.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
    [filteredMemos, currentPage],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setPage(0);
  };

  const renderCard = ({ item }: { item: ArCreditMemoDocument }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text numberOfLines={1} style={styles.docNo}>{item.customer_name}</Text>
            <Text style={styles.docDate}>Credit Memo #{item.arcreditmemono}</Text>
            {canSeeClientCode && (
              <Text style={styles.clientCode}>Client Code: {item.customer_code}</Text>
            )}
          </View>
          <View>

          <View style={[styles.statusBadge, item.status === "Closed" && styles.statusClosed]}>
            <Text style={[styles.statusBadgeText, item.status === "Closed" && styles.statusTextClosed]}>
              {item.status}
            </Text>
          </View>
                              <Text style={styles.docDate}>{formatDate(item.document_date || item.posting_date)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>{item.items_quantity}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>₹{parseFloat(item.doc_total).toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          activeOpacity={0.8}
          onPress={() => setSelectedDetails(item)}
        >
          <Feather name="eye" size={16} color={colors.primary} />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.listHeader} />
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
          <Text style={styles.statLabel}>Total Credit Memos</Text>
          {statsLoading ? <ActivityIndicator size="small" /> : (
            <Text style={styles.statValue}>{stats?.total_arcreditmemo || 0}</Text>
          )}
          <Feather name="shopping-cart" size={20} color="#3B82F6" style={styles.statIcon} />
        </View>
        <View style={[styles.statCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
          <Text style={styles.statLabel}>Total Amount</Text>
          {statsLoading ? <ActivityIndicator size="small" /> : (
            <Text style={styles.statValue}>₹{parseFloat(stats?.total_arcreditmemo_amount || "0").toLocaleString("en-IN")}</Text>
          )}
          <Feather name="file-text" size={20} color="#22C55E" style={styles.statIcon} />
        </View>
      </View>

            <View style={styles.searchContainer}>
        <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by memo no, customer name..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange("")} style={styles.clearSearchBtn}>
            <Feather name="x-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {listLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredMemos.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather name="inbox" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No credit memos found</Text>
        </View>
      ) : (
        <LegendList
          data={paginatedMemos}
          keyExtractor={(item: ArCreditMemoDocument) => item.id.toString()}
          estimatedItemSize={160}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setPage(0); refetch(); }}
          refreshing={isRefetching}
          recycleItems={true}
        />
      )}

      {filteredMemos.length > 0 && (
        <View style={[styles.paginationFooter, { paddingBottom: Math.max(spacing.sm, insets.bottom) }]}>
          <Text style={styles.paginationText}>
            {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredMemos.length)} of {filteredMemos.length}
          </Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 0 && styles.pageBtnDisabled]}
              disabled={currentPage === 0}
              onPress={() => setPage((p) => p - 1)}
            >
              <Feather name="chevron-left" size={15} color={currentPage === 0 ? colors.muted : colors.text} />
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage >= totalPages - 1 && styles.pageBtnDisabled]}
              disabled={currentPage >= totalPages - 1}
              onPress={() => setPage((p) => p + 1)}
            >
              <Feather name="chevron-right" size={15} color={currentPage >= totalPages - 1 ? colors.muted : colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={Boolean(selectedDetails)} animationType="slide" presentationStyle="pageSheet">
        {selectedDetails && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Credit Memo Details</Text>
                <Text style={styles.modalSubtitle}>Credit Memo #{selectedDetails.arcreditmemono}</Text>
              </View>
              <View style={styles.modalHeaderRight}>
                <View style={[styles.statusBadge, selectedDetails.status === "Closed" && styles.statusClosed, { marginRight: 12 }]}>
                  <Text style={[styles.statusBadgeText, selectedDetails.status === "Closed" && styles.statusTextClosed]}>
                    {selectedDetails.status}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDetails(null)} style={styles.closeButton}>
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalSummaryRow}>
                <View style={[styles.modalSummaryCard, { backgroundColor: "#EFF6FF" }]}>
                  <Text style={styles.modalSummaryLabel}>Customer</Text>
                  <Text style={styles.modalSummaryMain}>{selectedDetails.customer_name}</Text>
                  {canSeeClientCode && (
                    <Text style={styles.modalSummarySub}>Customer Code: {selectedDetails.customer_code}</Text>
                  )}
                </View>
                <View style={[styles.modalSummaryCard, { backgroundColor: "#F0FDF4" }]}>
                  <Text style={styles.modalSummaryLabel}>Posting Date</Text>
                  <Text style={styles.modalSummaryMain}>{formatDate(selectedDetails.posting_date)}</Text>
                </View>
              </View>

              <View style={[styles.modalSummaryCard, { backgroundColor: "#FFF7ED", marginTop: spacing.md }]}>
                <Text style={styles.modalSummaryLabel}>Total Amount</Text>
                <Text style={styles.modalSummaryMain}>₹{parseFloat(selectedDetails.doc_total).toLocaleString("en-IN")}</Text>
                <Text style={styles.modalSummarySub}>Payment Terms: {selectedDetails.payment_terms}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Order Information</Text>

                <View style={styles.infoGridRow}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Sales Manager</Text>
                    <Text style={styles.infoValue}>{selectedDetails.sales_manager || "-"}</Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Contact Person</Text>
                    <Text style={styles.infoValue}>{selectedDetails.contact_person || "-"}</Text>
                  </View>
                </View>

                <View style={styles.infoGridRow}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Branch</Text>
                    <Text style={styles.infoValue}>{selectedDetails.branch || "-"}</Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>GSTIN</Text>
                    <Text style={styles.infoValue}>{selectedDetails.gstin || "-"}</Text>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Ship To Address</Text>
                  <Text style={styles.infoValue}>{selectedDetails.ship_to_address}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Bill To Address</Text>
                  <Text style={styles.infoValue}>{selectedDetails.bill_to_address}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Remarks</Text>
                  <Text style={styles.infoValue}>{selectedDetails.remarks || "-"}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.productHeader}>
                  <Text style={styles.sectionTitle}>Product Details</Text>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>Total Qty: {selectedDetails.items_quantity}</Text>
                  </View>
                </View>

                {selectedDetails.items.map((item, index) => (
                  <View key={item.LineNo} style={styles.productRow}>
                    <Text style={styles.productIndex}>{index + 1}</Text>
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{item.ItemDescription}</Text>
                    </View>
                    <View style={styles.productNumbers}>
                      <Text style={styles.productQty}>{parseFloat(item.Quantity).toFixed(6)}</Text>
                      <Text style={styles.productPrice}>₹{parseFloat(item.UnitPrice).toLocaleString("en-IN")}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },
  statsContainer: { flexDirection: "row", padding: spacing.md, gap: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, position: "relative", overflow: "hidden" },
  statLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 22, fontFamily: typography.bold, color: colors.text },
  statIcon: { position: "absolute", top: 16, right: 16, opacity: 0.2 },
  listHeader: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  listTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  listSubtitle: { fontSize: txtSize.small, fontFamily: typography.regular, color: colors.textSecondary, marginTop: 2 },
  emptyTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text, marginTop: spacing.md },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.sm, height: 40 },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, height: "100%" },
  clearSearchBtn: { padding: 4 },
  paginationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  paginationText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white },
  pageBtnDisabled: { backgroundColor: colors.surface, borderColor: colors.surface },
  pageIndicator: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text, minWidth: 36, textAlign: "center" },
  listContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  docNo: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  docDate: { fontSize: 12, fontFamily: typography.regular, color: colors.muted, marginTop: 2 },
  clientCode: { fontSize: 11, fontFamily: typography.semibold, color: "#1D4ED8", marginTop: 2 },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
  statusClosed: { backgroundColor: "#E0E7FF" },
  statusBadgeText: { fontSize: 10, fontFamily: typography.bold, color: "#1D4ED8", textAlign:"center" },
  statusTextClosed: { color: "#374151" },
  cardBody: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  viewButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: "#BFDBFE" },
  viewButtonText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.primary },
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },
  modalSubtitle: { fontSize: 13, fontFamily: typography.medium, color: colors.muted, marginTop: 2 },
  modalHeaderRight: { flexDirection: "row", alignItems: "center" },
  closeButton: { padding: 8, backgroundColor: colors.surface, borderRadius: radius.xl },
  modalScroll: { padding: spacing.md, gap: spacing.md },
  modalSummaryRow: { flexDirection: "row", gap: spacing.md },
  modalSummaryCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  modalSummaryLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 4 },
  modalSummaryMain: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  modalSummarySub: { fontSize: 12, fontFamily: typography.regular, color: colors.textSecondary, marginTop: 4 },
  infoSection: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.md },
  infoGridRow: { flexDirection: "row", marginBottom: spacing.md },
  infoGridCol: { flex: 1, paddingRight: spacing.sm },
  infoBlock: { marginBottom: spacing.md },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  qtyBadge: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
  qtyBadgeText: { fontSize: 12, fontFamily: typography.bold, color: "#1D4ED8" },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  productIndex: { width: 24, fontSize: 12, fontFamily: typography.bold, color: colors.muted },
  productDetails: { flex: 1, paddingRight: spacing.sm },
  productName: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  productNumbers: { alignItems: "flex-end", flexDirection: "row", gap: 16 },
  productQty: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary },
  productPrice: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
});