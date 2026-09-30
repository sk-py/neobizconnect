import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const SalesIndexScreen = () => {
    const router = useRouter();

        const MENU_OPTIONS = [
                        {
            id: "sales-target",
            title: "Sales Target",
            description: "Monitor and set regional or dealer targets.",
            icon: "target",
            route: "/sales-target",
            iconColor: "#E11D48", // Rose
            iconBg: "#FFF1F2"
        },
        {
            id: "transaction-history",
            title: "Transaction History",
            description: "Review your transaction records.",
            icon: "repeat",
            route: "/transaction-history",
            iconColor: "#3B82F6", // Blue
            iconBg: "#EFF6FF"
        },
        {
            id: "order-history",
            title: "Order History",
            description: "Review past sales and order statuses.",
            icon: "rotate-ccw",
            route: "/order-history",
            iconColor: "#10B981", // Emerald
            iconBg: "#ECFDF5"
        }
    ];
    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                            <Text style={styles.headerTitle} numberOfLines={1}>Sales & Order</Text>
                <Text style={styles.headerSubtitle} numberOfLines={2}>Manage orders, targets, and sales history</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {MENU_OPTIONS.map((option) => (
                    <Pressable
                        key={option.id}
                        style={({ pressed }) => [
                            styles.card,
                            pressed && styles.cardPressed
                        ]}
                                                onPress={() => {
                            if (!option.route) {
                                Alert.alert("Coming Soon", "This section is under development.");
                                return;
                            }
                            router.push(option.route as any);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: option.iconBg }]}>
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

export default SalesIndexScreen;