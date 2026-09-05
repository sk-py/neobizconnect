import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { createSubDealer, fetchSubDealers, updateSubDealer } from "../services/sub-dealers-api";
import { SubDealer } from "../types";

const formSchema = z.object({
    shopName: z.string().min(1, "Shop Name is required"),
    businessType: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    gstNo: z.string(),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string(),
    phone: z.string().min(10, "Valid phone is required"),
    email: z.string(),
    instagram: z.string(),
    brandsCurrentlySold: z.string(),
    potentialSalesPerMonth: z.string(),
    subDealerStatus: z.string(),
    remarks: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const STATUS_OPTIONS = ["Active", "Inactive"];

export const SubDealerScreen = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const groupCompanyName = user?.group_company_name || "Neo";
    const registeredByName = user?.name || "NA";

    const [activeTab, setActiveTab] = useState<"list" | "create">("list");
    const [editingDealer, setEditingDealer] = useState<SubDealer | null>(null);

    // --- Data Fetching ---
    const { data: dealers, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ["sub-dealers", groupCompanyName],
        queryFn: () => fetchSubDealers(groupCompanyName),
        enabled: Boolean(groupCompanyName),
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (values: FormValues) => createSubDealer(groupCompanyName, {
            ...values,
            registeredBy: registeredByName,
            registrationDateTime: format(new Date(), "yyyy-MM-dd HH:mm:ss")
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sub-dealers"] });
            if (Platform.OS === "android") ToastAndroid.show("Sub-Dealer registered successfully!", ToastAndroid.SHORT);
            createForm.reset();
            setActiveTab("list");
        },
        onError: () => {
            if (Platform.OS === "android") ToastAndroid.show("Failed to register Sub-Dealer.", ToastAndroid.SHORT);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (payload: FormValues & { id: number; card_code: string }) => updateSubDealer(groupCompanyName, {
            ...payload,
            registeredBy: editingDealer?.registeredBy || registeredByName,
            registrationDateTime: editingDealer?.registrationDateTime || format(new Date(), "yyyy-MM-dd HH:mm:ss")
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sub-dealers"] });
            if (Platform.OS === "android") ToastAndroid.show("Sub-Dealer updated successfully!", ToastAndroid.SHORT);
            setEditingDealer(null);
        },
        onError: () => {
            if (Platform.OS === "android") ToastAndroid.show("Failed to update Sub-Dealer.", ToastAndroid.SHORT);
        },
    });

    // --- Forms ---
    const defaultFormValues = {
        shopName: "", businessType: "", address: "", city: "", state: "", pincode: "",
        gstNo: "", firstName: "", lastName: "", phone: "", email: "", instagram: "",
        brandsCurrentlySold: "", potentialSalesPerMonth: "", subDealerStatus: "Active", remarks: ""
    };

    const createForm = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });

    const editForm = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        if (editingDealer) {
            editForm.reset({
                shopName: editingDealer.shopName || "",
                businessType: editingDealer.businessType || "",
                address: editingDealer.address || "",
                city: editingDealer.city || "",
                state: editingDealer.state || "",
                pincode: editingDealer.pincode || "",
                gstNo: editingDealer.gstNo || "",
                firstName: editingDealer.firstName || "",
                lastName: editingDealer.lastName || "",
                phone: editingDealer.phone || "",
                email: editingDealer.email || "",
                instagram: editingDealer.instagram || "",
                brandsCurrentlySold: editingDealer.brandsCurrentlySold || "",
                potentialSalesPerMonth: editingDealer.potentialSalesPerMonth || "",
                subDealerStatus: editingDealer.subDealerStatus || "Active",
                remarks: editingDealer.remarks || "",
            });
        }
    }, [editingDealer]);

    const onCreateSubmit = (values: FormValues) => createMutation.mutate(values);

    const onEditSubmit = (values: FormValues) => {
        if (editingDealer) {
            updateMutation.mutate({ ...values, id: editingDealer.id, card_code: editingDealer.card_code });
        }
    };

    // --- Renders ---
    const renderCard = ({ item }: { item: SubDealer }) => {
        const isActive = item.subDealerStatus === "Active";

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardShopName}>{item.shopName || "Unknown Shop"}</Text>
                        <Text style={styles.cardContact}>{item.firstName} {item.lastName}</Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                                {item.subDealerStatus || "Unknown"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setEditingDealer(item)} style={styles.editBtn}>
                            <Feather name="edit-2" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>City</Text>
                        <Text style={styles.infoValue}>{item.city || "-"}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{item.phone || "-"}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>Type: {item.businessType || "-"}</Text>
                </View>
            </View>
        );
    };

    const FormField = ({ control, name, label, placeholder, isTextArea = false, isNumeric = false }: any) => (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                        style={[styles.input, isTextArea && styles.textArea, error && styles.inputError]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.muted}
                        multiline={isTextArea}
                        textAlignVertical={isTextArea ? "top" : "center"}
                        keyboardType={isNumeric ? "numeric" : "default"}
                        value={value}
                        onChangeText={onChange}
                    />
                    {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
            )}
        />
    );

    const FormSection = ({ title, children }: any) => (
        <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const renderFormContent = (control: any, isEditing: boolean = false) => (
        <>
            <FormSection title="1. Shop Details">
                <FormField control={control} name="shopName" label="Shop Name" placeholder="Enter shop name" />
                <FormField control={control} name="businessType" label="Business Type" placeholder="e.g. Alloy Wheel Dealer" />
                <FormField control={control} name="address" label="Address" placeholder="Enter complete address" isTextArea />
                <View style={styles.row}>
                    <View style={styles.colHalf}><FormField control={control} name="city" label="City" placeholder="Enter city" /></View>
                    <View style={styles.colHalf}><FormField control={control} name="state" label="State" placeholder="Enter state" /></View>
                </View>
                <View style={styles.row}>
                    <View style={styles.colHalf}><FormField control={control} name="pincode" label="Pincode" placeholder="Enter pincode" isNumeric /></View>
                    <View style={styles.colHalf}><FormField control={control} name="gstNo" label="GST Number" placeholder="Enter GST Number" /></View>
                </View>
            </FormSection>

            <FormSection title="2. Contact Details">
                <View style={styles.row}>
                    <View style={styles.colHalf}><FormField control={control} name="firstName" label="First Name" placeholder="Contact first name" /></View>
                    <View style={styles.colHalf}><FormField control={control} name="lastName" label="Last Name" placeholder="Contact last name" /></View>
                </View>
                <FormField control={control} name="phone" label="Phone Number" placeholder="Enter phone number" isNumeric />
                <FormField control={control} name="email" label="Email ID" placeholder="Enter email address" />
                <FormField control={control} name="instagram" label="Instagram ID" placeholder="Enter Instagram ID" />
            </FormSection>

            <FormSection title="3. Business Potential">
                <FormField control={control} name="brandsCurrentlySold" label="Brands Currently Sold" placeholder="Enter current brands" />
                <FormField control={control} name="potentialSalesPerMonth" label="Potential Sales Per Month" placeholder="e.g. 100 sets/month" />

                <Controller
                    control={control}
                    name="subDealerStatus"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Sub-Dealer Status</Text>
                            <View style={styles.statusChipContainer}>
                                {STATUS_OPTIONS.map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.statusChip, value === status && styles.statusChipActive]}
                                        onPress={() => onChange(status)}
                                    >
                                        <Text style={[styles.statusChipText, value === status && styles.statusChipTextActive]}>{status}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                />

                <FormField control={control} name="remarks" label="Remarks" placeholder="Add notes about dealer potential..." isTextArea />
            </FormSection>

            {!isEditing && (
                <FormSection title="4. System Details (Auto-filled)">
                    <View style={styles.systemDetailsBox}>
                        <Text style={styles.systemDetailsText}>Registered By: <Text style={{ fontFamily: typography.bold }}>{registeredByName}</Text></Text>
                        <Text style={styles.systemDetailsText}>Date & Time: <Text style={{ fontFamily: typography.bold }}>{format(new Date(), "dd/MM/yyyy hh:mm a")}</Text></Text>
                    </View>
                </FormSection>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sub-Dealers</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]} onPress={() => setActiveTab("list")}>
                    <Feather name="list" size={16} color={activeTab === "list" ? colors.primary : colors.muted} />
                    <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === "create" && styles.tabBtnActive]} onPress={() => setActiveTab("create")}>
                    <Feather name="plus-circle" size={16} color={activeTab === "create" ? colors.primary : colors.muted} />
                    <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>Register</Text>
                </TouchableOpacity>
            </View>

            {activeTab === "list" ? (
                isLoading ? (
                    <View style={styles.centerBox}><ActivityIndicator size="large" color={colors.primary} /></View>
                ) : dealers?.length === 0 ? (
                    <View style={styles.centerBox}>
                        <Feather name="users" size={48} color={colors.muted} />
                        <Text style={styles.emptyTitle}>No Sub-Dealers found</Text>
                    </View>
                ) : (
                    <LegendList
                        data={dealers}
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
                <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
                    {renderFormContent(createForm.control, false)}
                    <TouchableOpacity
                        style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
                        onPress={createForm.handleSubmit(onCreateSubmit)}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Register Sub-Dealer</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Edit Modal */}
            <Modal visible={Boolean(editingDealer)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingDealer(null)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Update Sub-Dealer</Text>
                        <TouchableOpacity onPress={() => setEditingDealer(null)} style={styles.closeBtn}>
                            <Feather name="x" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
                        {renderFormContent(editForm.control, true)}
                        <TouchableOpacity
                            style={[styles.submitBtn, updateMutation.isPending && styles.submitBtnDisabled]}
                            onPress={editForm.handleSubmit(onEditSubmit)}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>Update Details</Text>
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
    header: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.white },
    backButton: { padding: 4, marginRight: spacing.sm },
    headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },

    tabContainer: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
    tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: radius.sm },
    tabBtnActive: { backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    tabText: { fontSize: 14, fontFamily: typography.medium, color: colors.muted },
    tabTextActive: { color: colors.primary, fontFamily: typography.bold },

    listContent: { padding: spacing.md, gap: spacing.md },
    emptyTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text, marginTop: spacing.md },

    card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
    cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    cardShopName: { fontSize: 16, fontFamily: typography.bold, color: colors.text, marginBottom: 2 },
    cardContact: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary },
    editBtn: { padding: 6, backgroundColor: "#EFF6FF", borderRadius: radius.sm },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
    statusActive: { backgroundColor: "#DCFCE7" },
    statusInactive: { backgroundColor: "#F1F5F9" },
    statusText: { fontSize: 11, fontFamily: typography.bold },
    statusTextActive: { color: "#166534" },
    statusTextInactive: { color: "#475569" },

    cardBody: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
    infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footerText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },

    formContainer: { padding: spacing.md },
    formSection: { marginBottom: spacing.md, backgroundColor: colors.white, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
    formSectionTitle: { fontSize: 14, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },

    row: { flexDirection: "row", gap: spacing.sm },
    colHalf: { flex: 1 },

    inputGroup: { marginBottom: 12 },
    inputLabel: { fontSize: 12, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: typography.medium, color: colors.text },
    inputError: { borderColor: colors.error },
    textArea: { height: 60 },
    errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginTop: 4 },

    statusChipContainer: { flexDirection: "row", gap: spacing.sm },
    statusChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    statusChipActive: { backgroundColor: colors.text, borderColor: colors.text },
    statusChipText: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary },
    statusChipTextActive: { color: colors.white, fontFamily: typography.bold },

    systemDetailsBox: { backgroundColor: colors.surface, padding: 12, borderRadius: radius.sm },
    systemDetailsText: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 4 },

    submitBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: radius.sm, alignItems: "center", marginBottom: spacing.xxl },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: colors.white, fontSize: 16, fontFamily: typography.bold },

    modalContainer: { flex: 1, backgroundColor: colors.surface },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
    closeBtn: { padding: 4 },
});