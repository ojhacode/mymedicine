import React from "react"
import { AuthProvider } from "@context/AuthContext"
import { LanguageProvider } from "@context/LanguageContext"
import AppContent from "./src/AppContent"
import { ReminderProvider } from "@context/ReminderContext"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ThemeProvider } from '@context/ThemeContext'
import { SQLiteProvider } from "@context/DatabaseContext"
import 'react-native-get-random-values'
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import './global.css'
import Toast from "react-native-toast-message"
import { ToastConfig } from "@components/toast"
import { FamilyProvider } from "@context/FamilyContext"

GoogleSignin.configure({ 
  webClientId: 'REDACTED',
  offlineAccess: true
})

const App = () =>
  <SQLiteProvider>
    <LanguageProvider>
      <AuthProvider>
        <ReminderProvider>
          <FamilyProvider>
            <ThemeProvider>
              <SafeAreaProvider>
                <AppContent />
                <Toast config={ToastConfig} />
              </SafeAreaProvider>
            </ThemeProvider>
          </FamilyProvider>
        </ReminderProvider>
      </AuthProvider>
    </LanguageProvider>
  </SQLiteProvider>

export default App