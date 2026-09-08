import { getAppDeviceId } from '@core/session.service'
import { upsertDevice } from '@db/repository/device/upsert'
import { enqueueSync } from '@db/sync/core/enqueue'
import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging'
import { SQLiteDatabase } from 'expo-sqlite'

const messaging = getMessaging()

export const startFcmTokenListener = (db: SQLiteDatabase, userId: number, ownerId: number) => 
  onTokenRefresh(messaging, async (fcmToken) => {
    try {
      const appDeviceId = await getAppDeviceId()
      const deviceId = await upsertDevice(db, userId, ownerId, fcmToken, appDeviceId)
      await enqueueSync(db, 'devices', deviceId, 'update', userId, ownerId)
    } catch (error) {
      console.error('FCM token refresh handling failed:', error)
    }
  })