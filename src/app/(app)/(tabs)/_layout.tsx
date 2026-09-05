import { colors } from '@/constants/theme'
import { useAuth } from '@/hooks/use-auth'
import Feather from '@react-native-vector-icons/feather/static'
import { Tabs } from 'expo-router'

const TabLayout = () => {

    const { user } = useAuth()

    const isAdmin = user?.authority !== "Dealer"

    return (
            <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, }}>
                <Tabs.Screen
                    options={{
                        title: "Dashboard",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='bar-chart' size={size} color={color} />
                        )
                    }}
                    name='index' />
                                    <Tabs.Screen
                    options={{
                        title: "Dealers",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='users' size={size} color={color} />
                        )
                    }}
                    name='dealers' />
                <Tabs.Screen
                    options={{
                        title: "Item Master",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='package' size={size} color={color} />
                        )
                    }}
                    name='item-master' />
                <Tabs.Screen
                    options={{
                        title: "Sales Order",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='shopping-bag' size={size} color={color} />
                        ),

                    }}
                    name='sales-order' />
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
                        title: "Transaction History",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='credit-card' size={size} color={color} />
                        )
                    }}
                    name='transaction-history' />
                <Tabs.Screen
                    options={{
                        title: "Customer Ledger",
                        tabBarIcon: ({ color, size, focused }) => (
                            <Feather name={focused ? 'book-open' : 'book'} size={size} color={color} />
                        )
                    }}
                    name='customer-ledger' />
                <Tabs.Screen
                    options={{
                        title: "Queries",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='message-square' size={size} color={color} />
                        )
                    }}
                    name='dealer-query' />
                <Tabs.Screen
                    options={{
                        title: "Sub Dealers",
                        tabBarIcon: ({ color, size }) => (
                            <Feather name='users' size={size} color={color} />
                        )
                    }}
                    name='sub-dealer' />
            </Tabs>
    )
}

export default TabLayout