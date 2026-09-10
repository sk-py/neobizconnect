import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import {
  fetchAssignedToOptions,
  fetchOnlineLeads,
  transferOnlineLead,
  updateOnlineLead,
} from "@/modules/online-lead/services/online-lead.api";
import {
  BRAND_INTEREST_OPTIONS,
  EmployeeOption,
  INDIAN_STATES,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  OnlineLead,
  OnlineLeadFormData,
  TYPE_OF_QUERY_OPTIONS,
} from "@/modules/online-lead/types";
import { FieldSelect } from "@/components/custom/field-select";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { LegendList } from "@legendapp/list/react-native";
import { SkeletonList } from "@/components/custom/skeleton";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnlineLeadScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal state
  const [editingLead, setEditingLead] = useState<OnlineLead | null>(null);
  const [editForm, setEditForm] = useState<OnlineLeadFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Transfer modal state
  const [transferringLead, setTransferringLead] = useState<OnlineLead | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["online-leads"],
    queryFn: fetchOnlineLeads,
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-by-authority", user?.groupid],
    queryFn: () => fetchAssignedToOptions(user!.groupid),
    enabled: !!user?.groupid,
  });

  const employeeNames = useMemo(() => (employees || []).map((e: EmployeeOption) => e.name), [employees]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const form = item.formJson?.[0];
      return (
        form?.customer_name?.toLowerCase().includes(query) ||
        form?.phone_1?.toLowerCase().includes(query) ||
        form?.city?.toLowerCase().includes(query) ||
        form?.car_model?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  // --- Edit modal handlers ---
  const openEditModal = (lead: OnlineLead) => {
    const form = lead.formJson?.[0];
    setEditingLead(lead);
    setEditForm(form ? { ...form } : null);
    setSaveError(null);
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setEditForm(null);
    setSaveError(null);
  };

  const updateField = (key: keyof OnlineLeadFormData, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleUpdate = async () => {
    if (!editingLead || !editForm) return;
    setSaving(true);
    setSaveError(null);
    try {
      const originalForm = editingLead.formJson?.[0];
      if (!originalForm) throw new Error("Original lead data missing — cannot update.");

      await updateOnlineLead(editingLead.id, editingLead.companyid, originalForm, editForm);
      closeEditModal();
      refetch();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  // --- Transfer modal handlers ---
  const openTransferModal = (lead: OnlineLead) => {
    setTransferringLead(lead);
    setSelectedEmployee("");
    setTransferError(null);
  };

  const closeTransferModal = () => {
    setTransferringLead(null);
    setSelectedEmployee("");
    setTransferError(null);
  };

  const handleTransfer = async () => {
    if (!transferringLead || !selectedEmployee) return;
    const match = employees?.find((e: EmployeeOption) => e.name === selectedEmployee);
    if (!match) return;

    setTransferring(true);
    setTransferError(null);
    try {
      await transferOnlineLead(transferringLead.id, match.id);
      closeTransferModal();
      refetch();
    } catch (err: any) {
      setTransferError(err?.message || "Failed to transfer.");
    } finally {
      setTransferring(false);
    }
  };

  const renderRow = ({ item }: { item: OnlineLead }) => {
    const form = item.formJson?.[0];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.customerName} numberOfLines={1}>
            {form?.customer_name || "-"}
          </Text>
          <View style={styles.cardTopRight}>
            {!!form?.lead_status && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText} numberOfLines={1}>{form.lead_status}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => openEditModal(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.transferIconBtn}
              onPress={() => openTransferModal(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="arrow-right-circle" size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Feather name="phone" size={11} color={colors.muted} />
          <Text style={styles.metaText}>{form?.phone_1 || "-"}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Feather name="map-pin" size={11} color={colors.muted} />
          <Text style={[styles.metaText, { flex: 1 }]} numberOfLines={1}>
            {form?.city}{form?.state ? `, ${form.state}` : ""}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Car Model</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{form?.car_model || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Query Type</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{form?.type_of_query || "-"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Brand</Text>
            <Text style={styles.infoValue}>{form?.brand_interest || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Source</Text>
            <Text style={styles.infoValue}>{form?.source || "-"}</Text>
          </View>
        </View>

        {!!form?.remark && (
          <View style={styles.remarkRow}>
            <Feather name="message-circle" size={12} color={colors.textSecondary} />
            <Text style={styles.remarkText} numberOfLines={2}>{form.remark}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Online Lead</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/online-lead-create")}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, city, model..."
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
      ) : isError ? (
        <View style={styles.emptyBox}>
          <Feather name="alert-triangle" size={28} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load online leads</Text>
          <Text style={styles.errorSubtitle}>{(error as any)?.message || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="inbox" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No online leads found</Text>
        </View>
      ) : (
        <LegendList
          data={filteredData}
          keyExtractor={(item: OnlineLead) => String(item.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={180}
          recycleItems
        />
      )}

      {/* EDIT MODAL — "Online Lead Form" */}
      <Modal visible={!!editingLead && !!editForm} transparent animationType="fade" onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Online Lead Form</Text>
                <Text style={styles.modalSubtitle}>Update the details of the online lead.</Text>
              </View>
              <TouchableOpacity onPress={closeEditModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {editForm && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <View style={styles.modalStepBadge}>
                      <Text style={styles.modalStepBadgeText}>1</Text>
                    </View>
                    <View>
                      <Text style={styles.modalSectionTitle}>Customer Details</Text>
                      <Text style={styles.modalSectionSubtitle}>Customer information</Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Customer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter customer name"
                    placeholderTextColor={colors.muted}
                    value={editForm.customer_name}
                    onChangeText={(v) => updateField("customer_name", v)}
                  />

                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91XXXXXXXXXX"
                    placeholderTextColor={colors.muted}
                    value={editForm.phone_1}
                    onChangeText={(v) => updateField("phone_1", v)}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter city"
                    placeholderTextColor={colors.muted}
                    value={editForm.city}
                    onChangeText={(v) => updateField("city", v)}
                  />

                  <Text style={styles.fieldLabel}>State</Text>
                  <FieldSelect
                    label="State"
                    value={editForm.state}
                    options={INDIAN_STATES}
                    onChange={(v) => updateField("state", v)}
                    searchable
                    placeholder="Select state"
                  />
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <View style={styles.modalStepBadge}>
                      <Text style={styles.modalStepBadgeText}>2</Text>
                    </View>
                    <View>
                      <Text style={styles.modalSectionTitle}>Vehicle & Lead Details</Text>
                      <Text style={styles.modalSectionSubtitle}>Lead information</Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Car Model</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter car model"
                    placeholderTextColor={colors.muted}
                    value={editForm.car_model}
                    onChangeText={(v) => updateField("car_model", v)}
                  />

                  <Text style={styles.fieldLabel}>Type Of Query</Text>
                  <FieldSelect
                    label="Type Of Query"
                    value={editForm.type_of_query}
                    options={TYPE_OF_QUERY_OPTIONS}
                    onChange={(v) => updateField("type_of_query", v)}
                    placeholder="Select type of query"
                  />

                  <Text style={styles.fieldLabel}>Brand Interest</Text>
                  <FieldSelect
                    label="Brand Interest"
                    value={editForm.brand_interest}
                    options={BRAND_INTEREST_OPTIONS}
                    onChange={(v) => updateField("brand_interest", v)}
                    placeholder="Select brand interest"
                  />

                  <Text style={styles.fieldLabel}>Product Interest</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Product Interest"
                    placeholderTextColor={colors.muted}
                    value={editForm.product_interest}
                    onChangeText={(v) => updateField("product_interest", v)}
                  />

                  <Text style={styles.fieldLabel}>Source</Text>
                  <FieldSelect
                    label="Source"
                    value={editForm.source}
                    options={LEAD_SOURCE_OPTIONS}
                    onChange={(v) => updateField("source", v)}
                    placeholder="Select source"
                  />

                  <Text style={styles.fieldLabel}>Lead Status</Text>
                  <FieldSelect
                    label="Lead Status"
                    value={editForm.lead_status}
                    options={LEAD_STATUS_OPTIONS}
                    onChange={(v) => updateField("lead_status", v)}
                    searchable
                    placeholder="Select Status"
                  />
                </View>

                {saveError && (
                  <View style={styles.saveErrorBox}>
                    <Feather name="alert-triangle" size={14} color={colors.error} />
                    <Text style={styles.saveErrorText}>{saveError}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEditModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateBtn, saving && styles.updateBtnDisabled]}
                onPress={handleUpdate}
                disabled={saving}
              >
                <Text style={styles.updateBtnText}>{saving ? "Updating..." : "Update Query"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* TRANSFER MODAL — "Transfer to Lead / Query" */}
      <Modal visible={!!transferringLead} transparent animationType="fade" onRequestClose={closeTransferModal}>
        <Pressable style={styles.modalOverlay} onPress={closeTransferModal}>
          <Pressable style={styles.transferCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transfer to Lead / Query</Text>
              <TouchableOpacity onPress={closeTransferModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.transferBody}>
              <View style={styles.customerCard}>
                <Text style={styles.customerCardLabel}>Customer</Text>
                <Text style={styles.customerCardName}>
                  {transferringLead?.formJson?.[0]?.customer_name || "-"}
                </Text>
                <Text style={styles.customerCardPhone}>
                  {transferringLead?.formJson?.[0]?.phone_1 || "-"}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Assign Employee</Text>
              <FieldSelect
                label="Assign Employee"
                value={selectedEmployee}
                options={employeeNames}
                onChange={setSelectedEmployee}
                searchable
                placeholder="Select Employee"
                loading={employeesLoading}
              />

              {transferError && (
                <View style={styles.saveErrorBox}>
                  <Feather name="alert-triangle" size={14} color={colors.error} />
                  <Text style={styles.saveErrorText}>{transferError}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeTransferModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  (!selectedEmployee || transferring) && styles.updateBtnDisabled,
                ]}
                onPress={handleTransfer}
                disabled={!selectedEmployee || transferring}
              >
                <Text style={styles.updateBtnText}>{transferring ? "Transferring..." : "Transfer"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  title: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  createBtnText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.white },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { padding: spacing.md },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: spacing.sm },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerName: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, flex: 1 },

  statusBadge: { maxWidth: 110, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: "#FEF2F2" },
  statusBadgeText: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.primary },

  editIconBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FCA5A5" },
  transferIconBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#86EFAC" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, flexShrink: 1 },
  metaDot: { fontSize: txtSize.xs, color: colors.muted },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm, gap: spacing.sm },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  infoValue: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },

  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  remarkText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, flex: 1, lineHeight: 16 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "88%", overflow: "hidden" },
  transferCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  modalSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
  modalBody: { padding: spacing.md },
  transferBody: { padding: spacing.md },

  customerCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  customerCardLabel: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted, marginBottom: 2 },
  customerCardName: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  customerCardPhone: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },

  modalSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  modalSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  modalStepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  modalStepBadgeText: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.white },
  modalSectionTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  modalSectionSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },

  fieldLabel: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  remarksInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, minHeight: 90 },

  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm },
  saveErrorText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.error, flex: 1 },

  modalFooter: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  updateBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  updateBtnDisabled: { opacity: 0.6 },
  updateBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
});