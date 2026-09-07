import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";
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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    assignSubDealerTarget,
    fetchSingleSubDealerTargetYear,
    fetchSubDealers,
    fetchSubDealerTargetsList
} from "../services/sub-dealers-api";
import { TargetQuotaListV2Item, TargetQuotaMonth } from "../types";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Utility to generate financial year strings (e.g. Apr-27)
const generateFinancialYearMonths = (yearStr: string) => {
    const parts = yearStr.split("-");
    if (parts.length !== 2) return [];
    
    const startYear = parts[0].slice(-2);
    const endYear = parts[1].slice(-2);
    
    const monthsFirstHalf = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsSecondHalf = ["Jan", "Feb", "Mar"];
    
    return [
        ...monthsFirstHalf.map(m => `${m}-${startYear}`),
        ...monthsSecondHalf.map(m => `${m}-${endYear}`)
    ];
};

export const SubDealerTargetsScreen = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const groupCompanyName = user?.group_company_name || "Neo";

    // Defaults (Based on Sept 2026 Context)[cite: 1]
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = MONTH_NAMES[new Date().getMonth()];

    // UI States
    const [activeTab, setActiveTab] = useState<"list" | "assign">("list");
    
    // Filter States
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState(currentMonth);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Form States
    const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
    const [formFinancialYear, setFormFinancialYear] = useState("2026-2027");
    const [monthValues, setMonthValues] = useState<Record<string, string>>({});
    const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);

    // --- Queries ---
    const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
        queryKey: ["sub-dealer-targets", groupCompanyName, filterYear, filterMonth],
        queryFn: () => fetchSubDealerTargetsList(groupCompanyName, filterYear, [filterMonth]),
        enabled: Boolean(groupCompanyName),
    });

    const { data: subDealers } = useQuery({
        queryKey: ["sub-dealers", groupCompanyName],
        queryFn: () => fetchSubDealers(groupCompanyName),
        enabled: Boolean(groupCompanyName) && activeTab === "assign",
    });

    // --- Mutations ---
    const fetchEditDataMutation = useMutation({
        mutationFn: (payload: { id: number, year: string }) => fetchSingleSubDealerTargetYear(groupCompanyName, payload.id, payload.year),
        onSuccess: (data) => {
            if (data && Array.isArray(data)) {
                const newValues: Record<string, string> = {};
                data.forEach((item) => {
                    newValues[item.month] = item.quantity.toString();
                });
                setMonthValues(newValues);
            }
        }
    });

    const assignMutation = useMutation({
        mutationFn: async () => {
            if (!selectedDealerId) throw new Error("Select a Sub Dealer");
            
            const generatedMonths = generateFinancialYearMonths(formFinancialYear);
            const quotaPayload: TargetQuotaMonth[] = generatedMonths.map(month => ({
                month,
                amount: 0,
                quantity: parseInt(monthValues[month] || "0", 10)
            }));

            return assignSubDealerTarget(groupCompanyName, {
                neo_subdealer_id: selectedDealerId,
                year: formFinancialYear,
                Quota: quotaPayload
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sub-dealer-targets"] });
            if (Platform.OS === "android") ToastAndroid.show("Target assigned successfully!", ToastAndroid.SHORT);
            setActiveTab("list");
            setMonthValues({});
            setSelectedDealerId(null);
        },
        onError: (err: any) => {
            if (Platform.OS === "android") ToastAndroid.show(err.message || "Failed to assign target.", ToastAndroid.SHORT);
        }
    });

    // --- Handlers ---
    const handleEdit = (item: TargetQuotaListV2Item) => {
        setSelectedDealerId(item.neo_subdealer_id);
        setFormFinancialYear(item.year);
        setActiveTab("assign");
        fetchEditDataMutation.mutate({ id: item.neo_subdealer_id, year: item.year });
    };

    const handleMonthValueChange = (month: string, val: string) => {
        setMonthValues(prev => ({ ...prev, [month]: val.replace(/[^0-9]/g, '') }));
    };

    const formMonths = generateFinancialYearMonths(formFinancialYear);
    const totalQuantity = formMonths.reduce((acc, month) => acc + (parseInt(monthValues[month] || "0", 10)), 0);
    const selectedDealerObj = subDealers?.find(d => d.id === selectedDealerId);

    // --- Renders ---
    const renderListCard = ({ item }: { item: TargetQuotaListV2Item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.dealerName}>{item.neo_subdealer_name}</Text>
                    <Text style={styles.dealerMeta}>{item.card_code} • {item.location}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                    <Feather name="edit-2" size={14} color={colors.primary} />
                    <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.monthsGrid}>
                <View style={styles.monthCol}>
                    <Text style={styles.monthLabel}>{item.previousMonth_3_name}</Text>
                    <Text style={styles.monthValue}>{item.previousMonth_3_quantity}</Text>
                </View>
                <View style={styles.monthDivider} />
                <View style={styles.monthCol}>
                    <Text style={styles.monthLabel}>{item.previousMonth_2_name}</Text>
                    <Text style={styles.monthValue}>{item.previousMonth_2_quantity}</Text>
                </View>
                <View style={styles.monthDivider} />
                <View style={styles.monthCol}>
                    <Text style={styles.monthLabel}>{item.previousMonth_1_name}</Text>
                    <Text style={styles.monthValue}>{item.previousMonth_1_quantity}</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.yearBadge}>{item.year}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sales Targets</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]} onPress={() => setActiveTab("list")}>
                    <Feather name="list" size={16} color={activeTab === "list" ? colors.primary : colors.muted} />
                    <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === "assign" && styles.tabBtnActive]} onPress={() => { setActiveTab("assign"); setMonthValues({}); setSelectedDealerId(null); }}>
                    <Feather name="target" size={16} color={activeTab === "assign" ? colors.primary : colors.muted} />
                    <Text style={[styles.tabText, activeTab === "assign" && styles.tabTextActive]}>Assign Target</Text>
                </TouchableOpacity>
            </View>

            {activeTab === "list" ? (
                <>
                    <View style={styles.filterBar}>
                        <TouchableOpacity style={styles.filterPill} onPress={() => setIsFilterModalOpen(true)}>
                            <Feather name="calendar" size={14} color={colors.text} />
                            <Text style={styles.filterPillText}>{filterMonth} {filterYear}</Text>
                            <Feather name="chevron-down" size={14} color={colors.muted} />
                        </TouchableOpacity>
                    </View>

                    {listLoading ? (
                        <View style={styles.centerBox}><ActivityIndicator size="large" color={colors.primary} /></View>
                    ) : listData?.length === 0 ? (
                        <View style={styles.centerBox}>
                            <Feather name="pie-chart" size={48} color={colors.muted} />
                            <Text style={styles.emptyTitle}>No targets found</Text>
                        </View>
                    ) : (
                        <LegendList
                            data={listData || []}
                            keyExtractor={(item) => item.id.toString()}
                            estimatedItemSize={140}
                            renderItem={renderListCard}
                            contentContainerStyle={styles.listContent}
                            onRefresh={refetchList}
                            refreshing={listLoading}
                        />
                    )}
                </>
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Select Sub-Dealer</Text>
                            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setIsDealerModalOpen(true)}>
                                <Text style={[styles.dropdownText, !selectedDealerObj && { color: colors.muted }]}>
                                    {selectedDealerObj ? `${selectedDealerObj.shopName} (${selectedDealerObj.card_code})` : "Select a dealer"}
                                </Text>
                                <Feather name="chevron-down" size={18} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Financial Year</Text>
                            <View style={styles.yearSelectorRow}>
                                {["2026-2027", "2027-2028"].map(yr => (
                                    <TouchableOpacity 
                                        key={yr} 
                                        style={[styles.yearChip, formFinancialYear === yr && styles.yearChipActive]}
                                        onPress={() => { setFormFinancialYear(yr); setMonthValues({}); }}
                                    >
                                        <Text style={[styles.yearChipText, formFinancialYear === yr && styles.yearChipTextActive]}>{yr}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.targetGrid}>
                            <View style={styles.targetGridHeader}>
                                <Text style={styles.gridHeaderLeft}>Month</Text>
                                <Text style={styles.gridHeaderRight}>Sales Quantity</Text>
                            </View>
                            
                            {fetchEditDataMutation.isPending ? (
                                <ActivityIndicator style={{ marginVertical: spacing.xl }} color={colors.primary} />
                            ) : (
                                formMonths.map((month) => (
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
                                ))
                            )}
                        </View>

                    </ScrollView>

                    <View style={styles.formFooter}>
                        <View style={styles.totalBlock}>
                            <Text style={styles.totalLabel}>Total Quantity</Text>
                            <Text style={styles.totalValue}>{totalQuantity.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.submitBtn, (assignMutation.isPending || !selectedDealerId) && styles.submitBtnDisabled]}
                            onPress={() => assignMutation.mutate()}
                            disabled={assignMutation.isPending || !selectedDealerId}
                        >
                            {assignMutation.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Submit Target</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* List Filter Modal */}
            <Modal visible={isFilterModalOpen} transparent  animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Filter Targets</Text>
                        
                        <Text style={styles.inputLabel}>Select Year</Text>
                        <View style={styles.yearSelectorRow}>
                            {["2025", "2026", "2027"].map(yr => (
                                <TouchableOpacity key={yr} style={[styles.yearChip, filterYear === yr && styles.yearChipActive]} onPress={() => setFilterYear(yr)}>
                                    <Text style={[styles.yearChipText, filterYear === yr && styles.yearChipTextActive]}>{yr}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Select Month</Text>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            <View style={styles.monthsWrap}>
                                {MONTH_NAMES.map(m => (
                                    <TouchableOpacity key={m} style={[styles.monthChip, filterMonth === m && styles.monthChipActive]} onPress={() => setFilterMonth(m)}>
                                        <Text style={[styles.monthChipText, filterMonth === m && styles.monthChipTextActive]}>{m.slice(0,3)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.applyBtn} onPress={() => { setIsFilterModalOpen(false); refetchList(); }}>
                            <Text style={styles.submitBtnText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Dealer Selector Modal */}
            <Modal visible={isDealerModalOpen} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.dealerModalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Dealer</Text>
                        <TouchableOpacity onPress={() => setIsDealerModalOpen(false)}>
                            <Feather name="x" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
                        {subDealers?.map(dealer => (
                            <TouchableOpacity 
                                key={dealer.id} 
                                style={styles.dealerSelectRow}
                                onPress={() => { setSelectedDealerId(dealer.id); setIsDealerModalOpen(false); }}
                            >
                                <Text style={styles.dealerSelectName}>{dealer.shopName}</Text>
                                <Text style={styles.dealerSelectCode}>{dealer.card_code}</Text>
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
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
    
    header: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.white },
    backButton: { padding: 4, marginRight: spacing.sm },
    headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },

    tabContainer: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
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
    dealerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 2 },
    dealerMeta: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
    editBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.xl },
    editBtnText: { fontSize: 12, fontFamily: typography.bold, color: colors.primary },
    
    monthsGrid: { flexDirection: "row", backgroundColor: "#F8FAFC", padding: spacing.sm },
    monthCol: { flex: 1, alignItems: "center" },
    monthDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
    monthLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 4 },
    monthValue: { fontSize: 14, fontFamily: typography.bold, color: colors.text },
    
    cardFooter: { padding: spacing.sm, alignItems: "flex-end", backgroundColor: colors.white, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
    yearBadge: { fontSize: 11, fontFamily: typography.bold, color: colors.muted, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

    formContainer: { padding: spacing.md },
    formGroup: { marginBottom: spacing.lg },
    inputLabel: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginBottom: 8 },
    dropdownTrigger: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: radius.sm },
    dropdownText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },
    
    yearSelectorRow: { flexDirection: "row", gap: spacing.sm },
    yearChip: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
    yearChipActive: { backgroundColor: colors.text, borderColor: colors.text },
    yearChipText: { fontSize: 14, fontFamily: typography.medium, color: colors.text },
    yearChipTextActive: { color: colors.white, fontFamily: typography.bold },

    targetGrid: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.xxl },
    targetGridHeader: { flexDirection: "row", backgroundColor: "#DBEAFE", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    gridHeaderLeft: { flex: 1, fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A" },
    gridHeaderRight: { flex: 1, fontSize: 12, fontFamily: typography.bold, color: "#1E3A8A", textAlign: "right" },
    emptyTitle: {fontFamily: typography.bold, fontSize: 16, color: colors.muted, marginTop: spacing.md },

    targetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surface },
    targetMonthLabel: { flex: 1, fontSize: 14, fontFamily: typography.bold, color: colors.text },
    targetInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: typography.medium, color: colors.text, textAlign: "right" },

    formFooter: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    totalBlock: { flex: 1 },
    totalLabel: { fontSize: 11, fontFamily: typography.bold, color: colors.muted, marginBottom: 2 },
    totalValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
    submitBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.xl },
    modalCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg },
    modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.lg },
    monthsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
    monthChip: { width: "30%", alignItems: "center", paddingVertical: 8, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
    monthChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    monthChipText: { fontSize: 12, fontFamily: typography.medium, color: colors.text },
    monthChipTextActive: { color: colors.white, fontFamily: typography.bold },
    applyBtn: { backgroundColor: colors.text, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.md },

    dealerModalContainer: { flex: 1, backgroundColor: colors.surface },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    dealerSelectRow: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: radius.sm, marginBottom: spacing.sm },
    dealerSelectName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
    dealerSelectCode: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
});