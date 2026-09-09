import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { createLeadQuery } from "@/modules/dealer-lead-query/services/dealer-lead-query.api";
import {
  BRAND_INTEREST_OPTIONS,
  INDIAN_STATES,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LeadFormData,
  TYPE_OF_QUERY_OPTIONS,
} from "@/modules/dealer-lead-query/types";
import { FieldSelect } from "@/components/custom/field-select";
import { useAuthStore } from "@/store/auth.store";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Assigned To / Status are intentionally NOT part of this form — a lead
// has no owner or status until after it's created; those are set from the
// Edit modal on the list screen instead.
const EMPTY_FORM: LeadFormData = {
  city: "",
  state: "",
  alloys: "",
  source: "",
  status: "",
  phone_1: "",
  remarks: "",
  remarks2: "",
  car_model: "",
  account_owner: "",
  customer_name: "",
  lead_priority: "",
  type_of_query: "",
  brand_interest: "",
  account_owner_id: "",
  sales_manager_remarks: "",
};

export default function DealerLeadQueryCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<LeadFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !form.phone_1.trim()) {
      setError("Customer Name and Mobile Number are required.");
      return;
    }

    if (!user?.companyid) {
      setError("Missing company ID for the logged-in user — cannot submit.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createLeadQuery(form, user.companyid);
      router.back();
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to create — this endpoint hasn't been fully confirmed yet, check with TL.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Lead / Query</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <View style={styles.introBlock}>
            <Text style={styles.introTitle}>Lead / Query Assignment Form</Text>
            <Text style={styles.introSubtitle}>
              Capture customer enquiries, assign leads and track follow-ups.
            </Text>
          </View>

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

            <Text style={styles.fieldLabel}>Customer Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter customer name"
              placeholderTextColor={colors.muted}
              value={form.customer_name}
              onChangeText={(v) => updateField("customer_name", v)}
            />

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91XXXXXXXXXX"
              placeholderTextColor={colors.muted}
              value={form.phone_1}
              onChangeText={(v) => updateField("phone_1", v)}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter city"
              placeholderTextColor={colors.muted}
              value={form.city}
              onChangeText={(v) => updateField("city", v)}
            />

            <Text style={styles.fieldLabel}>State</Text>
            <FieldSelect
              label="State"
              value={form.state}
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
              value={form.source}
              options={LEAD_SOURCE_OPTIONS}
              onChange={(v) => updateField("source", v)}
              placeholder="Select source"
            />

            <Text style={styles.fieldLabel}>Brand Interest</Text>
            <FieldSelect
              label="Brand Interest"
              value={form.brand_interest}
              options={BRAND_INTEREST_OPTIONS}
              onChange={(v) => updateField("brand_interest", v)}
              placeholder="Select brand interest"
            />

            <Text style={styles.fieldLabel}>Car Model</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter car model"
              placeholderTextColor={colors.muted}
              value={form.car_model}
              onChangeText={(v) => updateField("car_model", v)}
            />

            <Text style={styles.fieldLabel}>Alloys</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter alloy details"
              placeholderTextColor={colors.muted}
              value={form.alloys}
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
                <Text style={styles.modalSectionSubtitle}>Query information</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Type of Query</Text>
            <FieldSelect
              label="Type of Query"
              value={form.type_of_query}
              options={TYPE_OF_QUERY_OPTIONS}
              onChange={(v) => updateField("type_of_query", v)}
              placeholder="Select type of query"
            />

            <Text style={styles.fieldLabel}>Lead Priority</Text>
            <FieldSelect
              label="Lead Priority"
              value={form.lead_priority}
              options={LEAD_PRIORITY_OPTIONS}
              onChange={(v) => updateField("lead_priority", v)}
              placeholder="Select priority"
            />

            <Text style={styles.fieldLabel}>Customer Remarks</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter remarks regarding the lead..."
              placeholderTextColor={colors.muted}
              value={form.remarks}
              onChangeText={(v) => updateField("remarks", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Remark 2</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter additional remarks..."
              placeholderTextColor={colors.muted}
              value={form.remarks2}
              onChangeText={(v) => updateField("remarks2", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={14} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitBtnText}>{saving ? "Saving..." : "Create Lead"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },

  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  modalBody: { padding: spacing.md },

  introBlock: { marginBottom: spacing.md },
  introTitle: { fontSize: 17, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  introSubtitle: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },

  modalSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  modalSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  modalStepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  modalStepBadgeText: { fontSize: 11, fontFamily: typography.bold, color: colors.white },
  modalSectionTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  modalSectionSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary },

  fieldLabel: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },

  remarksInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: 13, fontFamily: typography.medium, color: colors.text, minHeight: 90 },

  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  errorText: { fontSize: 11, fontFamily: typography.medium, color: colors.error, flex: 1 },

  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 13, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
});