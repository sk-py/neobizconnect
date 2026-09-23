import Feather from '@react-native-vector-icons/feather/static'
import { Stack, useRouter } from 'expo-router'
import { Pressable } from 'react-native'

const _layout = () => {

  const router = useRouter()

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back()
    }
  }

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
        headerTitleAlign: "center",
        headerLeft: ({ }) => {
          return (<Pressable onPress={handleBackPress}>
            <Feather name='arrow-left' size={20} />
          </Pressable>)
        }
      }} name='pending-orders' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Proforma Invoice List",
        headerTitleAlign: "center",
        headerLeft: ({ }) => {
          return (<Pressable onPress={handleBackPress}>
            <Feather name='arrow-left' size={20} />
          </Pressable>)
        }
      }} name='proforma-invoice' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Invoice Orders List",
        headerTitleAlign: "center",
        headerLeft: ({ }) => {
          return (<Pressable onPress={handleBackPress}>
            <Feather name='arrow-left' size={20} />
          </Pressable>)
        }
      }} name='ar-invoice' />

      <Stack.Screen options={{
        headerShown: true,
        headerShadowVisible: false,
        title: "Credit Memos List",
        headerTitleAlign: "center",
        headerLeft: ({ }) => {
          return (<Pressable onPress={handleBackPress}>
            <Feather name='arrow-left' size={20} />
          </Pressable>)
        }
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