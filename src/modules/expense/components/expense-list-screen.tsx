import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchExpenses } from "@/modules/expense/services/expense.api";
import { ExpenseListItem } from "@/modules/expense/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatCurrency = (val: number) =>
  (val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") return { bg: "#F0FDF4", text: colors.success };
  if (normalized === "rejected") return { bg: "#FEF2F2", text: colors.error };
  return { bg: "#FFFBEB", text: "#B45309" };
};

export default function ExpenseListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item: ExpenseListItem) =>
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.subCategory?.toLowerCase().includes(query),
    );
  }, [data, searchQuery]);

  const renderCard = (item: ExpenseListItem) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formatDate(item.date)}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.category || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Sub Category</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.subCategory || "-"}</Text>
          </View>
        </View>

        {!!item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>Rs. {formatCurrency(item.amount)}</Text>
        </View>

                <View style={styles.employeeRow}>
          <Feather name="user" size={11} color={colors.muted} />
          <Text style={styles.employeeText}>{item.employeeName}</Text>
        </View>

        {!!item.remarks && (
          <View style={styles.remarkRow}>
            <Feather name="message-circle" size={12} color={colors.textSecondary} />
            <Text style={styles.remarkText} numberOfLines={2}>
              {item.remarks}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Expense</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/expense-create")}
          >
            <Feather name="plus" size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, category..."
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
          <Text style={styles.errorTitle}>Couldn't load expenses</Text>
          <Text style={styles.errorSubtitle}>{(error as any)?.message || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="file-text" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No expenses found</Text>
          <Text style={styles.emptySubtitle}>Tap "Create" to add your first expense</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredData.map(renderCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerTitle: { fontSize: 15, fontFamily: typography.bold, color: colors.text },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm },
  addBtnText: { fontSize: 12, fontFamily: typography.bold, color: colors.white },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, height: 34 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },

  listContent: { padding: spacing.md },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.xl },
  statusBadgeText: { fontSize: 10, fontFamily: typography.bold },
  dateText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: spacing.sm },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },

  description: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, lineHeight: 16, marginBottom: spacing.sm },

  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  amountLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  amountValue: { fontSize: 15, fontFamily: typography.bold, color: colors.primary },

  remarkRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: spacing.sm },
  remarkText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flex: 1, lineHeight: 16 },
  employeeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.xs },
  employeeText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  emptySubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  errorTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
});