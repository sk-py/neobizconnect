import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchItemMasterList } from "@/modules/item-master/services/item-master.api";
import { ItemMasterBrand, ItemMasterEntry } from "@/modules/item-master/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRANDS: { label: string; value: ItemMasterBrand }[] = [
  { label: "Neo", value: "NEO" },
  { label: "Zetta", value: "ZETTA" },
];

export default function ItemMasterScreen() {
  const [brand, setBrand] = useState<ItemMasterBrand>("NEO");

  const { data, isLoading } = useQuery({
    queryKey: ["item-master", brand],
    queryFn: () => fetchItemMasterList(brand),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Item Master</Text>

      <View style={styles.brandRow}>
        {BRANDS.map((b) => {
          const active = brand === b.value;
          return (
            <TouchableOpacity
              key={b.value}
              style={[styles.brandPill, active && styles.brandPillActive]}
              onPress={() => setBrand(b.value)}
            >
              <Text style={[styles.brandPillText, active && styles.brandPillTextActive]}>
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: ItemMasterEntry) => item.itemCode}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.text}>{item.itemName}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 16, fontFamily: typography.bold, color: colors.text, padding: spacing.md, paddingBottom: 8 },
  brandRow: { flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  brandPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  brandPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  brandPillText: { fontSize: 12, fontFamily: typography.semibold, color: colors.textSecondary },
  brandPillTextActive: { color: colors.white },
  row: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
});