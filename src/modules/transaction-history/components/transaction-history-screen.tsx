import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchTransactionHistory } from "@/modules/transaction-history/services/transaction-history.api";
import { Transaction } from "@/modules/transaction-history/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const calcAmount = (lines: Transaction["documentLines"]) => {
  if (!lines?.length) return 0;
  return lines.reduce((sum, line) => sum + (line.Quantity || 0) * (line.UnitPrice || 0), 0);
};

export default function TransactionHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transaction-history"],
    queryFn: fetchTransactionHistory,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (t) =>
        t.card_name?.toLowerCase().includes(query) ||
        t.cardCode?.toLowerCase().includes(query) ||
        String(t.series ?? "").includes(query),
    );
  }, [data, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Transaction History</Text>

      <View style={styles.searchContainer}>
        <Feather name="search" size={14} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by dealer, code, or doc no..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
            <Feather name="x-circle" size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : filteredData.length === 0 ? (
        <Text style={styles.text}>No transactions found.</Text>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item: Transaction) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.text}>
                {item.card_name} - Rs.{calcAmount(item.documentLines)}
              </Text>
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
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, height: 36 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: typography.medium, color: colors.text, height: "100%", padding: 0 },
  clearSearchBtn: { padding: 2 },
  row: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
});