import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging'

// Instantiate the Messaging service instance
const messaging = getMessaging()

export const getFcmToken = async (retries = 3, delayMs = 3000): Promise<string | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const token = await getToken(messaging)
      if (token) return token
      console.warn(`FCM token unavailable (attempt ${attempt}/${retries})`)
    } catch (error) {
      console.warn(`FCM token request failed (attempt ${attempt}/${retries}):`, error)
    }
    if (attempt < retries)
      await new Promise<void>(resolve =>setTimeout(() => resolve(), delayMs))
  }
  console.warn('FCM token could not be obtained after retries')
  return null
}
export const subscribeToFcmTokenRefresh = (callback: (token: string) => void) => onTokenRefresh(messaging, callback)