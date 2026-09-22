import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
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
import { OrderDocument, StandardStats } from "../types";

const PAGE_SIZE = 10;

interface OrderDocumentTemplateProps {
  pageTitle: string;
  pageSubtitle: string;
  documentNumberLabel: string;
  statsTitle: string;
  queryKeyBase: string;
  fetchList: (company: string) => Promise<OrderDocument[]>;
  fetchStats: (company: string) => Promise<StandardStats>;
  dateFieldLabel?: string;
  enableSearch?: boolean;
  enablePagination?: boolean;
  alwaysShowClientCode?: boolean;
}

export const OrderDocumentTemplate = ({
  pageTitle,
  pageSubtitle,
  documentNumberLabel,
  statsTitle,
  queryKeyBase,
  fetchList,
  fetchStats,
  dateFieldLabel = "Date",
  enableSearch = true,
  enablePagination = true,
  alwaysShowClientCode = false,
}: OrderDocumentTemplateProps) => {
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const groupCompanyName = user?.group_company_name || "Neo";
  const canSeeClientCode = alwaysShowClientCode || user?.authority === "Admin" || user?.authority === "Super Admin";

  const [selectedDoc, setSelectedDoc] = useState<OrderDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`${queryKeyBase}-stats`, groupCompanyName],
    queryFn: () => fetchStats(groupCompanyName),
    enabled: Boolean(groupCompanyName),
  });

  const { data: docs = [], isLoading: docsLoading, isRefetching, refetch } = useQuery({
    queryKey: [`${queryKeyBase}-list`, groupCompanyName],
    queryFn: () => fetchList(groupCompanyName),
    enabled: Boolean(groupCompanyName),
  });

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setPage(0);
  };

  const filteredDocs = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return docs;
    const query = searchQuery.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.salesorderno?.toString().toLowerCase().includes(query) ||
        doc.customer_name?.toLowerCase().includes(query) ||
        doc.customer_code?.toLowerCase().includes(query),
    );
  }, [docs, searchQuery, enableSearch]);

  const totalItems = filteredDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedDocs = useMemo(() => {
    if (!enablePagination) return filteredDocs;
    const start = safePage * PAGE_SIZE;
    return filteredDocs.slice(start, start + PAGE_SIZE);
  }, [filteredDocs, safePage, enablePagination]);
  const rangeStart = totalItems === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalItems, (safePage + 1) * PAGE_SIZE);

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB");
  };

  const renderCard = ({ item }: { item: OrderDocument }) => {
    const totalQty = item.items.reduce((sum, current) => sum + current.Quantity, 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.docNo}>{item.customer_name}</Text>
            <Text style={styles.docDate}>{documentNumberLabel} #{item.salesorderno}</Text>
            {canSeeClientCode && (
              <Text style={styles.clientCode}>Client Code: {item.customer_code}</Text>
            )}
          </View>
          <View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{item.portal_status}</Text>
            </View>
            <Text style={[styles.dateFieldLabel, { textAlign: "right" }]}>{dateFieldLabel}</Text>
            <Text style={[styles.docDate, { textAlign: "right" }]}>{formatDate(item.document_date)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>{totalQty}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>₹{parseFloat(item.doc_total).toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          activeOpacity={0.8}
          onPress={() => setSelectedDoc(item)}
        >
          <Feather name="eye" size={16} color={colors.primary} />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
          <Text style={styles.statLabel}>{statsTitle}</Text>
          {statsLoading ? <ActivityIndicator size="small" /> : (
            <Text style={styles.statValue}>{stats?.count || 0}</Text>
          )}
          <Feather name="shopping-cart" size={20} color="#3B82F6" style={styles.statIcon} />
        </View>
        <View style={[styles.statCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
          <Text style={styles.statLabel}>Total Amount</Text>
          {statsLoading ? <ActivityIndicator size="small" /> : (
            <Text style={styles.statValue}>₹{(stats?.amount || 0).toLocaleString("en-IN")}</Text>
          )}
          <Feather name="credit-card" size={20} color="#22C55E" style={styles.statIcon} />
        </View>
      </View>

      {enableSearch && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search by ${documentNumberLabel.toLowerCase()}, customer name...`}
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
      )}

      {docsLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredDocs.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather name="inbox" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No records found</Text>
        </View>
      ) : (
        <>
          <LegendList
            data={paginatedDocs}
            keyExtractor={(item: OrderDocument) => item.id.toString()}
            estimatedItemSize={160}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            recycleItems={true}
          />

          {enablePagination && (
            <View style={[styles.paginationBar, { paddingBottom: spacing.sm + insets.bottom }]}>
              <Text style={styles.paginationText}>
                {rangeStart}-{rangeEnd} of {totalItems}
              </Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                >
                  <Feather name="chevron-left" size={15} color={safePage === 0 ? colors.muted : colors.text} />
                </TouchableOpacity>
                <Text style={styles.pageIndicator}>
                  {safePage + 1} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, safePage >= totalPages - 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                >
                  <Feather name="chevron-right" size={15} color={safePage >= totalPages - 1 ? colors.muted : colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <Modal visible={Boolean(selectedDoc)} animationType="slide" presentationStyle="pageSheet">
        {selectedDoc && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{pageTitle} Details</Text>
                <Text style={styles.modalSubtitle}>{documentNumberLabel} #{selectedDoc.salesorderno}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDoc(null)} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalSummaryRow}>
                <View style={[styles.modalSummaryCard, { backgroundColor: "#EFF6FF" }]}>
                  <Text style={styles.modalSummaryLabel}>Customer</Text>
                  <Text style={styles.modalSummaryMain}>{selectedDoc.customer_name}</Text>
                  {canSeeClientCode && (
                    <Text style={styles.modalSummarySub}>Client Code: {selectedDoc.customer_code}</Text>
                  )}
                </View>
                <View style={[styles.modalSummaryCard, { backgroundColor: "#F0FDF4" }]}>
                  <Text style={styles.modalSummaryLabel}>{dateFieldLabel}</Text>
                  <Text style={styles.modalSummaryMain}>{formatDate(selectedDoc.document_date)}</Text>
                </View>
              </View>

              <View style={[styles.modalSummaryCard, { backgroundColor: "#FFF7ED", marginTop: spacing.md }]}>
                <Text style={styles.modalSummaryLabel}>Total Amount</Text>
                <Text style={styles.modalSummaryMain}>₹{parseFloat(selectedDoc.doc_total).toLocaleString("en-IN")}</Text>
                <Text style={styles.modalSummarySub}>Payment Terms: {selectedDoc.payment_terms}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Information</Text>
                <View style={styles.infoGridRow}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Sales Manager</Text>
                    <Text style={styles.infoValue}>{selectedDoc.sales_manager || "N/A"}</Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Contact Person</Text>
                    <Text style={styles.infoValue}>{selectedDoc.contact_person || "N/A"}</Text>
                  </View>
                </View>
                <View style={styles.infoGridRow}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Branch</Text>
                    <Text style={styles.infoValue}>{selectedDoc.branch || "N/A"}</Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>GSTIN</Text>
                    <Text style={styles.infoValue}>{selectedDoc.gstin || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Ship To Address</Text>
                  <Text style={styles.infoValue}>{selectedDoc.ship_to_address}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Bill To Address</Text>
                  <Text style={styles.infoValue}>{selectedDoc.bill_to_address}</Text>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Remarks</Text>
                  <Text style={styles.infoValue}>{selectedDoc.remarks || "None"}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.productHeader}>
                  <Text style={styles.sectionTitle}>Product Details</Text>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>
                      Total Qty: {selectedDoc.items.reduce((sum, i) => sum + i.Quantity, 0)}
                    </Text>
                  </View>
                </View>

                {selectedDoc.items.map((item, index) => (
                  <View key={item.LineNo.toString()} style={styles.productRow}>
                    <Text style={styles.productIndex}>{index + 1}</Text>
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{item.ItemDescription}</Text>
                      <Text style={styles.productCode}>{item.ItemCode}</Text>
                    </View>
                    <View style={styles.productNumbers}>
                      <Text style={styles.productQty}>Qty: {item.Quantity}</Text>
                      <Text style={styles.productPrice}>₹{item.Price.toLocaleString("en-IN")}</Text>
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
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsContainer: { flexDirection: "row", padding: spacing.md, gap: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, position: "relative", overflow: "hidden" },
  statLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 22, fontFamily: typography.bold, color: colors.text },
  statIcon: { position: "absolute", top: 16, right: 16, opacity: 0.2 },
  listHeader: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.sm, height: 40 },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, height: "100%" },
  clearSearchBtn: { padding: 4 },
  paginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  paginationText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageBtn: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text, minWidth: 36, textAlign: "center" },
  listTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  listSubtitle: { fontSize: txtSize.small, fontFamily: typography.regular, color: colors.textSecondary, marginTop: 2 },
  emptyTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text, marginTop: spacing.md },
  listContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  docNo: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  docDate: { fontSize: 12, fontFamily: typography.regular, color: colors.muted, marginTop: 2 },
  dateFieldLabel: { fontSize: 10, fontFamily: typography.medium, color: colors.muted },
  clientCode: { fontSize: 11, fontFamily: typography.semibold, color: "#1D4ED8", marginTop: 2 },
  statusBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
  statusBadgeText: { fontSize: 10, fontFamily: typography.bold, color: "#1D4ED8" },
  cardBody: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  viewButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FEF2F2", paddingVertical: 10, borderRadius: radius.sm },
  viewButtonText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.primary },
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },
  modalSubtitle: { fontSize: 13, fontFamily: typography.medium, color: colors.muted, marginTop: 2 },
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
  productCode: { fontSize: 11, fontFamily: typography.regular, color: colors.muted, marginTop: 2 },
  productNumbers: { alignItems: "flex-end" },
  productQty: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  productPrice: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginTop: 2 },
});