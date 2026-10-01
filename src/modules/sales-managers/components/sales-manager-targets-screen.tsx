import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { fetchSalesManagers } from "@/modules/sales-managers/services/sales-managers.api";
import {
  assignSalesQuota,
  fetchSalesQuotaList,
} from "@/modules/sales-managers/services/sales-target.api";
import {
  QUOTA_MONTHS,
  QuotaMonthName,
  QuotaRole,
  SalesQuotaListItem,
} from "@/modules/sales-managers/types";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
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
import { useAuth } from "@/hooks/use-auth";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const FINANCIAL_YEARS = ["2025-2026", "2026-2027", "2027-2028"];
const ROLES: QuotaRole[] = ["Dealer", "Sales Manager"];
const PAGE_SIZE = 10;

type EntityOption = { code: string; name: string; salesManager?: string };

const FY_MONTH_OFFSET: Record<string, number> = {
  April: 0, May: 1, June: 2, July: 3, August: 4, September: 5,
  October: 6, November: 7, December: 8, January: 9, February: 10, March: 11,
};

const getMonthDate = (financialYear: string, month: string): Date | null => {
  const startYear = parseInt(financialYear.split("-")[0], 10);
  const offset = FY_MONTH_OFFSET[month];
  if (isNaN(startYear) || offset === undefined) return null;
  const calendarMonth = (3 + offset) % 12; // April = 3 (0-indexed)
  const calendarYear = offset <= 8 ? startYear : startYear + 1; // Jan-Mar roll into next year
  return new Date(calendarYear, calendarMonth, 1);
};

const isMonthPassed = (financialYear: string, month: string): boolean => {
  const monthDate = getMonthDate(financialYear, month);
  if (!monthDate) return false;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return monthDate.getTime() < currentMonthStart.getTime();
};
const normalizeMonth = (value?: string | null) => (value ?? "").trim().toLowerCase();

const findDetailForMonth = (
  details: SalesQuotaListItem["details"],
  month: string,
) => details.find((d) => normalizeMonth(d.month) === normalizeMonth(month));

const getMonthQuantity = (detail?: SalesQuotaListItem["details"][number]) =>
  detail?.quantity ?? detail?.target_quantity ?? 0;

const getEffectiveFrom = (item: SalesQuotaListItem): string => {
  const firstFunded = QUOTA_MONTHS.find((month) => {
    const detail = findDetailForMonth(item.details, month);
    return getMonthQuantity(detail) > 0;
  });
  return firstFunded ?? "-";
};

export const SalesManagerTargetsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.authority === "Admin" || user?.authority === "Super Admin";

    const goBack = () => {
    if (isAdmin) {
      router.push("/admin-sales-screen");
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

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [router, isAdmin]),
  );

  // UI state
  const [activeTab, setActiveTab] = useState<"list" | "assign">("list");
  const [role, setRole] = useState<QuotaRole>("Dealer");
    const [filterYear, setFilterYear] = useState("2026-2027");
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isFormYearModalOpen, setIsFormYearModalOpen] = useState(false);

  // Search + pagination state (List tab)
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  // View modal
  const [viewingItem, setViewingItem] = useState<SalesQuotaListItem | null>(null);

    // Form state (Create/Edit tab)
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedEntityCode, setSelectedEntityCode] = useState<string | null>(null);
  const [formFinancialYear, setFormFinancialYear] = useState("2026-2027");
  const [monthValues, setMonthValues] = useState<Record<string, string>>({});
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [effectiveFromMonth, setEffectiveFromMonth] = useState<QuotaMonthName | null>(null);
  const [isEffectiveMonthModalOpen, setIsEffectiveMonthModalOpen] = useState(false);
  const [netQuantityInput, setNetQuantityInput] = useState("");

  // --- Queries ---
  const {
    data: listData = [],
    isLoading: listLoading,
    isError: listIsError,
    error: listError,
    isRefetching: listRefetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["sales-quota", role, filterYear],
    queryFn: () => fetchSalesQuotaList({ role, financial_year: filterYear }),
  });

  const { data: salesManagers = [] } = useQuery({
    queryKey: ["sales-managers"],
    queryFn: fetchSalesManagers,
    enabled: activeTab === "assign" && role === "Sales Manager",
  });

  const { data: dealers = [] } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
    enabled: activeTab === "assign" && role === "Dealer",
  });

    const entityOptions: EntityOption[] = useMemo(() => {
    if (role === "Dealer") {
      return dealers.map((d) => ({ code: d.cardCode, name: d.cardName, salesManager: d.salesManager }));
    }
    return salesManagers.map((m) => ({ code: m.salesEmployeeCode, name: m.salesEmployeeName }));
  }, [role, dealers, salesManagers]);

  const filteredEntityOptions = useMemo(() => {
    const query = entitySearchQuery.trim().toLowerCase();
    if (!query) return entityOptions;
    return entityOptions.filter(
      (e) => e.name.toLowerCase().includes(query) || e.code.toLowerCase().includes(query),
    );
  }, [entityOptions, entitySearchQuery]);

  
  const isMonthLocked = (month: QuotaMonthName): boolean => {
    if (formMode === "edit") return isMonthPassed(formFinancialYear, month);
    if (!effectiveFromMonth) return true;
    return QUOTA_MONTHS.indexOf(month) < QUOTA_MONTHS.indexOf(effectiveFromMonth);
  };

  const getEditableMonths = (effectiveFrom: QuotaMonthName | null): QuotaMonthName[] => {
    if (!effectiveFrom) return [];
    return QUOTA_MONTHS.slice(QUOTA_MONTHS.indexOf(effectiveFrom));
  };

  // Splits `total` into `count` whole-number shares that sum back to
  // `total` exactly, handing the remainder to the first few shares.
  const splitEqually = (total: number, count: number): number[] => {
    if (count <= 0) return [];
    const base = Math.floor(total / count);
    const remainder = Math.round(total - base * count);
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
  };

  useEffect(() => {
    if (formMode !== "create" || !effectiveFromMonth) return;

    const editableMonths = getEditableMonths(effectiveFromMonth);
    const total = parseFloat(netQuantityInput) || 0;
    const shares = splitEqually(total, editableMonths.length);

    setMonthValues((prev) => {
      const next = { ...prev };
      editableMonths.forEach((month, index) => {
        next[month] = String(shares[index]);
      });
      return next;
    });
  }, [netQuantityInput, effectiveFromMonth, formMode]);

  // --- Search filtering (by name or code) ---
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return listData;
    return listData.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.user_code?.toLowerCase().includes(query),
    );
  }, [listData, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterYear, role]);

  // --- Pagination ---
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedData = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, safePage]);
  const rangeStart = totalItems === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalItems, (safePage + 1) * PAGE_SIZE);

  // --- Stat cards ---
  const totalCount = listData.length;
  const totalQuantity = useMemo(
    () => listData.reduce((sum, item) => sum + (item.annual_quantity || 0), 0),
    [listData],
  );

  // --- Mutations ---
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEntityCode) throw new Error(`Select a ${role}`);

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
        role,
        user_code: selectedEntityCode,
        financial_year: formFinancialYear,
        annual_target: 0,
        annual_quantity: annualQuantity,
        quota,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-quota"] });
      if (Platform.OS === "android")
        ToastAndroid.show("Target assigned successfully!", ToastAndroid.SHORT);
      setActiveTab("list");
      setMonthValues({});
      setSelectedEntityCode(null);
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
    setFormMode("edit");
    setRole(item.role);
    setSelectedEntityCode(item.user_code);
    setFormFinancialYear(item.financial_year);
    setEffectiveFromMonth(null);
    setNetQuantityInput("");

    const newValues: Record<string, string> = {};
    QUOTA_MONTHS.forEach((month) => {
      const detail = findDetailForMonth(item.details, month);
      newValues[month] = String(getMonthQuantity(detail));
    });
    setMonthValues(newValues);
    setActiveTab("assign");
  };

    const handleMonthValueChange = (month: string, val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");

    // Outside create mode (or before an Effective From month is chosen)
    // there's no Net Quantity to balance against, so just store the value.
    if (formMode !== "create" || !effectiveFromMonth) {
      setMonthValues((prev) => ({ ...prev, [month]: sanitized }));
      return;
    }

    const total = parseFloat(netQuantityInput) || 0;
    const newValue = Math.min(Math.max(parseFloat(sanitized) || 0, 0), total);
    const otherMonths = getEditableMonths(effectiveFromMonth).filter((m) => m !== month);
    const shares = splitEqually(total - newValue, otherMonths.length);

    setMonthValues((prev) => {
      const next = { ...prev, [month]: sanitized };
      otherMonths.forEach((m, index) => {
        next[m] = String(shares[index]);
      });
      return next;
    });
  };

  const totalFormQuantity = QUOTA_MONTHS.reduce(
    (acc, month) => acc + (parseFloat(monthValues[month] || "0") || 0),
    0,
  );

  const selectedEntity = entityOptions.find((e) => e.code === selectedEntityCode);

  const errorMessage =
    listError instanceof Error ? listError.message : "Something went wrong.";

  // --- Renders ---
  const renderListCard = ({ item, index }: { item: SalesQuotaListItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.srNo}>{safePage * PAGE_SIZE + index + 1}.</Text>
            <Text style={styles.entityName}>{item.name}</Text>
          </View>
          <Text style={styles.entityMeta}>Code: {item.user_code}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setViewingItem(item)}>
            <Feather name="eye" size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item)}>
            <Feather name="edit-2" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Financial Year</Text>
          <Text style={styles.totalValue}>{item.financial_year}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Net Quantity</Text>
          <Text style={styles.totalValue}>
            {item.annual_quantity.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
                  <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Sales Target</Text>
            <Text style={styles.headerSubtitle}>Here is a list of sales targets</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Total {role === "Dealer" ? "Dealers" : "Sales Managers"}</Text>
              <Text style={styles.statValue}>{totalCount}</Text>
            </View>
            <View style={styles.statIconCircle}>
              <Feather name="users" size={16} color={colors.primary} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>{role} Quantity</Text>
              <Text style={styles.statValue}>{totalQuantity.toLocaleString()}</Text>
            </View>
            <View style={styles.statIconCircle}>
              <Feather name="box" size={16} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]}
            onPress={() => setActiveTab("list")}
          >
            <Feather name="list" size={16} color={activeTab === "list" ? colors.primary : colors.muted} />
            <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "assign" && styles.tabBtnActive]}
                                    onPress={() => {
              setActiveTab("assign");
              setFormMode("create");
              setRole("Dealer");
              setFormFinancialYear("2026-2027");
              setEffectiveFromMonth(null);
              setNetQuantityInput("");
              setEntitySearchQuery("");
              setMonthValues({});
              setSelectedEntityCode(null);
            }}
          >
                        <Feather
              name={activeTab === "assign" && formMode === "edit" ? "edit-2" : "plus-circle"}
              size={16}
              color={activeTab === "assign" ? colors.primary : colors.muted}
            />
            <Text style={[styles.tabText, activeTab === "assign" && styles.tabTextActive]}>
              {activeTab === "assign" && formMode === "edit" ? "Edit" : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "list" && (
          <>
            <View style={styles.searchFilterRow}>
              <View style={styles.searchContainer}>
                <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or code..."
                  placeholderTextColor={colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                    <Feather name="x-circle" size={16} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.calendarIconBtn} onPress={() => setIsYearModalOpen(true)}>
                <Feather name="calendar" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.roleFilterRow}>
              {ROLES.map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleFilterPill, active && styles.roleFilterPillActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleFilterPillText, active && styles.roleFilterPillTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>

      {activeTab === "list" ? (
        <>
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
          ) : filteredData.length === 0 ? (
            <View style={styles.centerBox}>
              <Feather name="pie-chart" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No targets found</Text>
            </View>
          ) : (
            <>
              <LegendList
                data={paginatedData}
                keyExtractor={(item) => item.user_code}
                estimatedItemSize={140}
                renderItem={renderListCard}
                contentContainerStyle={styles.listContent}
                onRefresh={refetchList}
                refreshing={listRefetching}
              />

              <View style={styles.paginationBar}>
                <Text style={styles.paginationText}>
                  {rangeStart}-{rangeEnd} of {totalItems}
                </Text>
                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
                    onPress={() => setPage(0)}
                    disabled={safePage === 0}
                  >
                    <Feather name="chevrons-left" size={15} color={safePage === 0 ? colors.muted : colors.text} />
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    style={[styles.pageBtn, safePage >= totalPages - 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage(totalPages - 1)}
                    disabled={safePage >= totalPages - 1}
                  >
                    <Feather name="chevrons-right" size={15} color={safePage >= totalPages - 1 ? colors.muted : colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </>
      ) : (
                <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 44 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleFilterRow}>
                {ROLES.map((r) => {
                  const active = role === r;
                  return (
                                        <TouchableOpacity
                      key={r}
                      disabled={formMode === "edit"}
                      style={[
                        styles.roleFilterPill,
                        active && styles.roleFilterPillActive,
                        formMode === "edit" && { opacity: 0.6 },
                      ]}
                                            onPress={() => {
                        setRole(r);
                        setSelectedEntityCode(null);
                        setEntitySearchQuery("");
                      }}
                    >
                      <Text style={[styles.roleFilterPillText, active && styles.roleFilterPillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Select {role}</Text>
                          <TouchableOpacity
                style={[styles.dropdownTrigger, formMode === "edit" && styles.readOnlyField]}
                disabled={formMode === "edit"}
                onPress={() => setIsEntityModalOpen(true)}
              >
                <View style={styles.dropdownTriggerLeft}>
                  <Feather name="user" size={15} color={colors.muted} />
                  <Text style={[styles.dropdownText, !selectedEntity && { color: colors.muted }]}>
                    {selectedEntity ? `${selectedEntity.name} (${selectedEntity.code})` : `Select a ${role.toLowerCase()}`}
                  </Text>
                </View>
                {formMode !== "edit" && <Feather name="chevron-down" size={18} color={colors.muted} />}
              </TouchableOpacity>
            </View>

            {role === "Dealer" && selectedEntity && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Sales Manager</Text>
                <View style={[styles.dropdownTrigger, styles.readOnlyField]}>
                  <View style={styles.dropdownTriggerLeft}>
                    <Feather name="user-check" size={15} color={colors.muted} />
                    <Text style={styles.dropdownText}>{selectedEntity.salesManager || "-"}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Financial Year</Text>
                           <TouchableOpacity
                style={[styles.dropdownTrigger, formMode === "edit" && styles.readOnlyField]}
                disabled={formMode === "edit"}
                onPress={() => setIsFormYearModalOpen(true)}
              >
                <View style={styles.dropdownTriggerLeft}>
                  <Feather name="calendar" size={15} color={colors.muted} />
                  <Text style={styles.dropdownText}>{formFinancialYear}</Text>
                </View>
                {formMode !== "edit" && <Feather name="chevron-down" size={18} color={colors.muted} />}
              </TouchableOpacity>
            </View>

            {formMode === "create" && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Effective From</Text>
                  <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setIsEffectiveMonthModalOpen(true)}>
                    <View style={styles.dropdownTriggerLeft}>
                      <Feather name="calendar" size={15} color={colors.muted} />
                      <Text style={[styles.dropdownText, !effectiveFromMonth && { color: colors.muted }]}>
                        {effectiveFromMonth ?? "Select month"}
                      </Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Net Quantity</Text>
                  <TextInput
                    style={styles.targetInput}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    editable={Boolean(effectiveFromMonth)}
                    value={netQuantityInput}
                    onChangeText={(val) => setNetQuantityInput(val.replace(/[^0-9.]/g, ""))}
                  />
                  {!effectiveFromMonth && (
                    <Text style={styles.helperText}>Select an Effective From month first</Text>
                  )}
                </View>
              </>
            )}

            <View style={styles.targetGrid}></View>

            <View style={styles.targetGrid}>
              <View style={styles.targetGridHeader}>
                <View style={styles.gridHeaderLabel}>
                  <Feather name="calendar" size={13} color="#1E3A8A" />
                  <Text style={styles.gridHeaderLeft}>Month</Text>
                </View>
                <View style={styles.gridHeaderLabel}>
                  <Feather name="box" size={13} color="#1E3A8A" />
                  <Text style={styles.gridHeaderRight}>Sales Quantity</Text>
                </View>
              </View>

                            {QUOTA_MONTHS.map((month: QuotaMonthName) => {
                const locked = isMonthLocked(month);
                return (
                  <View key={month} style={styles.targetRow}>
                    <View style={styles.targetMonthLeft}>
                      <View style={[styles.monthIconCircle, locked && styles.monthIconCircleLocked]}>
                        <Feather name={locked ? "lock" : "calendar"} size={14} color={locked ? colors.muted : colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.targetMonthLabel}>{month}</Text>
                        <Text style={locked ? styles.lockedTag : styles.editableTag}>
                          {locked ? "Locked" : "Editable"}
                        </Text>
                      </View>
                    </View>
                    <TextInput
                      style={[styles.targetInput, locked && styles.targetInputLocked]}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      editable={!locked}
                      value={locked ? String(monthValues[month] ?? "0") : monthValues[month]}
                      onChangeText={(val) => handleMonthValueChange(month, val)}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.formFooter, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalFooterLabel}>Net Quantity</Text>
              <Text style={styles.totalFooterValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalFormQuantity.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, (assignMutation.isPending || !selectedEntityCode) && styles.submitBtnDisabled]}
              onPress={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || !selectedEntityCode}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Update</Text>
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
                  <Text style={[styles.yearChipText, filterYear === yr && styles.yearChipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsYearModalOpen(false)}>
              <Text style={styles.submitBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

            {/* Form Financial Year Modal */}
      <Modal visible={isFormYearModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Financial Year</Text>
            <View style={styles.yearSelectorRow}>
              {FINANCIAL_YEARS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearChip, formFinancialYear === yr && styles.yearChipActive]}
                  onPress={() => setFormFinancialYear(yr)}
                >
                  <Text style={[styles.yearChipText, formFinancialYear === yr && styles.yearChipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFormYearModalOpen(false)}>
              <Text style={styles.submitBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

           {/* Effective From Month Modal */}
      <Modal visible={isEffectiveMonthModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Effective From Month</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {QUOTA_MONTHS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.managerSelectRow, styles.effectiveMonthRow]}
                  onPress={() => {
                    setEffectiveFromMonth(m);
                    setIsEffectiveMonthModalOpen(false);
                  }}
                >
                  <Text style={styles.managerSelectName}>{m}</Text>
                  {effectiveFromMonth === m && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsEffectiveMonthModalOpen(false)}>
              <Text style={styles.submitBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Entity Selector Modal */}
      <Modal visible={isEntityModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.managerModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {role}</Text>
            <TouchableOpacity onPress={() => { setIsEntityModalOpen(false); setEntitySearchQuery(""); }}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { margin: spacing.md, marginBottom: 0 }]}>
            <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${role.toLowerCase()} by name or code...`}
              placeholderTextColor={colors.muted}
              value={entitySearchQuery}
              onChangeText={setEntitySearchQuery}
            />
            {entitySearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setEntitySearchQuery("")} style={styles.clearSearchBtn}>
                <Feather name="x-circle" size={16} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            {filteredEntityOptions.length === 0 ? (
              <Text style={styles.helperText}>No {role.toLowerCase()} matches "{entitySearchQuery}"</Text>
            ) : (
              filteredEntityOptions.map((entity) => (
                <TouchableOpacity
                  key={entity.code}
                  style={styles.managerSelectRow}
                  onPress={() => {
                    setSelectedEntityCode(entity.code);
                    setIsEntityModalOpen(false);
                  }}
                >
                  <Text style={styles.managerSelectName}>{entity.name}</Text>
                  <Text style={styles.managerSelectCode}>{entity.code}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* View Modal */}
      <Modal visible={Boolean(viewingItem)} transparent animationType="fade" onRequestClose={() => setViewingItem(null)}>
        <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { maxHeight: SCREEN_HEIGHT * 0.82 }]}>
            <View style={styles.viewModalHeader}>
              <View style={styles.viewModalHeaderLeft}>
                <View style={styles.viewModalIconCircle}>
                  <Feather name="eye" size={16} color={colors.white} />
                </View>
                <Text style={styles.modalTitle}>View Sales Target</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingItem(null)}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

                        {viewingItem && (
                            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.82 - 70 }} showsVerticalScrollIndicator={false}>
                <View style={styles.viewInfoGrid}>
                  <View style={styles.viewInfoBlock}>
                    <Text style={styles.viewInfoLabel}>Name</Text>
                    <Text style={styles.viewInfoValue}>{viewingItem.name}</Text>
                  </View>
                  <View style={styles.viewInfoBlock}>
                    <Text style={styles.viewInfoLabel}>Sales Manager</Text>
                    <Text style={styles.viewInfoValue}>{viewingItem.sales_manager || "-"}</Text>
                  </View>
                  <View style={styles.viewInfoBlock}>
                    <Text style={styles.viewInfoLabel}>Designation</Text>
                    <Text style={styles.viewInfoValue}>{viewingItem.role}</Text>
                  </View>
                  <View style={styles.viewInfoBlock}>
                    <Text style={styles.viewInfoLabel}>Financial Year</Text>
                    <Text style={styles.viewInfoValue}>{viewingItem.financial_year}</Text>
                  </View>
                </View>

                <View style={styles.viewSummaryRow}>
                  <View style={styles.viewSummaryBox}>
                    <View>
                      <Text style={styles.viewInfoLabel}>Net Quantity</Text>
                      <Text style={styles.viewSummaryValue}>{viewingItem.annual_quantity.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryIconCircle}>
                      <Feather name="box" size={16} color={colors.primary} />
                    </View>
                  </View>
                  <View style={styles.viewSummaryBox}>
                    <View>
                      <Text style={styles.viewInfoLabel}>Effective From</Text>
                      <Text style={styles.viewSummaryValue}>{getEffectiveFrom(viewingItem).toUpperCase()}</Text>
                    </View>
                    <View style={styles.summaryIconCircle}>
                      <Feather name="calendar" size={16} color={colors.primary} />
                    </View>
                  </View>
                </View>

                               <View style={[styles.monthHeaderRow, { marginTop: spacing.sm }]}>
                  <View style={styles.monthHeaderLabel}>
                    <Feather name="calendar" size={13} color={colors.text} />
                    <Text style={styles.monthHeaderText}>Month</Text>
                  </View>
                  <View style={styles.monthHeaderLabel}>
                    <Feather name="box" size={13} color={colors.text} />
                    <Text style={styles.monthHeaderText}>Quantity</Text>
                  </View>
                </View>
                                {QUOTA_MONTHS.map((month) => {
                  const detail = findDetailForMonth(viewingItem.details, month);
                  return (
                    <View key={month} style={styles.monthRow}>
                      <Text style={styles.monthName}>{month.toUpperCase()}</Text>
                      <Text style={styles.monthQty}>{getMonthQuantity(detail).toLocaleString()}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6, paddingHorizontal: spacing.xl },

  header: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  headerTopRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, paddingBottom: spacing.sm },
  backButton: { padding: 4, marginRight: spacing.sm },
  headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },
  headerSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },

  statsRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    statCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, overflow: "hidden" },
  statLabel: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  statValue: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, marginTop: 2 },
    statIconCircle: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },

  tabContainer: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: radius.sm },
  tabBtnActive: { backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontFamily: typography.medium, color: colors.muted },
  tabTextActive: { color: colors.primary, fontFamily: typography.bold },

  searchFilterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, height: 40 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 4 },
  calendarIconBtn: { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },

  roleFilterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  roleFilterPill: { flex: 1, height: 36, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  roleFilterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleFilterPillText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary },
  roleFilterPillTextActive: { color: colors.white, fontFamily: typography.bold },

  listContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface },
   nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  srNo: { fontSize: 12, fontFamily: typography.medium, color: colors.muted, flexShrink: 0 },
  entityName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, flexShrink: 1, flexWrap: "wrap" },
  entityMeta: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF" },

  totalsRow: { flexDirection: "row", backgroundColor: "#F8FAFC", padding: spacing.sm },
  totalCol: { flex: 1, alignItems: "center" },
  totalDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 4 },
  totalValue: { fontSize: 14, fontFamily: typography.bold, color: colors.text },

    formContainer: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  formGroup: { marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginBottom: 8 },
    dropdownTrigger: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: radius.sm, overflow: "hidden" },
    dropdownTriggerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  dropdownText: { fontSize: 14, fontFamily: typography.medium, color: colors.text, flexShrink: 1 },
  readOnlyField: { backgroundColor: colors.surface },
  helperText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginTop: 6 },

  yearSelectorRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  yearChip: { flex: 1, minWidth: 90, paddingVertical: 10, alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  yearChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  yearChipText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },
  yearChipTextActive: { color: colors.white, fontFamily: typography.bold },

  targetGrid: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.xxl },
  targetGridHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#DBEAFE", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  gridHeaderLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  gridHeaderLeft: { fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A" },
  gridHeaderRight: { fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A", textAlign: "right" },
  targetMonthLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  monthIconCircle: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  monthIconCircleLocked: { backgroundColor: "#F3F4F6" },
  editableTag: { fontSize: 10, fontFamily: typography.semibold, color: "#16A34A", marginTop: 1 },
  lockedTag: { fontSize: 10, fontFamily: typography.semibold, color: colors.muted, marginTop: 1 },
  emptyTitle: { fontFamily: typography.bold, fontSize: 16, color: colors.muted, marginTop: spacing.md },
  errorSubtitle: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },

  retryButton: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.primary },
  retryButtonText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  targetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surface },
  targetMonthLabel: { flex: 1, fontSize: 14, fontFamily: typography.bold, color: colors.text },
    targetInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: typography.medium, color: colors.text, textAlign: "right" },
  targetInputLocked: { backgroundColor: "#F3F4F6", color: colors.muted },

  formFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    totalBlock: { flexShrink: 0 },
  totalFooterLabel: { fontSize: 11, fontFamily: typography.bold, color: colors.muted, marginBottom: 2 },
  totalFooterValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  submitBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.xl },
    modalCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg, flexShrink: 1 },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.lg },
  applyBtn: { backgroundColor: colors.text, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.md },

  managerModalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  managerSelectRow: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: radius.sm, marginBottom: spacing.sm },
  managerSelectName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
    managerSelectCode: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  effectiveMonthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  paginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  paginationText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageBtn: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text, minWidth: 36, textAlign: "center" },

  viewModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  viewModalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  viewModalIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  viewInfoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: spacing.sm },
  viewInfoBlock: { minWidth: "45%" },
  viewInfoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  viewInfoValue: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  viewSummaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
    viewSummaryBox: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderRadius: radius.md, padding: spacing.sm, overflow: "hidden" },
  viewSummaryValue: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, marginTop: 2 },
  summaryIconCircle: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },

  monthHeaderRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#EFF6FF", paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radius.sm, marginBottom: 4 },
  monthHeaderLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  monthHeaderText: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.text },
  monthRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  monthName: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },
  monthQty: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
});