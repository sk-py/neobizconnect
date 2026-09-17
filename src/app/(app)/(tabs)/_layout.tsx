import { hasModuleAccess, type AppModuleName, type UserRole } from '@/constants/modules';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import Feather from '@react-native-vector-icons/feather/static';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabLayout = () => {
    const { user } = useAuth();
    const userRole = user?.authority as UserRole | undefined;
    const insets = useSafeAreaInsets();

    const canAccess = (moduleName: AppModuleName) => hasModuleAccess(moduleName, userRole);

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarStyle: {
                        elevation: 0,
                        borderTopWidth: 1,
                        borderTopColor: colors.border || '#E2E8F0',
                        marginBottom: "-3%",
                    }
                }}
            >
                <Tabs.Protected guard={canAccess("Tracker")}>
                    <Tabs.Screen
                        name='index'
                        options={{
                            title: "Tracker",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='map-pin' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Dashboard")}>
                    <Tabs.Screen
                        name='dashboard'
                        options={{
                            title: "Dashboard",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='bar-chart' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                {/* href: null -> no tab bar icon, reached only via in-app
                    navigation. Protected still governs whether the role can
                    reach it at all — the two aren't redundant here, they
                    control different things (visibility vs. reachability) */}
                <Tabs.Protected guard={canAccess("Dealers")}>
                    <Tabs.Screen
                        name='dealers'
                        options={{
                            title: "Dealers",
                            tabBarIcon: ({ color, size }) => (<Feather name='briefcase' color={color} size={size} />)
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sales Managers")}>
                    <Tabs.Screen
                        name='sales-managers'
                        options={{
                            title: "Sales Manager",
                            tabBarIcon: ({ color, size }) => (<Feather name='user-check' color={color} size={size} />)
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Item Master")}>
                    <Tabs.Screen
                        name='item-master'
                        options={{
                            title: "Stock",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='package' color={color} size={size} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Transaction History")}>
                    <Tabs.Screen
                        name='transaction-history'
                        options={{
                            title: "Transaction History",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='repeat' color={color} size={size} />
                            ),
                            href: user?.authority === "Sales Manager" ? null : "/transaction-history"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sales Order")}>
                    <Tabs.Screen
                        name='sales-order'
                        options={{
                            title: "Sales Order",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='shopping-bag' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Order History")}>
                    <Tabs.Screen
                        name='order-history'
                        options={{
                            title: "Order History",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='rotate-ccw' size={size} color={color} />
                            ),
                            href: user?.authority === "Sales Manager" ? null : "/order-history"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Customer Ledger")}>
                    <Tabs.Screen
                        name='customer-ledger'
                        options={{
                            title: "Customer Ledger",
                            tabBarIcon: ({ color, size, focused }) => (
                                <Feather name={focused ? 'book-open' : 'book'} size={size} color={color} />
                            ),
                            href: user?.authority === "Sales Manager" ? null : "/customer-ledger"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Dealer Query")}>
                    <Tabs.Screen
                        name='dealer-query'
                        options={{
                            title: "Queries",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='message-square' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sub Dealers")}>
                    <Tabs.Screen
                        name='sub-dealer'
                        options={{
                            title: "Sub Dealers",
                            href: user?.authority === "Sales Manager" ? null : "/",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='users' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Expense")}>
                    <Tabs.Screen
                        name='expense'
                        options={{
                            title: "Expense",
                            href: null,
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='dollar-sign' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Lead Query")}>
                    <Tabs.Screen
                        name='lead-query'
                        options={{
                            title: "Leads & Queries",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='message-square' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Dealer Lead Query")}>
                    <Tabs.Screen
                        name='dealer-lead-query'
                        options={{
                            title: "Lead / Query",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='bar-chart-2' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Online Lead")}>
                    <Tabs.Screen
                        name='online-lead'
                        options={{
                            title: "Online Lead",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='inbox' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sales Manager Modules")}>
                    <Tabs.Screen
                        name='sales-manager-modules'
                        options={{
                            title: "Sales Menu",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='menu' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>
            </Tabs>

            {/* Custom Branding Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 }} >
                    <Text style={styles.footerText}>By</Text>
                    <Image source={require("@/assets/images/favicon.png")} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                    <View style={{ flexDirection: "row" }}>
                        <Text style={[styles.footerText, styles.primaryText]}>Neo</Text>
                        <Text style={[styles.footerText, { color: colors.black }]}>Wheels</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    footer: {
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: "flex-end",
    },
    footerText: {
        fontSize: 10,
        color: '#64748B',
        fontFamily: typography.bold
    },
    primaryText: {
        color: colors.primary,
    }
});

export default TabLayout;