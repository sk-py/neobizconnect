import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
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

type FieldSelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  searchable?: boolean;
  placeholder?: string;
  loading?: boolean;
};

export function FieldSelect({
  label,
  value,
  options,
  onChange,
  searchable = false,
  placeholder = "Select...",
  loading = false,
}: FieldSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const openModal = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openModal} disabled={loading}>
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {loading ? "Loading..." : value || placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchBox}>
                <Feather name="search" size={13} color={colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${label}...`}
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
              </View>
            )}

            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
              {filteredOptions.map((opt) => {
                const active = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionRow}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
                    {active && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
              {filteredOptions.length === 0 && (
                <Text style={styles.emptyText}>No matches</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerText: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  triggerPlaceholder: { color: colors.muted },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "70%", overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  searchBox: { flexDirection: "row", alignItems: "center", gap: 6, margin: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, height: 34 },
  searchInput: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, padding: 0 },

  optionsList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  optionTextActive: { fontFamily: typography.semibold, color: colors.primary },
  emptyText: { textAlign: "center", paddingVertical: spacing.lg, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted },
});