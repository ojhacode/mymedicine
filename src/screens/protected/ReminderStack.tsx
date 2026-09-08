// MedicineStack.tsx
import React, { useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import AddMedicine from '@screens/protected/reminder/Screen2nd_AddMedicine'
import AddPattern from '@screens/protected/reminder/Screen3rd_AddPattern'
import AddMedicineDay from '@screens/protected/reminder/Screen4th_AddMedicineDay'
import AddXDayXWeekXMonth from '@screens/protected/reminder/duration/AddXDayXWeekXMonth'
import AddDose from '@screens/protected/reminder/Screen5th_AddDose'
import AddTime from '@screens/protected/reminder/Screen6th_AddTime'
import DisplayMedicine from '@screens/protected/reminder/Screen7th_DisplayMedicine'
import AddWeekDay from '@screens/protected/reminder/pattern/AddWeekDay'
import AddCycle from '@screens/protected/reminder/pattern/AddCycle'
import AddEveryXDayXWeekXMonth from '@screens/protected/reminder/pattern/AddEveryXDayXWeekXMonth'
import AddEveryXHour from '@screens/protected/reminder/dose/AddEveryXHour'
import { View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useLanguage } from '@context/LanguageContext'
import { MedicineMniSummary } from '@components/modal/MedicineMniSummary'
import SummaryButton from '@ui/SummaryButton'
import VoiceAddMedicine from '@screens/protected/reminder/Screen98th_VoiceAddMedicine'
import SignIn from "@authStack/Login"
import { useSummaryModal } from '@context/ReminderContext'
import ReminderSummary from '@screens/protected/reminder/Screen1st_ReminderSummary'

const Stack = createStackNavigator()
const ReminderStack = ({ route }: any) => {
  const [screen, setScreen] = useState('')
  const {t} = useLanguage()
  const navigation = useNavigation<NativeStackNavigationProp<{Reminder:undefined}>>()
  const {summaryMdl, setSummaryMdl} = useSummaryModal()
  const navReset = () => {
    navigation.reset({index: 0, routes: [{ name: 'Reminder' }]})
    setSummaryMdl(false)
  }
  return <View className='flex-1 relative'>
    <Stack.Navigator
      screenOptions={{headerShown:false}}
      screenListeners={{
          state: (e) => {
            const state = e.data.state
            setScreen(state.routes[state.index].name)
          }
      }}
    >
      <Stack.Screen name="Medicine" component={ReminderSummary} />
      <Stack.Screen name="AddMedicine" component={AddMedicine} />
      <Stack.Screen name="VoiceAddMedicine" component={VoiceAddMedicine} />
      <Stack.Screen name="AddPattern" component={AddPattern} />
      <Stack.Screen name="AddMedicineDay" component={AddMedicineDay} />
      <Stack.Screen name="AddXDayXWeekXMonth" component={AddXDayXWeekXMonth} />
      <Stack.Screen name="AddWeekDay" component={AddWeekDay} />
      <Stack.Screen name="AddCycle" component={AddCycle} />
      <Stack.Screen name="AddEveryXDayXWeekXMonth" component={AddEveryXDayXWeekXMonth} />
      <Stack.Screen name="AddDose" component={AddDose} />
      <Stack.Screen name="AddEveryXHour" component={AddEveryXHour} />
      <Stack.Screen name="AddTime" component={AddTime} />
      <Stack.Screen name="DisplayMedicine" component={DisplayMedicine} />
      <Stack.Screen name="SignIn" component={SignIn}  />
    </Stack.Navigator>
    {screen!=='Medicine' && <View className="absolute w-full top-[5px] right-[15px] flex-row justify-end">
        <SummaryButton label='My Reminder' onPress={() => setSummaryMdl(true)} right={10} />
    </View>}
    {summaryMdl && <MedicineMniSummary t={t} setSummaryMdl={setSummaryMdl} navReset={navReset} />}
  </View>
}
export default ReminderStack