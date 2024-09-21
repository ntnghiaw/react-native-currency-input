import { Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'


const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name='example'/>
      <Stack.Screen name='index'/>
    </Stack>
  )
}
export default Layout
const styles = StyleSheet.create({})