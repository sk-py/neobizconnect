
import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Dealer } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DealersListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
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
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => router.push(`/dealer-details/${item.cardCode}`)}
      >
        <View style={styles.rowMain}>
          <View style={styles.nameRow}>
            <Text style={styles.dealerName} numberOfLines={1}>
              {item.cardName}
            </Text>
            <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
          </View>
          <Text style={styles.dealerCode}>{item.cardCode}</Text>

                   <View style={styles.contactGroup}>
            {!!item.phone1 && (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(`tel:${item.phone1}`);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="phone" size={11} color={colors.textSecondary} />
                <Text style={styles.contactChipText}>{item.phone1}</Text>
              </TouchableOpacity>
            )}
            {!!item.emailAddress && (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(`mailto:${item.emailAddress}`);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="mail" size={11} color={colors.textSecondary} />
                <Text style={styles.contactChipText} numberOfLines={1}>
                  {item.emailAddress}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Dealers</Text>
        </View>
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
      ) : isError ? (
        <View style={styles.emptyBox}>
          <Feather name="alert-triangle" size={32} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load dealers</Text>
          <Text style={styles.errorSubtitle}>{(error as any)?.message || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
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
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { paddingBottom: spacing.md },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  rowMain: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dealerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flexShrink: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotActive: { backgroundColor: colors.success },
  statusDotInactive: { backgroundColor: colors.muted },
  dealerCode: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 4 },

  contactGroup: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  contactChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  contactChipText: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
});