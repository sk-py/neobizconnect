import { SkeletonList } from "@/components/custom/skeleton";
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { fetchItemMasterList } from "@/modules/item-master/services/item-master.api";
import { ItemMasterBrand, ItemMasterEntry } from "@/modules/item-master/types";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRANDS: { label: string; value: ItemMasterBrand }[] = [
  { label: "Neo", value: "NEO" },
  { label: "Zetta", value: "ZETTA" },
];

const PAGE_SIZE = 20;

const formatDueDate = (isoString: string | null) => {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ItemMasterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // Admin/Super Admin only — Item Code, Production Order, Production Due
  // Date, and Attachment are not visible to Sales Manager.
  const canSeeExtraDetails =
    user?.authority === "Admin" || user?.authority === "Super Admin";

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

    const renderRow = ({ item }: { item: ItemMasterEntry }) => {
    const outOfStock = item.inStockQty <= 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.itemName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.brand}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.wheelSize}&quot; wheel</Text>
            </View>
          </View>

          <View style={[styles.stockBadge, outOfStock ? styles.stockBadgeEmpty : styles.stockBadgeAvailable]}>
            <Text style={[styles.stockBadgeText, outOfStock ? styles.stockTextEmpty : styles.stockTextAvailable]}>
              {item.inStockQty}
            </Text>
            <Text style={[styles.stockBadgeLabel, outOfStock ? styles.stockTextEmpty : styles.stockTextAvailable]}>
              in stock
            </Text>
          </View>
        </View>

        {canSeeExtraDetails ? (
          <View style={styles.detailPanel}>
            <View style={styles.detailPanelRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Item Code</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.itemCode}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Production Order</Text>
                <Text style={styles.detailValue}>{item.totalProdOrderQty}</Text>
              </View>
            </View>

            <View style={styles.detailPanelDivider} />

            <View style={styles.detailPanelRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Production Due Date</Text>
                <Text style={styles.detailValue}>{formatDueDate(item.firstPoDueDate)}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Attachment</Text>
                {item.attachment ? (
                  <TouchableOpacity
                    style={styles.attachmentLink}
                    onPress={() => void Linking.openURL(item.attachment)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Feather name="paperclip" size={12} color={colors.primary} />
                    <Text style={styles.attachmentLinkText}>View file</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.detailValueMuted}>None</Text>
                )}
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow2}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>View your stock levels and inventory details</Text>
        </View>

        <View style={styles.controlsRow}>
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
            <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange("")} style={styles.clearSearchBtn}>
                <Feather name="x-circle" size={13} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={8} />
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="package" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      ) : (
        <>
          <LegendList
            data={paginatedData}
            keyExtractor={(item: ItemMasterEntry) => item.itemCode}
            renderItem={renderRow}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={92}
            recycleItems
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
                <Feather name="chevron-left" size={15} color={safePage === 0 ? colors.muted : colors.text} />
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                {safePage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, safePage >= totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
              >
                <Feather name="chevron-right" size={15} color={safePage >= totalPages - 1 ? colors.muted : colors.text} />
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

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
   headerTitle: { 
        fontSize: 20, 
        fontFamily: typography.bold, 
        color: colors.text 
    },
  headerSubtitle: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginTop: 2
  },
  titleRow2: { flexDirection: "column", alignItems: "flex-start", marginBottom: 8 },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandRow: { flexDirection: "row", gap: 6 },
  brandPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  brandPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  brandPillText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary },
  brandPillTextActive: { color: colors.white },

  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 32 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { paddingBottom: 0 },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  rowMain: { flex: 1 },
  itemName: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted },
  metaDot: { fontSize: txtSize.xs, color: colors.muted },

    // --- Admin card (bigger, boxed, labeled) ---
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  cardTopLeft: { flex: 1 },

  detailPanel: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm },
  detailPanelRow: { flexDirection: "row", gap: spacing.md },
  detailPanelDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  detailBlock: { flex: 1 },
  detailLabel: { fontSize: 11, fontFamily: typography.semibold, color: colors.muted, marginBottom: 3 },
  detailValue: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  detailValueMuted: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.muted },

  attachmentLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  attachmentLinkText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.primary },

  stockBadge: { minWidth: 56, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  stockBadgeAvailable: { backgroundColor: "#F0FDF4" },
  stockBadgeEmpty: { backgroundColor: "#FEF2F2" },
  stockBadgeText: { fontSize: txtSize.body, fontFamily: typography.bold },
  stockBadgeLabel: { fontSize: 10, fontFamily: typography.medium, marginTop: 1 },
  stockTextAvailable: { color: colors.success },
  stockTextEmpty: { color: colors.error },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },

  paginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  paginationText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageBtn: { width: 26, height: 26, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  pageBtnDisabled: { opacity: 0.5 },
  pageIndicator: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text, minWidth: 36, textAlign: "center" },
});