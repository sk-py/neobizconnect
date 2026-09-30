import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const LeadsAndQueriesIndexScreen = () => {
  const router = useRouter();

    const MENU_OPTIONS = [
    {
      id: "dealer-query",
      title: "Dealer Query",
      description: "Address direct inquiries from your dealer network.",
      icon: "message-square",
      route: "/dealer-query",
      iconColor: "#EA580C", // Orange
      iconBg: "#FFF7ED"
    },
    {
      id: "lead-query",
      title: "Lead / Query",
      description: "Manage specific lead and query entries.",
      icon: "bar-chart-2",
      route: "/lead-query",
      iconColor: "#8B5CF6", // Purple
      iconBg: "#F5F3FF"
    },
    {
      id: "online-lead",
      title: "Online Lead",
      description: "Review and respond to incoming online leads.",
      icon: "inbox",
      route: "/online-lead",
      iconColor: "#0D9488", // Teal
      iconBg: "#F0FDFA"
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>Queries</Text>
        <Text style={styles.headerSubtitle} numberOfLines={2}>Manage all incoming inquiries and prospects</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MENU_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed
            ]}
            onPress={() => router.push(option.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${option.iconColor}1A` }]}>
              <Feather name={option.icon as any} size={22} color={option.iconColor} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>{option.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{option.description}</Text>
            </View>

            <Feather name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  header: {
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: txtSize.medium || 20,
    fontFamily: typography.bold,
    color: colors.text
  },
  headerSubtitle: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs || 2
  },
  content: {
    padding: spacing.md,
    gap: spacing.md
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.surface,
    opacity: 0.8
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.sm
  },
  cardTitle: {
    fontSize: txtSize.small || 16,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 4
  },
  cardDesc: {
    fontSize: txtSize.xs || 13,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    lineHeight: 18
  }
});

export default LeadsAndQueriesIndexScreen;