import { NOTIFICATION_CHANNELS } from '@constant/notification'
import notifee, { AndroidImportance } from 'react-native-notify-kit'

export const initializeNotifications = async () => {
    await notifee.requestPermission()

    await Promise.all([
        notifee.createChannel({
            id: NOTIFICATION_CHANNELS.MEDICINE,
            name: 'Medicine Reminders',
            importance: AndroidImportance.HIGH
        }),

        notifee.createChannel({
            id: NOTIFICATION_CHANNELS.FAMILY,
            name: 'Family Notifications',
            importance: AndroidImportance.DEFAULT
        })
    ])
}