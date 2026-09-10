import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import {
  createLeadQuery,
  fetchAssignedToOptions,
} from "@/modules/lead-query/services/lead-query.api";
import {
  BRAND_INTEREST_OPTIONS,
  EmployeeOption,
  INDIAN_STATES,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LeadFormData,
  TYPE_OF_QUERY_OPTIONS,
} from "@/modules/lead-query/types";
import { FieldSelect } from "@/components/custom/field-select";
import { CountryCodeSelect } from "@/components/custom/country-code-select";
import { COUNTRY_CODES } from "@/constants/country-codes";
import { useAuthStore } from "@/store/auth.store";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

export default function LeadQueryCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<LeadFormData>(EMPTY_FORM);
  const [countryCode, setCountryCode] = useState("+91");
  const [localPhone, setLocalPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-create-sm", user?.groupid],
    queryFn: () => fetchAssignedToOptions(user!.groupid),
    enabled: !!user?.groupid,
  });

  const employeeNames = useMemo(
    () => (employees || []).map((e: EmployeeOption) => e.name),
    [employees]
  );

  const updateField = (key: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAssignedToChange = (name: string) => {
    const match = employees?.find((e: EmployeeOption) => e.name === name);
    setForm((prev) => ({
      ...prev,
      account_owner: name,
      account_owner_id: match ? String(match.id) : prev.account_owner_id,
    }));
  };

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !localPhone.trim()) {
      setError("Customer Name and Mobile Number are required.");
      return;
    }
    if (!user?.companyid) {
      setError("Missing company ID.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: LeadFormData = { ...form, phone_1: `${countryCode}${localPhone.trim()}` };
      await createLeadQuery(payload, user.companyid);
      router.back();
    } catch (err: any) {
      setError(err?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      
      {/* HEADER BAR — matches the plain left-aligned header pattern used
          across the rest of the app (back arrow + title, no centering) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Create Lead / Query
        </Text>
      </View>

      {/* INTRO HEADER BLOCK */}
      <View style={styles.introBox}>
        <Text style={styles.introTitle}>Lead / Query Assignment Form</Text>
        <Text style={styles.introSubtitle}>
          Capture customer enquiries, assign leads and track follow-ups.
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ 
            padding: spacing.md, 
            paddingBottom: 100 
          }}
        >
          
          {/* SECTION 1: CUSTOMER DETAILS */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumTxt}>1</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Customer Details</Text>
                <Text style={styles.sectionSub}>Basic information</Text>
              </View>
            </View>

            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              placeholderTextColor={colors.muted}
              value={form.customer_name}
              onChangeText={(v) => updateField("customer_name", v)}
            />

            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.phoneRow}>
              <CountryCodeSelect
                countries={COUNTRY_CODES}
                value={countryCode}
                onChange={setCountryCode}
              />
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={colors.muted}
                value={localPhone}
                onChangeText={setLocalPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor={colors.muted}
              value={form.city}
              onChangeText={(v) => updateField("city", v)}
            />

            <Text style={styles.label}>State</Text>
            <FieldSelect
              label="State"
              value={form.state}
              options={INDIAN_STATES}
              onChange={(v) => updateField("state", v)}
              searchable
              placeholder="Select state"
            />
          </View>

          {/* SECTION 2: SOURCE & VEHICLE */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumTxt}>2</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Lead Source & Vehicle</Text>
                <Text style={styles.sectionSub}>Source and product details</Text>
              </View>
            </View>

            <Text style={styles.label}>Source</Text>
            <FieldSelect
              label="Source"
              value={form.source}
              options={LEAD_SOURCE_OPTIONS}
              onChange={(v) => updateField("source", v)}
              placeholder="Select source"
            />

            <Text style={styles.label}>Brand Interest</Text>
            <FieldSelect
              label="Brand Interest"
              value={form.brand_interest}
              options={BRAND_INTEREST_OPTIONS}
              onChange={(v) => updateField("brand_interest", v)}
              placeholder="Select brand interest"
            />

            <Text style={styles.label}>Car Model</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter car model"
              placeholderTextColor={colors.muted}
              value={form.car_model}
              onChangeText={(v) => updateField("car_model", v)}
            />

            <Text style={styles.label}>Alloys</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter alloy details"
              placeholderTextColor={colors.muted}
              value={form.alloys}
              onChangeText={(v) => updateField("alloys", v)}
            />
          </View>

          {/* SECTION 3: QUERY DETAILS */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumTxt}>3</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Query Details</Text>
                <Text style={styles.sectionSub}>Classification & assignment</Text>
              </View>
            </View>

            {/* TYPE OF QUERY - DROPDOWN (not text input) */}
            <Text style={styles.label}>Type of Query</Text>
            <FieldSelect
              label="Type of Query"
              value={form.type_of_query}
              options={[...TYPE_OF_QUERY_OPTIONS]}
              onChange={(val) => updateField("type_of_query", val)}
              placeholder="Select type of query"
            />

            <Text style={styles.label}>Lead Priority</Text>
            <FieldSelect
              label="Priority"
              value={form.lead_priority}
              options={LEAD_PRIORITY_OPTIONS}
              onChange={(v) => updateField("lead_priority", v)}
              placeholder="Select priority"
            />

            <Text style={styles.label}>Assigned To</Text>
            <FieldSelect
              label="Assigned To"
              value={form.account_owner}
              options={employeeNames}
              onChange={handleAssignedToChange}
              searchable
              placeholder="Select employee"
              loading={employeesLoading}
            />

            {/* STATUS REMOVED FROM CREATE FORM */}

            <Text style={styles.label}>Customer Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter remarks regarding the lead..."
              placeholderTextColor={colors.muted}
              value={form.remarks}
              onChangeText={(v) => updateField("remarks", v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Remark 2</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter additional remarks..."
              placeholderTextColor={colors.muted}
              value={form.remarks2}
              onChangeText={(v) => updateField("remarks2", v)}
              multiline
              numberOfLines={3}
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

      {/* FOOTER BUTTON */}
      <View style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }
      ]}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {saving ? "Creating..." : "Create Lead"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  introBox: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  introTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 3,
  },
  introSubtitle: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumTxt: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: colors.text,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },

  label: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: typography.medium,
    color: colors.text,
  },
  phoneRow: { flexDirection: "row", gap: 8 },
  phoneInput: { flex: 1 },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.error,
    flex: 1,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: colors.white,
  },
});