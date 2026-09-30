import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const UsersSetupIndexScreen = () => {
    const router = useRouter();

    const MENU_OPTIONS = [
        {
            id: "dealers",
            title: "Dealers",
            description: "Manage and view your primary dealer network.",
            icon: "briefcase",
            route: "/dealers",
            iconColor: colors.primary,
        },
                {
            id: "sales-manager",
            title: "Sales Manager",
            description: "Configure sales territories and manager accounts.",
            icon: "bar-chart-2",
            route: "/sales-managers",
            iconColor: colors.success,
        },
        {
            id: "sub-dealer",
            title: "Sub-Dealer",
            description: "Manage your sub-dealer network.",
            icon: "users",
            route: "/sub-dealer",
            iconColor: "#8B5CF6",
        },
                {
            id: "sub-dealer-sales",
            title: "Sub-Dealer Sales",
            description: "View sub-dealer sales records.",
            icon: "shopping-bag",
            route: "/sub-dealer-list",
            iconColor: "#0D9488",
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                            <Text style={styles.headerTitle} numberOfLines={1}>Users</Text>
                <Text style={styles.headerSubtitle} numberOfLines={2}>Manage system access and roles</Text>
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
                        {/* Using standard theme colors with 10% opacity (1A) for backgrounds */}
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
        fontSize: txtSize.medium || 20, // Fallback to 20 if lg isn't defined in your theme
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

export default UsersSetupIndexScreen;