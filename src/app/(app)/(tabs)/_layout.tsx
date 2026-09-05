import { hasModuleAccess, type AppModuleName, type UserRole } from '@/constants/modules'; // Update with your actual path
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import Feather from '@react-native-vector-icons/feather/static';
import { Tabs } from 'expo-router';

const TabLayout = () => {
    const { user } = useAuth()
    const userRole = user?.authority as UserRole | undefined

    const canAccess = (moduleName: AppModuleName) => hasModuleAccess(moduleName, userRole)

    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
            <Tabs.Protected guard={user?.authority === "Sales Manager"} >
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
            <Tabs.Screen
                name='dashboard'
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name='bar-chart' size={size} color={color} />
                    )
                }}
            />
            <Tabs.Protected guard={user?.authority === "Sales Manager"} >
                <Tabs.Screen
                    options={{
                        title: "Dealers",
                        href: null,
                    }}
                    name='dealers' />
                <Tabs.Screen
                    options={{
                        title: "Item Master",
                        href: null,
                    }}
                    name='item-master' />
                <Tabs.Screen
                    options={{
                        title: "Transaction History",
                        href: null,
                    }}
                    name='transaction-history' />
            </Tabs.Protected>

            <Tabs.Protected guard={user?.authority === "Dealer"}>
            <Tabs.Screen
                options={{
                    title: "Sales Order",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name='shopping-bag' size={size} color={color} />
                    )
                }}
                name='sales-order' />
            </Tabs.Protected>
            <Tabs.Screen
                options={{
                    title: "Order History",
                    tabBarIcon: ({ color, size }) => (
                        <Feather name='rotate-ccw' size={size} color={color} />
                    )
                }}
                name='order-history' />
            <Tabs.Screen
                options={{
                    title: "Customer Ledger",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Feather name={focused ? 'book-open' : 'book'} size={size} color={color} />
                    )
                }}
                name='customer-ledger' />
            
            <Tabs.Protected guard={user?.authority === "Dealer"} >
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
            <Tabs.Screen
                name='sub-dealer'
                options={{
                    title: "Sub Dealers",
                    href: user?.authority === "Sales Manager" ? null : "/sub-dealer" ,
                    tabBarIcon: ({ color, size }) => (
                        <Feather name='users' size={size} color={color} />
                    )
                }}
            />
            <Tabs.Protected guard={user?.authority === "Sales Manager"} >
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
            <Tabs.Protected guard={user?.authority === "Sales Manager"} >
                <Tabs.Screen
                    name='lead-query'
                    options={{
                        title: "Lead Query",
                        href: null,
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='message-square' size={size} color={color} />
                        )
                    }}
                />
            </Tabs.Protected>
            <Tabs.Protected guard={user?.authority === "Sales Manager"} >
                <Tabs.Screen
                    name='sales-manager-modules'
                    options={{
                        title: "Sales Modules",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='menu' size={size} color={color} />
                        )
                    }}
                />
            </Tabs.Protected>
        </Tabs>
    )
}

export default TabLayout