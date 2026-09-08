import { colors, radius, spacing, typography } from "@/constants/theme";
import { MOCK_CATEGORIES } from "@/modules/expense/types";
import { createExpenses, CreateExpensePayload } from "@/modules/expense/services/expense.api";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RowState = {
  localId: string;
  title: string;
  date: Date;
  category: string;
  subCategory: string;
  description: string;
  amount: string;
  attachmentUri?: string;
  attachmentName?: string;
};

const makeEmptyRow = (): RowState => ({
  localId: Math.random().toString(36).slice(2),
  title: "",
  date: new Date(),
  category: "",
  subCategory: "",
  description: "",
  amount: "",
});

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ExpenseCreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<RowState[]>([makeEmptyRow()]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const [categoryModalFor, setCategoryModalFor] = useState<string | null>(null);
  const [subCategoryModalFor, setSubCategoryModalFor] = useState<string | null>(null);

  const updateRow = (localId: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  };

  const removeRow = (localId: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.localId !== localId)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const pickAttachment = async (localId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      updateRow(localId, {
        attachmentUri: asset.uri,
        attachmentName: asset.fileName || "attachment.jpg",
      });
    }
  };

  const totalAmount = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: CreateExpensePayload[] = rows.map((r) => ({
        title: r.title || "",
        date: r.date.toISOString().slice(0, 10),
        category: r.category || "",
        subCategory: r.subCategory || "",
        description: r.description || "",
        attachment: "",
        amount: r.amount || "0",
        isUploading: false,
        isDeleting: false,
        status: "Pending",
        remarks: "",
        employee_id: String((user as any)?.employeeid ?? (user as any)?.id ?? "7"),
        employee_name: (user?.name ?? "").trim(),
      }));

            await createExpenses(payload);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      router.back();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save expenses. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryModalRow = rows.find((r) => r.localId === categoryModalFor);
  const activeSubCategoryModalRow = rows.find((r) => r.localId === subCategoryModalFor);
  const subCategoryOptions = activeSubCategoryModalRow
    ? MOCK_CATEGORIES.find((c) => c.name === activeSubCategoryModalRow.category)?.subCategories ?? []
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Expense Entry</Text>
          <Text style={styles.headerSubtitle}>Add multiple expenses and submit them together.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {rows.map((row, idx) => (
          <View key={row.localId} style={styles.rowCard}>
            <View style={styles.rowCardTop}>
              <Text style={styles.rowNumber}>#{idx + 1}</Text>
              {rows.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(row.localId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="trash-2" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor={colors.muted}
              value={row.title}
              onChangeText={(text) => updateRow(row.localId, { title: text })}
            />

            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.input} onPress={() => setDatePickerFor(row.localId)}>
              <View style={styles.inputRowContent}>
                <Feather name="calendar" size={14} color={colors.muted} />
                <Text style={styles.inputText}>{formatDate(row.date)}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.fieldPairRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity style={styles.input} onPress={() => setCategoryModalFor(row.localId)}>
                  <View style={styles.inputRowContent}>
                    <Text style={styles.inputText} numberOfLines={1}>
                      {row.category || "Select"}
                    </Text>
                    <Feather name="chevron-down" size={14} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Sub Category</Text>
                <TouchableOpacity
                  style={[styles.input, !row.category && styles.inputDisabled]}
                  onPress={() => row.category && setSubCategoryModalFor(row.localId)}
                >
                  <View style={styles.inputRowContent}>
                    <Text style={styles.inputText} numberOfLines={1}>
                      {row.subCategory || "Select"}
                    </Text>
                    <Feather name="chevron-down" size={14} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description"
              placeholderTextColor={colors.muted}
              value={row.description}
              onChangeText={(text) => updateRow(row.localId, { description: text })}
              multiline
            />

            <View style={styles.fieldPairRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={row.amount}
                  onChangeText={(text) => updateRow(row.localId, { amount: text.replace(/[^0-9.]/g, "") })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Attachment</Text>
                <TouchableOpacity style={styles.input} onPress={() => pickAttachment(row.localId)}>
                  <View style={styles.inputRowContent}>
                    <Feather name="paperclip" size={14} color={colors.muted} />
                    <Text style={styles.inputText} numberOfLines={1}>
                      {row.attachmentName || "Upload"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
          <Feather name="plus" size={14} color={colors.primary} />
          <Text style={styles.addRowText}>Add Row</Text>
        </TouchableOpacity>

        {saveError && (
          <View style={styles.saveErrorBox}>
            <Feather name="alert-triangle" size={14} color={colors.error} />
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Expense Amount</Text>
          <Text style={styles.totalValue}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.footerBtnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Expenses"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {datePickerFor && (
        <DateTimePicker
          value={rows.find((r) => r.localId === datePickerFor)?.date || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            if (Platform.OS === "android") setDatePickerFor(null);
            if (selectedDate && datePickerFor) {
              updateRow(datePickerFor, { date: selectedDate });
            }
          }}
        />
      )}

      {/* Category Modal */}
      <Modal visible={!!categoryModalFor} transparent animationType="fade" onRequestClose={() => setCategoryModalFor(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalFor(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {MOCK_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.modalOption}
                onPress={() => {
                  if (categoryModalFor) {
                    updateRow(categoryModalFor, { category: cat.name, subCategory: "" });
                  }
                  setCategoryModalFor(null);
                }}
              >
                <Text style={styles.modalOptionText}>{cat.name}</Text>
                {activeCategoryModalRow?.category === cat.name && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Sub Category Modal */}
      <Modal visible={!!subCategoryModalFor} transparent animationType="fade" onRequestClose={() => setSubCategoryModalFor(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSubCategoryModalFor(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Sub Category</Text>
            {subCategoryOptions.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={styles.modalOption}
                onPress={() => {
                  if (subCategoryModalFor) {
                    updateRow(subCategoryModalFor, { subCategory: sub });
                  }
                  setSubCategoryModalFor(null);
                }}
              >
                <Text style={styles.modalOptionText}>{sub}</Text>
                {activeSubCategoryModalRow?.subCategory === sub && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  headerSubtitle: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },

  scrollContent: { padding: spacing.md, paddingBottom: 140 },

  rowCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  rowCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  rowNumber: { fontSize: 12, fontFamily: typography.bold, color: colors.muted },

  fieldLabel: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: { backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 10, justifyContent: "center" },
  inputText: { fontSize: 13, fontFamily: typography.medium, color: colors.text, flex: 1 },
  inputRowContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  inputDisabled: { opacity: 0.5 },
  multilineInput: { minHeight: 60, textAlignVertical: "top" },

  fieldPairRow: { flexDirection: "row", gap: spacing.sm },
  fieldHalf: { flex: 1 },

  addRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, borderStyle: "dashed" },
  addRowText: { fontSize: 13, fontFamily: typography.bold, color: colors.primary },

  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.md },
  saveErrorText: { fontSize: 11, fontFamily: typography.medium, color: colors.error, flex: 1 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  totalLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary },
  totalValue: { fontSize: 18, fontFamily: typography.bold, color: colors.primary, marginBottom: spacing.sm },
  footerBtnRow: { flexDirection: "row", gap: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.xl },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, maxHeight: "70%" },
  modalTitle: { fontSize: 14, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.sm },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.sm },
  modalOptionText: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
});