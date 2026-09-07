import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const SalesManagerIndexScreen = () => {
    const router = useRouter();

    const MENU_OPTIONS = [
        {
            id: "dealers",
            title: "Dealers",
            description: "Manage and view your primary dealer network.",
            icon: "briefcase",
            route: "/dealers",
            iconColor: "#3B82F6",
            iconBg: "#EFF6FF"
        },
        // {
        //     id: "sub-dealers",
        //     title: "Sub Dealers",
        //     description: "Track and manage the sub-dealer network.",
        //     icon: "users",
        //     route: "/sub-dealer",
        //     iconColor: "#8B5CF6",
        //     iconBg: "#F5F3FF"
        // },
        {
            id: "item-master",
            title: "Item Master",
            description: "View product catalog, stock, and pricing.",
            icon: "package",
            route: "/item-master",
            iconColor: "#F59E0B",
            iconBg: "#FFFBEB"
        },
        {
            id: "transaction-history",
            title: "Transaction History",
            description: "Review past orders and financial records.",
            icon: "file-text",
            route: "/transaction-history",
            iconColor: "#14B8A6",
            iconBg: "#F0FDFA"
        },
        // {
        //     id: "expense",
        //     title: "Expense",
        //     description: "Log and track your daily sales expenses.",
        //     icon: "dollar-sign",
        //     route: "/expense",
        //     iconColor: "#EF4444",
        //     iconBg: "#FEF2F2"
        // },
        {
            id: "lead-query",
            title: "Lead Query",
            description: "Manage new leads and customer inquiries.",
            icon: "message-square",
            route: "/lead-query",
            iconColor: "#10B981",
            iconBg: "#ECFDF5"
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sales Workspace</Text>
                <Text style={styles.headerSubtitle}>Manage your daily operations and network</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {MENU_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => router.push(option.route as any)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: option.iconBg }]}>
                            <Feather name={option.icon as any} size={22} color={option.iconColor} />
                        </View>
                        
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>{option.title}</Text>
                            <Text style={styles.cardDesc}>{option.description}</Text>
                        </View>
                        
                        <Feather name="chevron-right" size={20} color={colors.muted} />
                    </TouchableOpacity>
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
        fontSize: 20, 
        fontFamily: typography.bold, 
        color: colors.text 
    },
    headerSubtitle: { 
        fontSize: txtSize.small, 
        fontFamily: typography.medium, 
        color: colors.textSecondary, 
        marginTop: 2
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
        borderColor: colors.border 
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
        fontSize: 16, 
        fontFamily: typography.bold, 
        color: colors.text, 
        marginBottom: 4 
    },
    cardDesc: { 
        fontSize: 13, 
        fontFamily: typography.medium, 
        color: colors.textSecondary, 
        lineHeight: 18 
    }
});

export default SalesManagerIndexScreen