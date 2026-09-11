import { PdfViewerModal } from "@/components/shared/pdf-viewer-modal";
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import {
  downloadAndOpenLedgerPdf,
  fetchCustomerLedger,
  fetchDealerAccountBalance,
  fetchDealersList
} from "@/modules/customer-ledger/services/customer-ledger.api";
import { LedgerEntry } from "@/modules/customer-ledger/types";
import { useAuthStore } from "@/store/auth.store";
import { LegendList } from "@legendapp/list/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type DealerOption = {
  card_code: string;
  card_name: string;
};

export default function CustomerLedgerScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const groupCompanyName = user?.group_company_name || "Neo";
  const isDealer = user?.authority === "Dealer";

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Filter States
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [appliedFromDate, setAppliedFromDate] = useState<string | null>(null);
  const [appliedToDate, setAppliedToDate] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  // Dealer Selection States (For Sales Managers)
  const [selectedDealer, setSelectedDealer] = useState<DealerOption | null>(null);
  const [isDealerModalVisible, setDealerModalVisible] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState("");

  // PDF Loader State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // Query: Fetch list of dealers (Only if NOT a dealer)
  const { data: dealersList = [], isLoading: isLoadingDealers } = useQuery({
    queryKey: ["dealers-list", groupCompanyName],
    queryFn: () => fetchDealersList(),
    enabled: Boolean(groupCompanyName) && !isDealer,
  });

  // Query: Fetch Ledger Data (Dynamic based on role)
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["customer-ledger", groupCompanyName, appliedFromDate, appliedToDate, selectedDealer?.card_code],
    queryFn: async () => {
      if (!isDealer) {
        if (!selectedDealer) return null;
        
        return fetchDealerAccountBalance(selectedDealer.card_code);
      }
      return fetchCustomerLedger(groupCompanyName, appliedFromDate, appliedToDate);
    },
    enabled: Boolean(groupCompanyName) && (isDealer || Boolean(selectedDealer)),
  });

  const { mutate: handleDownloadPdf, isPending: pdfDownloadPending } = useMutation({
    mutationFn: (docEntry: string) => downloadAndOpenLedgerPdf(groupCompanyName, docEntry),
    onMutate: (docEntry) => setDownloadingId(docEntry),
    onSuccess: (uri) => {
      setDownloadingId(null);
      setPdfUri(uri);
    },
    onError: (error) => {
      setDownloadingId(null);
      if (Platform.OS === "android") ToastAndroid.show("Failed to download PDF", ToastAndroid.SHORT);
      console.error(error);
    },
  });

  // Local Search Filtering for Ledger
  const filteredData = useMemo(() => {
    if (!data?.AccountBalance) return [];
    if (!searchQuery.trim()) return data.AccountBalance;

    const query = searchQuery.toLowerCase();
    return data.AccountBalance.filter((item: LedgerEntry) =>
      item.OriginNo?.toLowerCase().includes(query) ||
      item.Details?.toLowerCase().includes(query) ||
      item.Origin?.toLowerCase().includes(query)
    );
  }, [data?.AccountBalance, searchQuery]);

  // Local Search Filtering for Dealers List
  const filteredDealers = useMemo(() => {
    if (!dealerSearchQuery.trim()) return dealersList;
    const query = dealerSearchQuery.toLowerCase();
    return dealersList.filter((d: DealerOption) => 
      d.card_name.toLowerCase().includes(query) || d.card_code.toLowerCase().includes(query)
    );
  }, [dealersList, dealerSearchQuery]);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num) || num === null) return "0.00";
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toISODate = (date: Date) => date.toISOString().split("T")[0];
  const displayDate = (date: Date | null) => date ? date.toLocaleDateString("en-GB") : "DD/MM/YYYY";
  const formatApiDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("en-GB");
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentPicker = showPicker;
    setShowPicker(null);

    if (event.type === "set" && selectedDate) {
      if (currentPicker === "from") setTempFromDate(selectedDate);
      if (currentPicker === "to") setTempToDate(selectedDate);
    }
  };

  const applyFilters = () => {
    setAppliedFromDate(tempFromDate ? toISODate(tempFromDate) : null);
    setAppliedToDate(tempToDate ? toISODate(tempToDate) : null);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setTempFromDate(null);
    setTempToDate(null);
    setAppliedFromDate(null);
    setAppliedToDate(null);
    setFilterModalVisible(false);
  };

  const hasActiveFilters = Boolean(appliedFromDate || appliedToDate);

  const renderCard = ({ item }: { item: LedgerEntry }) => {
    const isInvoice = item.Origin === "A/R Invoice";
    const isDownloading = downloadingId === item.OriginDocEntry;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.originText}>{item.Origin}</Text>
            <Text selectable style={styles.originNo}>#{item.OriginNo}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatApiDate(item.PostingDate)}</Text>
          </View>
        </View>

        <View style={styles.detailsBlock}>
          <Text style={styles.detailsLabel}>Details</Text>
          <Text selectable style={styles.detailsValue}>{item.Details || "-"}</Text>
        </View>

        <View style={styles.financialRow}>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Debit</Text>
            <Text style={[styles.finValue, { color: colors.error }]}>₹{formatCurrency(item.DebitLC)}</Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Credit</Text>
            <Text style={[styles.finValue, { color: colors.success }]}>₹{formatCurrency(item.CreditLC)}</Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Cum. Balance</Text>
            <Text style={styles.finValue}>₹{formatCurrency(item.CumulativeBalanceLC)}</Text>
          </View>
        </View>

        {isInvoice && item.OriginDocEntry && (
          <TouchableOpacity
            style={styles.pdfButton}
            activeOpacity={0.8}
            onPress={() => handleDownloadPdf(item.OriginDocEntry!)}
            disabled={pdfDownloadPending || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Feather name="file-text" size={18} color={colors.primary} />
                <Text style={styles.pdfButtonText}>View Invoice</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Customer Ledger</Text>
            <Text style={styles.headerSubTitle}>Here is a list of customers ledgers</Text>
          </View>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setFilterModalVisible(true)}>
            <Feather name="calendar" size={20} color={colors.text} />
            {hasActiveFilters && <View style={styles.activeFilterDot} />}
          </TouchableOpacity>
        </View>

        {/* Manager Specific Dealer Selection Filter */}
        {!isDealer && (
          <TouchableOpacity 
            style={styles.dealerSelector} 
            activeOpacity={0.7} 
            onPress={() => setDealerModalVisible(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Feather name="user" size={16} color={selectedDealer ? colors.primary : colors.muted} />
              <Text style={[styles.dealerSelectorText, !selectedDealer && { color: colors.muted }]} numberOfLines={1}>
                {selectedDealer ? `${selectedDealer.card_name} (${selectedDealer.card_code})` : "Select a Dealer"}
              </Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doc number or details..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={isDealer || Boolean(selectedDealer)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              <Feather name="x-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isLoading && data && (
        <View style={styles.balanceBanner}>
          <Text style={styles.balanceLabel}>Account Balance</Text>
          <Text style={styles.balanceValue}>
            ₹{formatCurrency(data.TotalCumulativeBalanceLC ?? data.AccBalance)}
          </Text>
        </View>
      )}

      {/* Main List Rendering */}
      {!isDealer && !selectedDealer ? (
        <View style={styles.centerBox}>
          <Feather name="users" size={48} color={colors.border} />
          <Text style={styles.emptyTitle}>Select a Dealer</Text>
          <Text style={styles.emptySubTitle}>Choose a dealer from the dropdown to view their ledger entries.</Text>
        </View>
      ) : isLoading ? (
        <SkeletonCardList />
      ) : filteredData.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather name="file-minus" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No entries found</Text>
        </View>
      ) : (
        <LegendList
          data={filteredData}
          keyExtractor={(item: LedgerEntry, index) => `${item.OriginNo}-${index}`}
          estimatedItemSize={200}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          recycleItems={true}
          extraData={downloadingId}
        />
      )}

      {/* Dealer Selection Modal */}
      <Modal visible={isDealerModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Dealer</Text>
            <TouchableOpacity onPress={() => setDealerModalVisible(false)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSearchWrapper}>
            <Feather name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name or code..."
              placeholderTextColor={colors.muted}
              value={dealerSearchQuery}
              onChangeText={setDealerSearchQuery}
            />
          </View>

          {isLoadingDealers ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
                        <LegendList
              data={filteredDealers}
              keyExtractor={(item) => item.card_code}
              contentContainerStyle={{ padding: spacing.md }}
              estimatedItemSize={70}
              recycleItems
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.dealerOption, selectedDealer?.card_code === item.card_code && styles.dealerOptionSelected]}
                  onPress={() => {
                    setSelectedDealer(item);
                    setDealerModalVisible(false);
                    setDealerSearchQuery("");
                  }}
                >
                  <Text style={[styles.dealerOptionName, selectedDealer?.card_code === item.card_code && { color: colors.primary }]}>
                    {item.card_name}
                  </Text>
                  <Text style={styles.dealerOptionCode}>{item.card_code}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Ledger</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From Date</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker("from")}>
                <Feather name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.dateText, !tempFromDate && styles.datePlaceholder]}>
                  {displayDate(tempFromDate)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.dateLabel}>To Date</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker("to")}>
                <Feather name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.dateText, !tempToDate && styles.datePlaceholder]}>
                  {displayDate(tempToDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterActionRow}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchBtn} onPress={applyFilters}>
                <Text style={styles.searchBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={(showPicker === "from" ? tempFromDate : tempToDate) || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <PdfViewerModal 
        visible={Boolean(pdfUri)}
        uri={pdfUri}
        title="Ledger Document"
        onClose={() => setPdfUri(null)}
      />
    </SafeAreaView>
  );
}

// ---- Skeleton loading state ----

const SkeletonBlock = ({ style }: { style?: any }) => {
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.55, { duration: 750 })
      ),
      -1,
      true
    );
  }, []);

  const rStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return <Animated.View style={[styles.skeletonBlock, style, rStyle]} />;
};

const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View>
        <SkeletonBlock style={{ width: 100, height: 15, borderRadius: 4, marginBottom: 6 }} />
        <SkeletonBlock style={{ width: 70, height: 12, borderRadius: 4 }} />
      </View>
      <SkeletonBlock style={{ width: 78, height: 22, borderRadius: radius.xl }} />
    </View>

    <View style={styles.detailsBlock}>
      <SkeletonBlock style={{ width: 50, height: 11, borderRadius: 4, marginBottom: 6 }} />
      <SkeletonBlock style={{ width: "85%", height: 13, borderRadius: 4 }} />
    </View>

    <View style={styles.financialRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.finCol}>
          <SkeletonBlock style={{ width: 40, height: 10, borderRadius: 3, marginBottom: 6 }} />
          <SkeletonBlock style={{ width: 55, height: 13, borderRadius: 3 }} />
        </View>
      ))}
    </View>

    <SkeletonBlock style={{ height: 38, borderRadius: radius.sm, marginTop: spacing.md }} />
  </View>
);

const SkeletonCardList = ({ count = 6 }: { count?: number }) => (
  <View style={styles.listContent}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text, marginTop: spacing.md },
  emptySubTitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.muted, textAlign: "center", marginTop: 4 },

  header: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  headerTitleContainer: { alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text, paddingBottom: 2 },
  headerSubTitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary },
  calendarBtn: { padding: 8, backgroundColor: colors.surface, borderRadius: radius.md, position: "relative" },
  activeFilterDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 1, borderColor: colors.surface },

  dealerSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.sm },
  dealerSelectorText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, height: 44 },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, height: "100%" },
  clearSearchBtn: { padding: 4 },

  balanceBanner: { backgroundColor: "#F0FDF4", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#BBF7D0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: 12, fontFamily: typography.medium, color: "#166534" },
  balanceValue: { fontSize: 15, fontFamily: typography.bold, color: "#16A34A" },

  listContent: { padding: spacing.md, gap: spacing.md },

  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  originText: { fontSize: 15, fontFamily: typography.bold, color: colors.text },
  originNo: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
  dateBadge: { backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  dateBadgeText: { fontSize: 11, fontFamily: typography.bold, color: colors.text },

  detailsBlock: { marginBottom: spacing.md },
  detailsLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  detailsValue: { fontSize: 13, fontFamily: typography.medium, color: colors.text, lineHeight: 18 },

  financialRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  finCol: { flex: 1 },
  finLabel: { fontSize: 10, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  finValue: { fontSize: 12, fontFamily: typography.bold, color: colors.text },

  pdfButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: "#BFDBFE", marginTop: spacing.md },
  pdfButtonText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.primary },

  skeletonBlock: { backgroundColor: colors.border },

  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg },
  modalContent: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  dateInputContainer: { marginBottom: spacing.xl },
  dateLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 6 },
  datePickerBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, marginBottom: spacing.md },
  dateText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },
  datePlaceholder: { color: colors.muted },
  filterActionRow: { flexDirection: "row", gap: spacing.md },
  resetBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, alignItems: "center" },
  resetBtnText: { fontSize: 15, fontFamily: typography.medium, color: colors.text },
  searchBtn: { flex: 1, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.sm, alignItems: "center" },
  searchBtnText: { fontSize: 15, fontFamily: typography.bold, color: colors.white },

  // Dealer Modal
  modalSafeArea: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  closeBtn: { padding: 4, marginRight: -4 },
  modalSearchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  modalSearchInput: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, padding: 0 },
  dealerOption: { padding: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.surface, borderRadius: radius.sm, marginBottom: spacing.md },
  dealerOptionSelected: { borderColor: colors.primary, borderWidth: 1 },
  dealerOptionName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  dealerOptionCode: { fontSize: 12, fontFamily: typography.medium, color: colors.muted },
});