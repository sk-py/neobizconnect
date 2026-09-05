import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Dealer } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DealersListScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (d) =>
        d.cardName?.toLowerCase().includes(query) ||
        d.cardCode?.toLowerCase().includes(query) ||
        d.phone1?.toLowerCase().includes(query) ||
        d.emailAddress?.toLowerCase().includes(query),
    );
  }, [data, searchQuery]);

  const renderRow = ({ item }: { item: Dealer }) => {
    const isActive = item.portalStatus === "Yes" && item.lock_status !== 0;

    return (
      <View style={styles.row}>
        <View style={styles.rowMain}>
          <View style={styles.nameRow}>
            <Text style={styles.dealerName} numberOfLines={1}>
              {item.cardName}
            </Text>
            <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
          </View>
          <Text style={styles.dealerCode}>{item.cardCode}</Text>
          <View style={styles.contactRow}>
            <Feather name="phone" size={11} color={colors.muted} />
            <Text style={styles.contactText}>{item.phone1 || "-"}</Text>
          </View>
          {!!item.emailAddress && (
            <View style={styles.contactRow}>
              <Feather name="mail" size={11} color={colors.muted} />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.emailAddress}
              </Text>
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dealers</Text>
        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, code, phone, email..."
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
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="users" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No dealers found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item: Dealer) => item.cardCode}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 6 },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { paddingBottom: spacing.sm },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  rowMain: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dealerName: { fontSize: 13, fontFamily: typography.semibold, color: colors.text, flexShrink: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotActive: { backgroundColor: colors.success },
  statusDotInactive: { backgroundColor: colors.muted },
  dealerCode: { fontSize: 10, fontFamily: typography.medium, color: colors.primary, marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  contactText: { fontSize: 10, fontFamily: typography.medium, color: colors.textSecondary },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
});