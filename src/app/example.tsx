import { StyleSheet, Text, View } from 'react-native'
import CurrencyInput from '@/src/components/CurrencyInput'
const example = () => {
  return (
    <View>
      <CurrencyInput 
       placeholder='Enter amount'
       intlConfig={{ locale: 'en-US', currency: 'USD' }}
       onValueChange={(text, values) => {
         console.log(text, values)
       }}
      />
    </View>
  )
}
export default example
const styles = StyleSheet.create({})