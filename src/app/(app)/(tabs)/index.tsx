import { useAuth } from '@/hooks/use-auth'
import { StyleSheet, Text, View } from 'react-native'

const tracker = () => {

  const { user } = useAuth()


  return (
    <View>
      <Text>tracker</Text>
    </View>
  )
}

export default tracker

const styles = StyleSheet.create({})