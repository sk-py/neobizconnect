import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import {
  fetchAssignedToOptions,
  fetchLeadQueries,
  updateLeadQuery,
} from "@/modules/dealer-lead-query/services/dealer-lead-query.api";
import {
  BRAND_INTEREST_OPTIONS,
  EmployeeOption,
  INDIAN_STATES,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LeadFormData,
  LeadQuery,
  TYPE_OF_QUERY_OPTIONS,
} from "@/modules/dealer-lead-query/types";
import { FieldSelect } from "@/components/custom/field-select";
import { CountryCodeSelect } from "@/components/custom/country-code-select";
import { COUNTRY_CODES, splitPhoneNumber } from "@/constants/country-codes";
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

export default function DealerLeadQueryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingLead, setEditingLead] = useState<LeadQuery | null>(null);
  const [editForm, setEditForm] = useState<LeadFormData | null>(null);
  const [editCountryCode, setEditCountryCode] = useState("+91");
  const [editLocalPhone, setEditLocalPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dealer-lead-queries"],
    queryFn: fetchLeadQueries,
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

  const openEditModal = (lead: LeadQuery) => {
    const form = lead.formJson?.[0];
    setEditingLead(lead);
    setEditForm(form ? { ...form } : null);
    const { dial, local } = splitPhoneNumber(form?.phone_1 || "");
    setEditCountryCode(dial);
    setEditLocalPhone(local);
    setSaveError(null);
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setEditForm(null);
    setSaveError(null);
  };

  const updateField = (key: keyof LeadFormData, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleAssignedToChange = (name: string) => {
    const match = employees?.find((e: EmployeeOption) => e.name === name);
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            account_owner: name,
            account_owner_id: match ? String(match.id) : prev.account_owner_id,
          }
        : prev,
    );
  };

  const handleUpdate = async () => {
    if (!editingLead || !editForm) return;
    setSaving(true);
    setSaveError(null);
    try {
      const originalForm = editingLead.formJson?.[0];
      if (!originalForm) throw new Error("Original lead data missing — cannot update.");

      const finalForm: LeadFormData = {
        ...editForm,
        phone_1: `${editCountryCode}${editLocalPhone.trim()}`,
      };

      await updateLeadQuery(editingLead.id, editingLead.companyid, originalForm, finalForm);
      closeEditModal();
      refetch();
    } catch (err: any) {
      setSaveError(
        err?.message ||
          "Failed to update — this endpoint hasn't been fully confirmed yet, check with TL.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderRow = ({ item }: { item: LeadQuery }) => {
    const form = item.formJson?.[0];
    const latestRemark = item.remarks_list?.[item.remarks_list.length - 1];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.customerName} numberOfLines={1}>
            {form?.customer_name || "-"}
          </Text>
          <View style={styles.cardTopRight}>
            <Text style={styles.ageText}>{item.age}</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEditModal(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Feather name="phone" size={11} color={colors.muted} />
          <Text style={styles.metaText}>{form?.phone_1 || "-"}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Feather name="map-pin" size={11} color={colors.muted} />
          <Text style={[styles.metaText, { flex: 1 }]} numberOfLines={1}>
            {form?.city}
            {form?.state ? `, ${form.state}` : ""}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Car Model</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{form?.car_model || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Brand Interest</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>{form?.brand_interest || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Type of Query</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{form?.type_of_query || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Source</Text>
            <Text style={styles.infoValue}>{form?.source || "-"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Priority</Text>
            <Text style={styles.infoValue}>{form?.lead_priority || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Assigned To</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{form?.account_owner || "-"}</Text>
          </View>
        </View>

        {!!form?.status && (
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{form.status}</Text>
            </View>
          </View>
        )}

        {latestRemark && (
          <View style={styles.remarkRow}>
            <Feather name="message-circle" size={12} color={colors.textSecondary} />
            <Text style={styles.remarkText} numberOfLines={2}>
              {latestRemark.remark}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Lead / Query</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/dealer-lead-query-create")}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, city, or car model..."
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
          <Feather name="alert-triangle" size={32} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load queries</Text>
          <Text style={styles.errorSubtitle}>{(error as any)?.message || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="help-circle" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No queries found</Text>
        </View>
      ) : (
        <LegendList
          data={filteredData}
          keyExtractor={(item: LeadQuery) => String(item.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={220}
          recycleItems
        />
      )}

      <Modal visible={!!editingLead && !!editForm} transparent animationType="fade" onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Lead / Query Assignment</Text>
                <Text style={styles.modalSubtitle}>Update customer enquiry details.</Text>
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
                      <Text style={styles.modalSectionSubtitle}>Customer basic information</Text>
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
                  <View style={styles.phoneRow}>
                    <CountryCodeSelect
                      countries={COUNTRY_CODES}
                      value={editCountryCode}
                      onChange={setEditCountryCode}
                    />
                    <TextInput
                      style={[styles.textInput, styles.phoneInput]}
                      placeholder="XXXXXXXXXX"
                      placeholderTextColor={colors.muted}
                      value={editLocalPhone}
                      onChangeText={setEditLocalPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

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
                      <Text style={styles.modalSectionTitle}>Lead Source & Vehicle</Text>
                      <Text style={styles.modalSectionSubtitle}>Source and product details</Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Source</Text>
                  <FieldSelect
                    label="Source"
                    value={editForm.source}
                    options={LEAD_SOURCE_OPTIONS}
                    onChange={(v) => updateField("source", v)}
                    placeholder="Select source"
                  />

                  <Text style={styles.fieldLabel}>Brand Interest</Text>
                  <FieldSelect
                    label="Brand Interest"
                    value={editForm.brand_interest}
                    options={BRAND_INTEREST_OPTIONS}
                    onChange={(v) => updateField("brand_interest", v)}
                    placeholder="Select brand interest"
                  />

                  <Text style={styles.fieldLabel}>Car Model</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter car model"
                    placeholderTextColor={colors.muted}
                    value={editForm.car_model}
                    onChangeText={(v) => updateField("car_model", v)}
                  />

                  <Text style={styles.fieldLabel}>Alloys</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter alloy details"
                    placeholderTextColor={colors.muted}
                    value={editForm.alloys}
                    onChangeText={(v) => updateField("alloys", v)}
                  />
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <View style={styles.modalStepBadge}>
                      <Text style={styles.modalStepBadgeText}>3</Text>
                    </View>
                    <View>
                      <Text style={styles.modalSectionTitle}>Query Details</Text>
                      <Text style={styles.modalSectionSubtitle}>Query information and assignment</Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Type of Query</Text>
                  <FieldSelect
                    label="Type of Query"
                    value={editForm.type_of_query}
                    options={TYPE_OF_QUERY_OPTIONS}
                    onChange={(v) => updateField("type_of_query", v)}
                    placeholder="Select type of query"
                  />

                  <Text style={styles.fieldLabel}>Lead Priority</Text>
                  <FieldSelect
                    label="Lead Priority"
                    value={editForm.lead_priority}
                    options={LEAD_PRIORITY_OPTIONS}
                    onChange={(v) => updateField("lead_priority", v)}
                    placeholder="Select priority"
                  />

                  <Text style={styles.fieldLabel}>Assigned To</Text>
                  <FieldSelect
                    label="Assigned To"
                    value={editForm.account_owner}
                    options={employeeNames}
                    onChange={handleAssignedToChange}
                    searchable
                    placeholder="Select employee"
                    loading={employeesLoading}
                  />

                  <Text style={styles.fieldLabel}>Status</Text>
                  <FieldSelect
                    label="Status"
                    value={editForm.status}
                    options={LEAD_STATUS_OPTIONS}
                    onChange={(v) => updateField("status", v)}
                    searchable
                    placeholder="Select status"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text },

  createBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  createBtnText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.white },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { padding: spacing.md },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },

  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  customerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  ageText: { fontSize: 10, fontFamily: typography.medium, color: colors.muted },
  editBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flexShrink: 1 },
  metaDot: { fontSize: 11, color: colors.muted },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },

  brandBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: "#FEF2F2" },
  brandBadgeText: { fontSize: 12, fontFamily: typography.bold, color: colors.primary },

  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  remarkText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flex: 1, lineHeight: 16 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "88%", overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  modalSubtitle: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
  modalBody: { padding: spacing.md },

  modalSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  modalSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  modalStepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  modalStepBadgeText: { fontSize: 11, fontFamily: typography.bold, color: colors.white },
  modalSectionTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  modalSectionSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary },

  fieldLabel: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  phoneRow: { flexDirection: "row", gap: spacing.sm },
  phoneInput: { flex: 1 },

  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm },
  saveErrorText: { fontSize: 11, fontFamily: typography.medium, color: colors.error, flex: 1 },

  modalFooter: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  updateBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  updateBtnDisabled: { opacity: 0.6 },
  updateBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
});