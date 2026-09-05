import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchLeadQueries } from "@/modules/lead-query/services/lead-query.api";
import { LeadQuery } from "@/modules/lead-query/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getBrandAccent = (brand: string) => {
  const normalized = (brand || "").toLowerCase();
  if (normalized === "zetta") {
    return { bar: "#7C3AED", badgeBg: "#EDE9FE", badgeText: "#7C3AED" };
  }
  return { bar: colors.primary, badgeBg: "#FEF2F2", badgeText: colors.primary };
};

export default function LeadQueryScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["lead-queries"],
    queryFn: fetchLeadQueries,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const form = item.formJson?.[0];
      return (
        form?.customer_name?.toLowerCase().includes(query) ||
        form?.phone_1?.toLowerCase().includes(query) ||
        form?.city?.toLowerCase().includes(query) ||
        form?.car_model?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const renderRow = ({ item }: { item: LeadQuery }) => {
    const form = item.formJson?.[0];
    const latestRemark = item.remarks_list?.[item.remarks_list.length - 1];
    const accent = getBrandAccent(form?.brand_interest || "");

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.accentBar, { backgroundColor: accent.bar }]} />
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.customerName} numberOfLines={1}>
              {form?.customer_name || "-"}
            </Text>
            <Text style={styles.ageText}>{item.age}</Text>
          </View>

          <View style={styles.metaRow}>
            <Feather name="phone" size={11} color={colors.muted} />
            <Text style={styles.metaText}>{form?.phone_1 || "-"}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Feather name="map-pin" size={11} color={colors.muted} />
            <Text style={[styles.metaText, { flex: 1 }]} numberOfLines={1}>
              {form?.city}
              {form?.state ? `, ${form.state}` : ""}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Car Model</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{form?.car_model || "-"}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Brand Interest</Text>
              <View style={[styles.brandBadge, { backgroundColor: accent.badgeBg }]}>
                <Text style={[styles.brandBadgeText, { color: accent.badgeText }]}>
                  {form?.brand_interest || "-"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Type of Query</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{form?.type_of_query || "-"}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Source</Text>
              <Text style={styles.infoValue}>{form?.source || "-"}</Text>
            </View>
          </View>

          {latestRemark && (
            <View style={styles.remarkRow}>
              <Feather name="message-circle" size={12} color={colors.textSecondary} />
              <Text style={styles.remarkText} numberOfLines={2}>
                {latestRemark.remark}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Lead / Query</Text>
        </View>
        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, city, or car model..."
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
          <Text style={styles.errorTitle}>Couldn't load queries</Text>
          <Text style={styles.errorSubtitle}>{(error as any)?.message || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="help-circle" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No queries found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item: LeadQuery) => String(item.id)}
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
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  titleIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { padding: spacing.md },

  cardWrapper: { flexDirection: "row", marginBottom: spacing.md, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  accentBar: { width: 4 },
  card: { flex: 1, backgroundColor: colors.white, padding: spacing.md },

  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  customerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  ageText: { fontSize: 10, fontFamily: typography.medium, color: colors.muted },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flexShrink: 1 },
  metaDot: { fontSize: 11, color: colors.muted },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },

  brandBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  brandBadgeText: { fontSize: 12, fontFamily: typography.bold },

  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  remarkText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flex: 1, lineHeight: 16 },

  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
});