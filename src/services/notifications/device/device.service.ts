import { SQLiteDatabase } from 'expo-sqlite'
import { getFcmToken } from '../fcm/fcm.token'
import { enqueueSync } from '@db/sync/core/enqueue'
import { upsertDevice } from '@db/repository/device/upsert'

export const initializeDevice = async (db:SQLiteDatabase, userId:number, ownerId:number, appDeviceId:string) => {
    const fcmToken = await getFcmToken()
    if (!fcmToken) {
        console.warn('Device initialization skipped: no FCM token')
        return
    }
    const deviceId = await upsertDevice(db, userId, ownerId, fcmToken, appDeviceId)
    if (!deviceId) return
      await enqueueSync(db, 'devices', deviceId, 'create', userId, ownerId)
}