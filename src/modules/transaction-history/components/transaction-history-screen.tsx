import { colors, spacing, typography } from "@/constants/theme";
import { fetchTransactionHistory } from "@/modules/transaction-history/services/transaction-history.api";
import { Transaction } from "@/modules/transaction-history/types";
import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const calcAmount = (lines: Transaction["documentLines"]) => {
  if (!lines?.length) return 0;
  return lines.reduce((sum, line) => sum + (line.Quantity || 0) * (line.UnitPrice || 0), 0);
};

export default function TransactionHistoryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["transaction-history"],
    queryFn: fetchTransactionHistory,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Transaction History (basic test)</Text>

            {isLoading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : !data || data.length === 0 ? (
        <Text style={styles.text}>No transactions found.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: Transaction) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.text}>
                {item.card_name} - ₹{calcAmount(item.documentLines)}
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
  title: { fontSize: 16, fontFamily: typography.bold, color: colors.text, padding: spacing.md },
  row: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
});