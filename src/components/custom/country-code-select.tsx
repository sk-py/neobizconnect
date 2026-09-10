import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { CountryCode } from "@/constants/country-codes";
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

type CountryCodeSelectProps = {
  countries: CountryCode[];
  value: string; // dial code, e.g. "+91"
  onChange: (dial: string) => void;
};

export function CountryCodeSelect({ countries, value, onChange }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = countries.find((c) => c.dial === value) || countries[0];

  const filtered = useMemo(() => {
    if (!query.trim()) return countries;
    const q = query.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q),
    );
  }, [countries, query]);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.dialText}>{selected.dial}</Text>
        <Feather name="chevron-down" size={14} color={colors.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Feather name="search" size={13} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
              {filtered.map((c) => {
                const active = c.dial === value && c.name === selected.name;
                return (
                  <TouchableOpacity
                    key={`${c.name}-${c.dial}`}
                    style={styles.optionRow}
                    onPress={() => {
                      onChange(c.dial);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionFlag}>{c.flag}</Text>
                    <Text style={styles.optionName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.optionDial}>{c.dial}</Text>
                    {active && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
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
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  flag: { fontSize: 16 },
  dialText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.md },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: "70%", overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },

  searchBox: { flexDirection: "row", alignItems: "center", gap: 6, margin: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, height: 34 },
  searchInput: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, padding: 0 },

  optionsList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionFlag: { fontSize: 18 },
  optionName: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },
  optionDial: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary },
  emptyText: { textAlign: "center", paddingVertical: spacing.lg, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted },
});