import { NavigationContainer} from "@react-navigation/native"
import { useAuth } from "@context/AuthContext"
import { AppStack } from "@stack"
import { AuthStack } from "@stack"
import Toast from "react-native-toast-message"
import { ToastConfig } from "@components/toast"
import { View } from "react-native"
import { InitializationScreen } from "@screens/InitializationScreen"
import { useCallback, useEffect, useState } from "react"
import { LanguageSelectionScreen } from "@screens/LanguageSelectionScreen"
import { useSQLite } from "@context/DatabaseContext"
import { getSetting, setSetting } from "@db/repository/app_setting.ts"
import { useLanguage } from "@context/LanguageContext"

const linking = {
  // 1. Tell React Navigation which domains to listen to
  prefixes: ['https://mero-medicine.firebaseapp.com'],
  
  // 2. Map the URL path to your specific screen
  config: {
    screens: {
      // This tells the router: If the URL path is "/__/auth/action", 
      // open the ResetPasswordScreen and pass the URL parameters as props.
      ResetPasswordScreen: '__/auth/action'
    }
  }
}

const AppContent = () => {
  const { t, locale, setLocale } = useLanguage()
  const { db, ready } = useSQLite()
  const { currentUser, guestMode, initStep, initError } = useAuth()
  const [languageSelected, setLanguageSelected] = useState<string>('')

  useEffect(() => {
    if (!db || !ready) return

    getSetting(db, 'languageSelected')
      .then(value => setLanguageSelected(value ?? ''))
      .catch(error => {
        console.error('Failed to load language selection:', error)
        setLanguageSelected('')
      })
  }, [db, ready])

  const updateLanguage = useCallback(async () => {
    if (!db) return

    await setSetting(db, 'languageSelected', locale)
    setLanguageSelected(locale)
  }, [db, locale])

  const initializationReady = initStep === 'ready'

  const alreadyInApp = initializationReady && (!!currentUser?.userServerId || guestMode)
  const showLanguageSelection = languageSelected === ''

  const showInitialization =
    !showLanguageSelection &&
    (!!initError || !initializationReady)

  return (
    <View className="flex-1">

      <NavigationContainer linking={linking}>
        {alreadyInApp ? <AppStack /> : <AuthStack />}
      </NavigationContainer>

      {showLanguageSelection && (
        <View className="absolute inset-0">
          <LanguageSelectionScreen
            t={t}
            locale={locale}
            setLocale={setLocale}
            onConfirm={updateLanguage}
          />
        </View>
      )}

      {showInitialization &&
        <View className="absolute inset-0">
          <InitializationScreen />
        </View>
      }

      <Toast config={ToastConfig} />
    </View>
  )
}

export default AppContent