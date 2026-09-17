import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
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
import { z } from "zod";
import { createDealerQuery, fetchDealerQueries, updateDealerQuery } from "../services/dealer-query.api";
import { DealerQuery } from "../types";

const formSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    query: z.string().min(1, "Query is required"),
    remarks: z.string(),
    status: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const STATUS_OPTIONS = ["Open", "Under Review", "In Progress", "Closed"];

export const DealerQueryScreen = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const groupCompanyName = user?.group_company_name || "Neo";

    // Check role/authority to conditionally render inputs
    const isDealer = user?.authority === "Dealer";
    // Admin/Super Admin can view and edit (Status + Remarks) but not create
    // new dealer queries — matches the web Admin Portal exactly.
    const canCreate = user?.authority !== "Admin" && user?.authority !== "Super Admin";

    const [activeTab, setActiveTab] = useState<"list" | "create">("list");
    const [editingQuery, setEditingQuery] = useState<DealerQuery | null>(null);

    // --- Data Fetching ---
    const { data: queries, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ["dealer-queries"],
        queryFn: fetchDealerQueries,
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (values: FormValues) => createDealerQuery(groupCompanyName, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dealer-queries"] });
            if (Platform.OS === "android") ToastAndroid.show("Query submitted successfully!", ToastAndroid.SHORT);
            createForm.reset();
            setActiveTab("list");
        },
        onError: () => {
            if (Platform.OS === "android") ToastAndroid.show("Failed to submit query.", ToastAndroid.SHORT);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (payload: FormValues & { id: number }) => updateDealerQuery(groupCompanyName, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dealer-queries"] });
            if (Platform.OS === "android") ToastAndroid.show("Query updated successfully!", ToastAndroid.SHORT);
            setEditingQuery(null);
        },
        onError: () => {
            if (Platform.OS === "android") ToastAndroid.show("Failed to update query.", ToastAndroid.SHORT);
        },
    });

    // --- Forms ---
    const createForm = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { subject: "", query: "", remarks: "", status: "Open" }, // Defaulted to Open for new queries
    });

    const editForm = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { subject: "", query: "", remarks: "", status: "" },
    });

    useEffect(() => {
        if (editingQuery) {
            editForm.reset({
                subject: editingQuery.subject || "",
                query: editingQuery.query || "",
                remarks: editingQuery.remarks || "",
                status: editingQuery.status || "Open",
            });
        }
    }, [editingQuery]);

    const onCreateSubmit = (values: FormValues) => createMutation.mutate(values);

    const onEditSubmit = (values: FormValues) => {
        if (editingQuery) {
            updateMutation.mutate({ ...values, id: editingQuery.id });
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleDateString("en-GB");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open": return { bg: "#DBEAFE", text: "#1D4ED8" };
            case "Under Review": return { bg: "#FEF9C3", text: "#A16207" };
            case "In Progress": return { bg: "#FFEDD5", text: "#C2410C" };
            case "Closed": return { bg: "#F3F4F6", text: "#374151" };
            default: return { bg: colors.surface, text: colors.textSecondary };
        }
    };

    const renderCard = ({ item }: { item: DealerQuery }) => {
        const statusTheme = getStatusColor(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardSubject}>{item.subject || "No Subject"}</Text>
                    <TouchableOpacity onPress={() => setEditingQuery(item)} style={styles.editBtn}>
                        <Feather name="edit-2" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.cardQuery} numberOfLines={3}>{item.query}</Text>

                {item.remarks ? (
                    <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>Remarks:</Text>
                        <Text style={styles.remarksText}>{item.remarks}</Text>
                    </View>
                ) : null}

                <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                        <Text style={[styles.statusText, { color: statusTheme.text }]}>{item.status}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dealer Queries</Text>
                <Text style={styles.headerSubTitle}>Here is a list of dealer queries</Text>
            </View>

            {/* Tabs — Admin/Super Admin are list+edit only, no Create tab */}
            {canCreate && (
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("list")}
                    >
                        <Feather name="list" size={16} color={activeTab === "list" ? colors.primary : colors.muted} />
                        <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>List</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "create" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("create")}
                    >
                        <Feather name="plus-circle" size={16} color={activeTab === "create" ? colors.primary : colors.muted} />
                        <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>Create</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Tab Content */}
            {activeTab === "list" ? (
                isLoading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : queries?.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Feather name="message-square" size={48} color={colors.muted} />
                        <Text style={styles.emptyTitle}>No queries found</Text>
                    </View>
                ) : (
                    <LegendList
                        data={queries}
                        keyExtractor={(item) => item.id.toString()}
                        estimatedItemSize={160}
                        renderItem={renderCard}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onRefresh={refetch}
                        refreshing={isRefetching}
                        recycleItems={true}
                    />
                )
            ) : (
                <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.formSectionTitle}>Create New Query</Text>

                    <Controller
                        control={createForm.control}
                        name="subject"
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Subject</Text>
                                <TextInput
                                    style={[styles.input, error && styles.inputError]}
                                    placeholder="Enter subject"
                                    placeholderTextColor={colors.muted}
                                    value={value}
                                    onChangeText={onChange}
                                />
                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    <Controller
                        control={createForm.control}
                        name="query"
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Query</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, error && styles.inputError]}
                                    placeholder="Enter query details"
                                    placeholderTextColor={colors.muted}
                                    multiline
                                    textAlignVertical="top"
                                    value={value}
                                    onChangeText={onChange}
                                />
                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    {!isDealer && (
                        <>
                            <Controller
                                control={createForm.control}
                                name="remarks"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Remarks</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            placeholder="Enter remarks"
                                            placeholderTextColor={colors.muted}
                                            multiline
                                            textAlignVertical="top"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                    </View>
                                )}
                            />

                            <Controller
                                control={createForm.control}
                                name="status"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Status</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipContainer}>
                                            {STATUS_OPTIONS.map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={[styles.statusChip, value === status && styles.statusChipActive]}
                                                    onPress={() => onChange(status)}
                                                >
                                                    <Text style={[styles.statusChipText, value === status && styles.statusChipTextActive]}>{status}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            />
                        </>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
                        onPress={createForm.handleSubmit(onCreateSubmit)}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Query</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Edit Modal */}
            <Modal visible={Boolean(editingQuery)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingQuery(null)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Update Query</Text>
                        <TouchableOpacity onPress={() => setEditingQuery(null)} style={styles.closeBtn}>
                            <Feather name="x" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                        <Controller
                            control={editForm.control}
                            name="subject"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Subject</Text>
                                    <TextInput style={styles.input} value={value} onChangeText={onChange} />
                                </View>
                            )}
                        />

                        <Controller
                            control={editForm.control}
                            name="query"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Query</Text>
                                    <TextInput style={[styles.input, styles.textArea]} multiline textAlignVertical="top" value={value} onChangeText={onChange} />
                                </View>
                            )}
                        />

                        {!isDealer && (
                            <>
                                <Controller
                                    control={editForm.control}
                                    name="remarks"
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Remarks</Text>
                                            <TextInput style={[styles.input, styles.textArea]} multiline textAlignVertical="top" value={value} onChangeText={onChange} />
                                        </View>
                                    )}
                                />

                                <Controller
                                    control={editForm.control}
                                    name="status"
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Status</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipContainer}>
                                                {STATUS_OPTIONS.map((status) => (
                                                    <TouchableOpacity
                                                        key={status}
                                                        style={[styles.statusChip, value === status && styles.statusChipActive]}
                                                        onPress={() => onChange(status)}
                                                    >
                                                        <Text style={[styles.statusChipText, value === status && styles.statusChipTextActive]}>{status}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.submitBtn, updateMutation.isPending && styles.submitBtnDisabled]}
                            onPress={editForm.handleSubmit(onEditSubmit)}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>Update Query</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.surface },
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: spacing.md, backgroundColor: colors.white },
    backButton: { padding: 4, marginRight: spacing.sm },
    headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text, paddingBottom: 2 },
    headerSubTitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary },
    tabContainer: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
    tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: radius.sm },
    tabBtnActive: { backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    tabText: { fontSize: 14, fontFamily: typography.medium, color: colors.muted },
    tabTextActive: { color: colors.primary, fontFamily: typography.bold },

    listContent: { padding: spacing.md, gap: spacing.md },
    emptyTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text, marginTop: spacing.md },

    card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm },
    cardSubject: { flex: 1, fontSize: 15, fontFamily: typography.bold, color: colors.text, marginRight: spacing.md },
    editBtn: { padding: 6, backgroundColor: "#EFF6FF", borderRadius: radius.sm },
    cardQuery: { fontSize: 13, fontFamily: typography.regular, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
    remarksBox: { backgroundColor: "#F8FAFC", padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    remarksLabel: { fontSize: 11, fontFamily: typography.bold, color: colors.textSecondary, marginBottom: 2 },
    remarksText: { fontSize: 12, fontFamily: typography.regular, color: colors.text },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.surface, paddingTop: spacing.sm },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
    statusText: { fontSize: 11, fontFamily: typography.bold },
    dateText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },

    formContent: { padding: spacing.lg },
    formSectionTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 8 },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, fontSize: 14, fontFamily: typography.medium, color: colors.text },
    inputError: { borderColor: colors.error },
    textArea: { height: 120 },
    errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginTop: 4 },

    submitBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.md },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: colors.white, fontSize: 16, fontFamily: typography.bold },

    modalContainer: { flex: 1, backgroundColor: colors.surface },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
    closeBtn: { padding: 4 },

    statusChipContainer: { flexDirection: "row", gap: spacing.sm },
    statusChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
    statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    statusChipText: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary },
    statusChipTextActive: { color: colors.white, fontFamily: typography.bold },
});