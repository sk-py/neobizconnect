import { hasModuleAccess, type AppModuleName, type UserRole } from '@/constants/modules';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@react-native-vector-icons/feather/static';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabLayout = () => {
    const { user } = useAuth();
    const userRole = user?.authority as UserRole | undefined;
    console.log("DEBUG userRole:", JSON.stringify(userRole));
    const insets = useSafeAreaInsets();

    const { initializePush } = usePushNotifications(user?.user_id);

    useEffect(() => {
        const setupPush = async () => {
            if (!user?.user_id) return;

            const pushEnabled = await AsyncStorage.getItem("pushEnabled");

            // Default to true. Only skip if the user explicitly toggled it off.
            if (pushEnabled !== "false") {
                await initializePush();
            }
        };

        setupPush();
    }, [user?.user_id, initializePush]);

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
                        marginBottom: -Math.round(insets.bottom),
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
                            title: "NeoBizConnect",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='bar-chart' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("User Setup")}>
                    <Tabs.Screen
                        name='user-setup'
                        options={{
                            title: "Users",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='users' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? "/user-setup" : null
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("Admin Sub Dealer")}>
                    <Tabs.Screen
                        name='sub-dealer-index'
                        options={{
                            title: "Sub Dealer",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='user-plus' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? "/sub-dealer-index" : null
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("Admin Inventory")}>
                    <Tabs.Screen
                        name='admin-inventory'
                        options={{
                            title: "Stock",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='package' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? "/admin-inventory" : null
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("Admin Leads & Queries")}>
                    <Tabs.Screen
                        name='leads-and-queries-screen'
                        options={{
                            title: "Queries",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='message-square' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? "/leads-and-queries-screen" : null
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("Admin Sales Screen")}>
                    <Tabs.Screen
                        name='admin-sales-screen'
                        options={{
                            title: "Sales & Order",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='shopping-bag' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? "/admin-sales-screen" : null
                        }}
                    />
                </Tabs.Protected>
                                {/* Route still exists (reachable via router.push) but never shown as a tab */}
                <Tabs.Screen
                    name='sales-target'
                    options={{ href: null }}
                />

                <Tabs.Protected guard={canAccess("Notifications")}>
                    <Tabs.Screen
                        name='notifications'
                        options={{
                            title: "Notifications",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='bell' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>
                <Tabs.Protected guard={canAccess("Finances")}>
                    <Tabs.Screen
                        name='finances'
                        options={{
                            title: "Finances",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='dollar-sign' size={size} color={color} />
                            ),
                            href: null
                        }}
                    />
                </Tabs.Protected>
                {/* <Tabs.Protected guard={canAccess("Sales Target")}>
                    <Tabs.Screen
                        name='sales-target'
                        options={{
                            title: "Sales Target",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='target' size={size} color={color} />
                            ),
                            href: null
                        }}
                    />
                </Tabs.Protected> */}

                {/* href: null -> no tab bar icon, reached only via in-app
                    navigation. Protected still governs whether the role can
                    reach it at all — the two aren't redundant here, they
                    control different things (visibility vs. reachability) */}
                <Tabs.Protected guard={canAccess("Dealers")}>
                    <Tabs.Screen
                        name='dealers'
                        options={{
                            title: "Dealers",
                            tabBarIcon: ({ color, size }) => (<Feather name='briefcase' color={color} size={size} />),
                            href: userRole === "Admin" ? null : "/dealers"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sales Managers")}>
                    <Tabs.Screen
                        name='sales-managers'
                        options={{
                            title: "Sales Manager",
                            tabBarIcon: ({ color, size }) => (<Feather name='user-check' color={color} size={size} />),
                            href: userRole === "Admin" ? null : "/dealers"
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
                            ),
                            href: userRole === "Admin" ? null : "/item-master"
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
                            href: user?.authority === "Sales Manager" || userRole === "Admin" ? null : "/transaction-history"
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
                            href: user?.authority === "Sales Manager" || userRole === "Admin" ? null : "/order-history"
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
                            href: user?.authority === "Sales Manager" || userRole === "Admin" ? null : "/customer-ledger"
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
                            ),
                            href: userRole === "Admin" ? null : "/dealers"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sub Dealers")}>
                    <Tabs.Screen
                        name='sub-dealer'
                        options={{
                            title: "Sub Dealers",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='users' size={size} color={color} />
                            )
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sub Dealer List")}>
                    <Tabs.Screen
                        name='sub-dealer-list'
                        options={{
                            title: "Sub Dealer List",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='users' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? null : "/dealers"
                        }}
                    />
                </Tabs.Protected>

                <Tabs.Protected guard={canAccess("Sub Dealer Sales Target")}>
                    <Tabs.Screen
                        name='sub-dealer-sales-target'
                        options={{
                            title: "Sub Dealer Sales Target",
                            tabBarIcon: ({ color, size }) => (
                                <Feather name='target' size={size} color={color} />
                            ),
                            href: userRole === "Admin" ? null : "/dealers"
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
                            ),
                            href: userRole === "Admin" ? null : "/lead-query"
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
                            ),
                            href: userRole === "Admin" ? null : "/dealers"
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