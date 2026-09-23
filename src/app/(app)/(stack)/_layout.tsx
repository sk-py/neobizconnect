import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='cart' />
      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Your Profile",
        headerTitleAlign: "center"
      }} name='profile' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Pending Orders List",
        headerTitleAlign: "center"
      }} name='pending-orders' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Proforma Invoice List",
        headerTitleAlign: "center"
      }} name='proforma-invoice' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Invoice Orders List",
        headerTitleAlign: "center"
      }} name='ar-invoice' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Credit Memos List",
        headerTitleAlign: "center"
      }} name='ar-credit-memo' />
            <Stack.Screen name='manage-sub-dealers' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Change Password",
        headerTitleAlign: "center"
      }} name='change-password' />
    </Stack>
  )
}

export default _layout