import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchSalesManagers } from "@/modules/sales-managers/services/sales-managers.api";
import {
  assignSalesQuota,
  fetchSalesQuotaList,
} from "@/modules/sales-managers/services/sales-target.api";
import {
  QUOTA_MONTHS,
  QuotaMonthName,
  SalesManager,
  SalesQuotaListItem,
} from "@/modules/sales-managers/types";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const FINANCIAL_YEARS = ["2025-2026", "2026-2027", "2027-2028"];
const ROLE = "Sales Manager" as const;

export const SalesManagerTargetsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // UI state
  const [activeTab, setActiveTab] = useState<"list" | "assign">("list");
  const [filterYear, setFilterYear] = useState("2026-2027");
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);

  // Form state
  const [selectedManagerCode, setSelectedManagerCode] = useState<
    string | null
  >(null);
  const [formFinancialYear, setFormFinancialYear] = useState("2026-2027");
  const [monthValues, setMonthValues] = useState<Record<string, string>>({});
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // --- Queries ---
  const {
    data: listData = [],
    isLoading: listLoading,
    isError: listIsError,
    error: listError,
    isRefetching: listRefetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["sales-manager-quota", filterYear],
    queryFn: () =>
      fetchSalesQuotaList({ role: ROLE, financial_year: filterYear }),
  });

  const { data: salesManagers = [] } = useQuery({
    queryKey: ["sales-managers"],
    queryFn: fetchSalesManagers,
    enabled: activeTab === "assign",
  });

  // --- Mutations ---
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedManagerCode) throw new Error("Select a Sales Manager");

      const quantities = QUOTA_MONTHS.map(
        (month) => parseFloat(monthValues[month] || "0") || 0,
      );
      const annualQuantity = quantities.reduce((sum, q) => sum + q, 0);

      const quota = QUOTA_MONTHS.map((month, index) => {
        const quantity = quantities[index];
        return {
          month,
          amount: 0,
          quantity,
          amount_percentage: 0,
          quantity_percentage:
            annualQuantity > 0 ? (quantity / annualQuantity) * 100 : 0,
        };
      });

      return assignSalesQuota({
        role: ROLE,
        user_code: selectedManagerCode,
        financial_year: formFinancialYear,
        annual_target: 0,
        annual_quantity: annualQuantity,
        quota,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-manager-quota"] });
      if (Platform.OS === "android")
        ToastAndroid.show("Target assigned successfully!", ToastAndroid.SHORT);
      setActiveTab("list");
      setMonthValues({});
      setSelectedManagerCode(null);
    },
    onError: (err: any) => {
      if (Platform.OS === "android")
        ToastAndroid.show(
          err?.response?.data?.message || err.message || "Failed to assign target.",
          ToastAndroid.SHORT,
        );
    },
  });

  // --- Handlers ---
  const handleEdit = (item: SalesQuotaListItem) => {
    setSelectedManagerCode(item.user_code);
    setFormFinancialYear(item.financial_year);

    const newValues: Record<string, string> = {};
    item.details.forEach((detail) => {
      newValues[detail.month] = String(detail.target_quantity ?? 0);
    });
    setMonthValues(newValues);
    setActiveTab("assign");
  };

  const handleMonthValueChange = (month: string, val: string) => {
    setMonthValues((prev) => ({
      ...prev,
      [month]: val.replace(/[^0-9.]/g, ""),
    }));
  };

  const totalQuantity = QUOTA_MONTHS.reduce(
    (acc, month) => acc + (parseFloat(monthValues[month] || "0") || 0),
    0,
  );

  const selectedManagerObj = salesManagers.find(
    (m) => m.salesEmployeeCode === selectedManagerCode,
  );

  const errorMessage =
    listError instanceof Error ? listError.message : "Something went wrong.";

  // --- Renders ---
  const renderListCard = ({ item }: { item: SalesQuotaListItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.managerName}>{item.name}</Text>
          <Text style={styles.managerMeta}>Code: {item.user_code}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Annual Target</Text>
          <Text style={styles.totalValue}>
            {item.annual_target.toLocaleString()}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Annual Quantity</Text>
          <Text style={styles.totalValue}>
            {item.annual_quantity.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.yearBadge}>{item.financial_year}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Manager Targets</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]}
          onPress={() => setActiveTab("list")}
        >
          <Feather
            name="list"
            size={16}
            color={activeTab === "list" ? colors.primary : colors.muted}
          />
          <Text
            style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "assign" && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab("assign");
            setMonthValues({});
            setSelectedManagerCode(null);
          }}
        >
          <Feather
            name="target"
            size={16}
            color={activeTab === "assign" ? colors.primary : colors.muted}
          />
          <Text
            style={[styles.tabText, activeTab === "assign" && styles.tabTextActive]}
          >
            Assign Target
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "list" ? (
        <>
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setIsYearModalOpen(true)}
            >
              <Feather name="calendar" size={14} color={colors.text} />
              <Text style={styles.filterPillText}>{filterYear}</Text>
              <Feather name="chevron-down" size={14} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {listLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : listIsError ? (
            <View style={styles.centerBox}>
              <Feather name="alert-triangle" size={32} color={colors.error} />
              <Text style={styles.emptyTitle}>Couldn't load targets</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchList()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : listData.length === 0 ? (
            <View style={styles.centerBox}>
              <Feather name="pie-chart" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No targets found</Text>
            </View>
          ) : (
            <LegendList
              data={listData}
              keyExtractor={(item) => item.user_code}
              estimatedItemSize={140}
              renderItem={renderListCard}
              contentContainerStyle={styles.listContent}
              onRefresh={refetchList}
              refreshing={listRefetching}
            />
          )}
        </>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Select Sales Manager</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setIsManagerModalOpen(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedManagerObj && { color: colors.muted },
                  ]}
                >
                  {selectedManagerObj
                    ? `${selectedManagerObj.salesEmployeeName} (${selectedManagerObj.salesEmployeeCode})`
                    : "Select a sales manager"}
                </Text>
                <Feather name="chevron-down" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Financial Year</Text>
              <View style={styles.yearSelectorRow}>
                {FINANCIAL_YEARS.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.yearChip,
                      formFinancialYear === yr && styles.yearChipActive,
                    ]}
                    onPress={() => setFormFinancialYear(yr)}
                  >
                    <Text
                      style={[
                        styles.yearChipText,
                        formFinancialYear === yr && styles.yearChipTextActive,
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.targetGrid}>
              <View style={styles.targetGridHeader}>
                <Text style={styles.gridHeaderLeft}>Month</Text>
                <Text style={styles.gridHeaderRight}>Sales Quantity</Text>
              </View>

              {QUOTA_MONTHS.map((month: QuotaMonthName) => (
                <View key={month} style={styles.targetRow}>
                  <Text style={styles.targetMonthLabel}>{month}</Text>
                  <TextInput
                    style={styles.targetInput}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={monthValues[month]}
                    onChangeText={(val) => handleMonthValueChange(month, val)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.formFooter,
              { paddingBottom: Math.max(spacing.md, insets.bottom) },
            ]}
          >
            <View style={styles.totalBlock}>
              <Text style={styles.totalFooterLabel}>Total Quantity</Text>
              <Text style={styles.totalFooterValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalQuantity.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (assignMutation.isPending || !selectedManagerCode) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || !selectedManagerCode}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Target</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Year Filter Modal */}
      <Modal visible={isYearModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter by Financial Year</Text>
            <View style={styles.yearSelectorRow}>
              {FINANCIAL_YEARS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearChip, filterYear === yr && styles.yearChipActive]}
                  onPress={() => setFilterYear(yr)}
                >
                  <Text
                    style={[
                      styles.yearChipText,
                      filterYear === yr && styles.yearChipTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setIsYearModalOpen(false)}
            >
              <Text style={styles.submitBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sales Manager Selector Modal */}
      <Modal visible={isManagerModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.managerModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sales Manager</Text>
            <TouchableOpacity onPress={() => setIsManagerModalOpen(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            {salesManagers.map((manager: SalesManager) => (
              <TouchableOpacity
                key={manager.salesEmployeeCode}
                style={styles.managerSelectRow}
                onPress={() => {
                  setSelectedManagerCode(manager.salesEmployeeCode);
                  setIsManagerModalOpen(false);
                }}
              >
                <Text style={styles.managerSelectName}>
                  {manager.salesEmployeeName}
                </Text>
                <Text style={styles.managerSelectCode}>
                  {manager.salesEmployeeCode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6, paddingHorizontal: spacing.xl },

  header: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.white },
  backButton: { padding: 4, marginRight: spacing.sm },
  headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },

  tabContainer: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.md, marginTop: spacing.sm, marginBottom: spacing.sm },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: radius.sm },
  tabBtnActive: { backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontFamily: typography.medium, color: colors.muted },
  tabTextActive: { color: colors.primary, fontFamily: typography.bold },

  filterBar: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row" },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  filterPillText: { fontSize: 12, fontFamily: typography.medium, color: colors.text },

  listContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface },
  managerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 2 },
  managerMeta: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.xl },
  editBtnText: { fontSize: 12, fontFamily: typography.bold, color: colors.primary },

  totalsRow: { flexDirection: "row", backgroundColor: "#F8FAFC", padding: spacing.sm },
  totalCol: { flex: 1, alignItems: "center" },
  totalDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 4 },
  totalValue: { fontSize: 14, fontFamily: typography.bold, color: colors.text },

  cardFooter: { padding: spacing.sm, alignItems: "flex-end", backgroundColor: colors.white, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  yearBadge: { fontSize: 11, fontFamily: typography.bold, color: colors.muted, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  formContainer: { padding: spacing.md },
  formGroup: { marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginBottom: 8 },
  dropdownTrigger: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: radius.sm },
  dropdownText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },

  yearSelectorRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  yearChip: { flex: 1, minWidth: 90, paddingVertical: 10, alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  yearChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  yearChipText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },
  yearChipTextActive: { color: colors.white, fontFamily: typography.bold },

  targetGrid: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.xxl },
  targetGridHeader: { flexDirection: "row", backgroundColor: "#DBEAFE", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  gridHeaderLeft: { flex: 1, fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A" },
  gridHeaderRight: { flex: 1, fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A", textAlign: "right" },
  emptyTitle: { fontFamily: typography.bold, fontSize: 16, color: colors.muted, marginTop: spacing.md },
  errorSubtitle: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },

  retryButton: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.primary },
  retryButtonText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  targetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surface },
  targetMonthLabel: { flex: 1, fontSize: 14, fontFamily: typography.bold, color: colors.text },
  targetInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: typography.medium, color: colors.text, textAlign: "right" },

  formFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  totalBlock: { flexShrink: 1, maxWidth: "38%" },
  totalFooterLabel: { fontSize: 11, fontFamily: typography.bold, color: colors.muted, marginBottom: 2 },
  totalFooterValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  submitBtn: { flex: 1.4, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.xl },
  modalCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.lg },
  applyBtn: { backgroundColor: colors.text, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.md },

  managerModalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  managerSelectRow: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: radius.sm, marginBottom: spacing.sm },
  managerSelectName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  managerSelectCode: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
});