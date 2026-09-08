import { handleReminderAction } from '@services/notifications/notification.actions'
import { SQLiteDatabase } from 'expo-sqlite'
import {
    View,
    Text,
    Pressable,
    Platform,
    StatusBar,
    Image,
    NativeModules
} from 'react-native'
import { ReminderAlarmPayload } from './ReminderAlarmScreen'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons/static'
import { useState } from 'react'
import notifee from 'react-native-notify-kit'

type props = {
    db: SQLiteDatabase
    reminder: ReminderAlarmPayload
    userId: number
    ownerId: number
    userName: string
}

const ReminderAlarmEntry = ({
    db,
    reminder,
    userId,
    ownerId,
    userName
}: props) => {

    const scheduledTime =
        new Date(reminder.targetTimestamp).toLocaleTimeString()

    const snoozedUntil =
        reminder.snoozedUntil > 0
            ? new Date(reminder.snoozedUntil).toLocaleTimeString()
            : ''

    const { AlarmActivity } = NativeModules
    const [processing, setProcessing] = useState(false)

    const notificationId =
        `noti-${reminder.reminderId}-${reminder.occurrenceId}`

    /**
     * Handles the user's response to an active reminder.
     *
     * The production implementation records the reminder event,
     * updates local state, synchronizes the change, and closes
     * the native alarm activity.
     */
    const handleAction = async (status: number) => {
        if (processing) return

        setProcessing(true)

        try {
            // Core reminder-action workflow omitted from showcase.
            //
            // Production implementation:
            // 1. Records the selected reminder status.
            // 2. Updates the local SQLite state.
            // 3. Queues the change for synchronization.
            // 4. Cancels the displayed notification.
            // 5. Closes the native AlarmActivity.

            /*
            const result = await handleReminderAction(
                db,
                reminder.occurrenceId,
                reminder.reminderId,
                status,
                userId,
                ownerId,
                reminder.medicineName,
                userName
            )

            if (!result?.success) {
                setProcessing(false)
                return
            }

            await notifee
                .cancelDisplayedNotification(notificationId)
                .catch(() => {})

            AlarmActivity.finishActivity()
            */

            console.log('Reminder action:', status)

        } catch (error) {
            console.error('Reminder action failed:', error)
            setProcessing(false)
        }
    }

    return (
        <View className="flex-1 items-center justify-center bg-[#F4F6F8] p-6">

            {Platform.OS === 'android' ? <StatusBar hidden /> : null}

            <View
                className="w-full max-w-[420px] rounded-[28px] border border-[#E4E8EE] bg-white p-6"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 20,
                    elevation: 6
                }}
            >

                {/* Header */}
                <View className="mb-5 flex-row items-center justify-between">

                    <Image
                        source={require('@asset/logo_small.png')}
                        className="h-[50px] w-[120px]"
                        resizeMode="contain"
                    />

                    <View className="items-end">

                        <View className="mb-1 flex-row items-center">
                            <MaterialDesignIcons
                                name="bell-ring-outline"
                                size={16}
                                color="#3F6FD9"
                            />

                            <Text className="ml-1.5 text-xs font-bold uppercase tracking-[1.2px] text-[#3F6FD9]">
                                Reminder
                            </Text>
                        </View>

                        <View className="flex-row items-center">

                            {reminder.userPhotoUrl ? (
                                <Image
                                    source={{ uri: reminder.userPhotoUrl }}
                                    className="mr-2 h-9 w-9 rounded-full border-2 border-[#E8EEF9]"
                                />
                            ) : (
                                <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-[#EEF3FC]">
                                    <MaterialDesignIcons
                                        name="account"
                                        size={22}
                                        color="#3F6FD9"
                                    />
                                </View>
                            )}

                            <Text
                                numberOfLines={1}
                                className="max-w-[120px] text-base font-bold text-[#172033]"
                            >
                                {reminder.userName}
                            </Text>

                        </View>
                    </View>
                </View>

                {/* Medicine */}
                <Text className="mb-2 text-[30px] font-extrabold leading-9 text-[#172033]">
                    {reminder.medicineName}
                </Text>

                {/* Scheduled time */}
                <View className="mb-3 flex-row items-center">

                    <MaterialDesignIcons
                        name="clock-outline"
                        size={19}
                        color="#5F6B7A"
                    />

                    <Text className="ml-2 text-[15px] font-medium text-[#5F6B7A]">
                        {scheduledTime}
                    </Text>

                </View>

                {/* Snoozed */}
                {snoozedUntil && (
                    <View className="mb-5 flex-row items-center self-start rounded-full bg-[#FFF7E6] px-3 py-1.5">

                        <MaterialDesignIcons
                            name="clock-alert-outline"
                            size={16}
                            color="#B7791F"
                        />

                        <Text className="ml-1.5 text-xs font-semibold text-[#9A6700]">
                            Snoozed until {snoozedUntil}
                        </Text>

                    </View>
                )}

                {/* Actions */}
                <View className="gap-3">

                    <Pressable
                        disabled={processing}
                        className={`
                            min-h-[52px] items-center justify-center
                            rounded-2xl bg-[#3F7D5A] px-[18px]
                            ${processing ? 'opacity-50' : 'active:opacity-80'}
                        `}
                        onPress={() => handleAction(1)}
                    >
                        <Text className="text-base font-bold text-white">
                            Take now
                        </Text>
                    </Pressable>

                    <Pressable
                        disabled={processing}
                        className={`
                            min-h-[52px] items-center justify-center
                            rounded-2xl border border-[#D5DAE1]
                            bg-[#F7F8FA] px-[18px]
                            ${processing ? 'opacity-50' : 'active:opacity-80'}
                        `}
                        onPress={() => handleAction(5)}
                    >
                        <Text className="text-base font-bold text-[#344054]">
                            Snooze
                        </Text>
                    </Pressable>

                    <Pressable
                        disabled={processing}
                        className={`
                            min-h-[52px] items-center justify-center
                            rounded-2xl border border-[#F2C5C5]
                            bg-[#F9DADA] px-[18px]
                            ${processing ? 'opacity-50' : 'active:opacity-80'}
                        `}
                        onPress={() => handleAction(3)}
                    >
                        <Text className="text-base font-bold text-[#B42318]">
                            Skip
                        </Text>
                    </Pressable>

                </View>
            </View>
        </View>
    )
}

export default ReminderAlarmEntry
