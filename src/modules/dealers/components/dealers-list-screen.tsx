import { colors, spacing, typography } from "@/constants/theme";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Dealer } from "@/modules/dealers/types";
import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DealersListScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Dealers (basic test)</Text>

      {isLoading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: Dealer) => item.cardCode}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.text}>
                {item.cardCode} - {item.cardName} - {item.phone1} - {item.emailAddress}
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