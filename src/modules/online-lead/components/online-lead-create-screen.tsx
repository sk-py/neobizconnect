import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { createOnlineLead } from "@/modules/online-lead/services/online-lead.api";
import {
  BRAND_INTEREST_OPTIONS,
  COUNTRY_CODES,
  EMPTY_ONLINE_LEAD_FORM,
  INDIAN_STATES,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  OnlineLeadFormData,
  TYPE_OF_QUERY_OPTIONS,
} from "@/modules/online-lead/types";
import { FieldSelect } from "@/components/custom/field-select";
import { CountryCodeSelect } from "@/components/custom/country-code-select";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQueryClient } from "@tanstack/react-query";
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

export default function OnlineLeadCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<OnlineLeadFormData>(EMPTY_ONLINE_LEAD_FORM);
  const [countryCode, setCountryCode] = useState("+91");
  const [localPhone, setLocalPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof OnlineLeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !localPhone.trim()) {
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
      const payload: OnlineLeadFormData = { ...form, phone_1: `${countryCode}${localPhone.trim()}` };
      await createOnlineLead(payload, user.companyid);
      await queryClient.invalidateQueries({ queryKey: ["online-leads"] });
      router.back();
    } catch (err: any) {
      setError(err?.message || "Failed to create online lead. Please try again.");
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
        <Text style={styles.title}>Create Online Lead</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: 90 }}
          keyboardShouldPersistTaps="handled"
        >
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

            <Text style={styles.fieldLabel}>Customer Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter customer name"
              placeholderTextColor={colors.muted}
              value={form.customer_name}
              onChangeText={(v) => updateField("customer_name", v)}
            />

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <View style={styles.phoneRow}>
              <CountryCodeSelect
                countries={COUNTRY_CODES}
                value={countryCode}
                onChange={setCountryCode}
              />
              <TextInput
                style={[styles.textInput, styles.phoneInput]}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={colors.muted}
                value={localPhone}
                onChangeText={setLocalPhone}
                keyboardType="phone-pad"
              />
            </View>

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
                <Text style={styles.modalSectionTitle}>Vehicle & Lead Details</Text>
                <Text style={styles.modalSectionSubtitle}>Lead information</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Car Model</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter car model"
              placeholderTextColor={colors.muted}
              value={form.car_model}
              onChangeText={(v) => updateField("car_model", v)}
            />

            <Text style={styles.fieldLabel}>Type Of Query</Text>
            <FieldSelect
              label="Type Of Query"
              value={form.type_of_query}
              options={TYPE_OF_QUERY_OPTIONS}
              onChange={(v) => updateField("type_of_query", v)}
              placeholder="Select type of query"
            />

            <Text style={styles.fieldLabel}>Brand Interest</Text>
            <FieldSelect
              label="Brand Interest"
              value={form.brand_interest}
              options={BRAND_INTEREST_OPTIONS}
              onChange={(v) => updateField("brand_interest", v)}
              placeholder="Select brand interest"
            />

            <Text style={styles.fieldLabel}>Product Interest</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Product Interest"
              placeholderTextColor={colors.muted}
              value={form.product_interest}
              onChangeText={(v) => updateField("product_interest", v)}
            />

            <Text style={styles.fieldLabel}>Source</Text>
            <FieldSelect
              label="Source"
              value={form.source}
              options={LEAD_SOURCE_OPTIONS}
              onChange={(v) => updateField("source", v)}
              placeholder="Select source"
            />

            <Text style={styles.fieldLabel}>Lead Status</Text>
            <FieldSelect
              label="Lead Status"
              value={form.lead_status}
              options={LEAD_STATUS_OPTIONS}
              onChange={(v) => updateField("lead_status", v)}
              searchable
              placeholder="Select Status"
            />

            <Text style={styles.fieldLabel}>Remark</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter remark..."
              placeholderTextColor={colors.muted}
              value={form.remark}
              onChangeText={(v) => updateField("remark", v)}
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }]}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitBtnText}>{saving ? "Saving..." : "Submit Query"}</Text>
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

  modalSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  modalSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  modalStepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  modalStepBadgeText: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.white },
  modalSectionTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  modalSectionSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },

  fieldLabel: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  phoneRow: { flexDirection: "row", gap: spacing.sm },
  phoneInput: { flex: 1 },
  remarksInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, minHeight: 90 },

  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  errorText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.error, flex: 1 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 13, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
});