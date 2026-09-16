import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Href, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryModuleItem = {
  id: string;
  title: string;
  subtitle: string;
  route: Href;
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  iconBg: string;
};

const ORDER_MODULES: HistoryModuleItem[] = [
  {
    id: "pending-orders",
    title: "Pending Orders",
    subtitle: "View and track unfulfilled sales orders",
    route: "/pending-orders",
    icon: "clock",
    iconColor: "#2563EB",
    iconBg: "#EFF6FF",
  },
  {
    id: "proforma-invoice",
    title: "Proforma Invoice",
    subtitle: "Check generated proforma estimates and details",
    route: "/proforma-invoice",
    icon: "file-text",
    iconColor: "#7C3AED",
    iconBg: "#F5F3FF",
  },
  {
    id: "ar-invoice",
    title: "AR Invoice",
    subtitle: "Access completed tax invoices and records",
    route: "/ar-invoice",
    icon: "check-circle",
    iconColor: "#059669",
    iconBg: "#ECFDF5",
  },
  {
    id: "ar-credit-memo",
    title: "AR Credit Memo",
    subtitle: "View sales returns, credits, and adjustments",
    route: "/ar-credit-memo",
    icon: "rotate-ccw",
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
  },
];

export const OrderHistoryIndexScreen = () => {
  const router = useRouter();

  const { user } = useAuth()

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {

        if (user?.authority !== "Sales Manager") return;

        router.push("/sales-manager-modules");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [router]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>
            Select one of the options to view your sales and financial records.
          </Text>
        </View>

        <View style={styles.cardList}>
          {ORDER_MODULES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.moduleCard}
              activeOpacity={0.7}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                <Feather name={item.icon} size={22} color={item.iconColor} />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.arrowBox}>
                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.text,
    paddingBottom: 2
  },
  headerSubtitle: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardList: {
    gap: spacing.md,
  },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: txtSize.body,
    fontFamily: typography.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: typography.regular,
    color: colors.muted,
  },
  arrowBox: {
    paddingLeft: spacing.sm,
  },
});

export default OrderHistoryIndexScreen;