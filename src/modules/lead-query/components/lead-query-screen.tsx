import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchLeadQueries, updateLeadQuery } from "@/modules/lead-query/services/lead-query.api";
import { LEAD_STATUS_OPTIONS, LeadQuery } from "@/modules/lead-query/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { LegendList } from "@legendapp/list/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SkeletonList } from "@/components/custom/skeleton";
import { useCallback, useMemo, useState } from "react";
import {
  BackHandler,
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

const getBrandAccent = () => {
  return { badgeBg: "#FEF2F2", badgeText: colors.primary };
};

const BRAND_FILTERS = ["All", "Neo", "Zetta"] as const;
type BrandFilter = (typeof BRAND_FILTERS)[number];

export default function LeadQueryScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push("/sales-manager-modules");
        return true; // tells Android "we handled this, don't do default behavior"
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [router]),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("All");
  const [editingLead, setEditingLead] = useState<LeadQuery | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [remarksText, setRemarksText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["lead-queries"],
    queryFn: fetchLeadQueries,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    let result = data;

    if (brandFilter !== "All") {
      result = result.filter((item) => {
        const brand = item.formJson?.[0]?.brand_interest || "";
        return brand.toLowerCase() === brandFilter.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const form = item.formJson?.[0];
        return (
          form?.customer_name?.toLowerCase().includes(query) ||
          form?.phone_1?.toLowerCase().includes(query) ||
          form?.city?.toLowerCase().includes(query) ||
          form?.car_model?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [data, searchQuery, brandFilter]);

  const openEditModal = (lead: LeadQuery) => {
    const form = lead.formJson?.[0];
    setEditingLead(lead);
    setSelectedStatus(form?.status || "");
    setRemarksText(form?.sales_manager_remarks || "");
    setSaveError(null);
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setSelectedStatus("");
    setRemarksText("");
    setSaveError(null);
  };

  const handleUpdate = async () => {
    if (!editingLead) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateLeadQuery(editingLead.id, selectedStatus, remarksText);
      closeEditModal();
      refetch();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderRow = ({ item }: { item: LeadQuery }) => {
    const form = item.formJson?.[0];
    const latestRemark = item.remarks_list?.[item.remarks_list.length - 1];
    const accent = getBrandAccent();

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
            <View style={[styles.brandBadge, { backgroundColor: accent.badgeBg }]}>
              <Text style={[styles.brandBadgeText, { color: accent.badgeText }]}>
                {form?.brand_interest || "-"}
              </Text>
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
          <TouchableOpacity
            onPress={() => router.push("/sales-manager-modules")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Lead / Query</Text>
        </View>

        <View style={styles.brandFilterRow}>
          {BRAND_FILTERS.map((brand) => {
            const active = brandFilter === brand;
            return (
              <TouchableOpacity
                key={brand}
                style={[styles.brandFilterPill, active && styles.brandFilterPillActive]}
                onPress={() => setBrandFilter(brand)}
              >
                <Text style={[styles.brandFilterText, active && styles.brandFilterTextActive]}>
                  {brand}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          estimatedItemSize={200}
          recycleItems
        />
      )}

      {/* Edit Lead/Query Modal */}
      <Modal visible={!!editingLead} transparent animationType="fade" onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Lead / Query</Text>
                <Text style={styles.modalSubtitle}>Update lead status and remarks.</Text>
              </View>
              <TouchableOpacity onPress={closeEditModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <View style={styles.modalStepBadge}>
                    <Text style={styles.modalStepBadgeText}>1</Text>
                  </View>
                  <View>
                    <Text style={styles.modalSectionTitle}>Lead Status</Text>
                    <Text style={styles.modalSectionSubtitle}>Update current lead status</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusOptionsRow}>
                  {LEAD_STATUS_OPTIONS.map((status) => {
                    const active = selectedStatus === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusPill, active && styles.statusPillActive]}
                        onPress={() => setSelectedStatus(status)}
                      >
                        <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <View style={styles.modalStepBadge}>
                    <Text style={styles.modalStepBadgeText}>2</Text>
                  </View>
                  <View>
                    <Text style={styles.modalSectionTitle}>Sales Manager Remarks</Text>
                    <Text style={styles.modalSectionSubtitle}>Internal notes regarding this lead.</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Sales Manager Remarks</Text>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Enter remarks regarding the lead..."
                  placeholderTextColor={colors.muted}
                  value={remarksText}
                  onChangeText={setRemarksText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {saveError && (
                <View style={styles.saveErrorBox}>
                  <Feather name="alert-triangle" size={14} color={colors.error} />
                  <Text style={styles.saveErrorText}>{saveError}</Text>
                </View>
              )}
            </ScrollView>

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
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },

  brandFilterRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  brandFilterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  brandFilterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  brandFilterText: { fontSize: 12, fontFamily: typography.semibold, color: colors.textSecondary },
  brandFilterTextActive: { color: colors.white },

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

  brandBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  brandBadgeText: { fontSize: 12, fontFamily: typography.bold },

  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  remarkText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flex: 1, lineHeight: 16 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "85%", overflow: "hidden" },
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

  fieldLabel: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6 },
  statusOptionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  statusPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusPillText: { fontSize: 12, fontFamily: typography.semibold, color: colors.textSecondary },
  statusPillTextActive: { color: colors.white },

  remarksInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: 13, fontFamily: typography.medium, color: colors.text, minHeight: 90 },

  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm },
  saveErrorText: { fontSize: 11, fontFamily: typography.medium, color: colors.error, flex: 1 },

  modalFooter: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  updateBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  updateBtnDisabled: { opacity: 0.6 },
  updateBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
});