import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchItemMasterList } from "@/modules/item-master/services/item-master.api";
import { ItemMasterBrand, ItemMasterEntry } from "@/modules/item-master/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRANDS: { label: string; value: ItemMasterBrand }[] = [
  { label: "Neo", value: "NEO" },
  { label: "Zetta", value: "ZETTA" },
];

const PAGE_SIZE = 20;

export default function ItemMasterScreen() {
  const [brand, setBrand] = useState<ItemMasterBrand>("NEO");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["item-master", brand],
    queryFn: () => fetchItemMasterList(brand),
  });

  const handleBrandChange = (nextBrand: ItemMasterBrand) => {
    setBrand(nextBrand);
    setPage(0);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(query) ||
        item.itemCode?.toLowerCase().includes(query) ||
        item.wheelSize?.toLowerCase().includes(query),
    );
  }, [data, searchQuery]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const paginatedData = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, safePage]);

  const rangeStart = totalItems === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalItems, (safePage + 1) * PAGE_SIZE);

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
              onPress={() => handleBrandChange(b.value)}
            >
              <Text style={[styles.brandPillText, active && styles.brandPillTextActive]}>
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={14} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search product or wheel size..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange("")} style={styles.clearSearchBtn}>
            <Feather name="x-circle" size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.text}>No items found</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedData}
            keyExtractor={(item: ItemMasterEntry) => item.itemCode}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.text}>{item.itemName}</Text>
              </View>
            )}
          />

          <View style={styles.paginationBar}>
            <Text style={styles.paginationText}>
              {rangeStart}-{rangeEnd} of {totalItems}
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
              >
                <Feather name="chevron-left" size={16} color={safePage === 0 ? colors.muted : colors.text} />
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                {safePage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, safePage >= totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
              >
                <Feather name="chevron-right" size={16} color={safePage >= totalPages - 1 ? colors.muted : colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </>
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
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, height: 36 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },
  row: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  paginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  paginationText: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageBtn: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: 12, fontFamily: typography.semibold, color: colors.text, minWidth: 36, textAlign: "center" },
});