import { AppRegistry } from 'react-native'
import notifee, { EventType } from 'react-native-notify-kit'

import App from './App'
import { name as appName } from './app.json'
import ReminderAlarmScreen from '@screens/protected/notification/ReminderAlarmScreen'

import { handleReminderAction } from '@services/notifications/notification.actions'
import { initDatabase } from '@db/index'
import { getLoggedInUser } from '@db/repository/user/fetch'

// Background notification actions are handled at module scope
// so they remain available outside the normal React lifecycle.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.ACTION_PRESS) return

  const actionId = detail.pressAction?.id

  let status

  switch (actionId) {
    case 'taken':
      status = 1
      break
    case 'skip':
      status = 3
      break
    case 'snooze':
      status = 5
      break
    default:
      return
  }

  const occurrenceId = Number(detail.notification?.data?.id)
  const remId = Number(detail.notification?.data?.remId)
  const medicine = String(detail.notification?.data?.medicine)

  if (!occurrenceId || !remId) return

  try {
    // React Context is unavailable in a headless/background JS context.
    // Open the local database directly.
    const db = await initDatabase()

    // Restore the current user from local storage.
    const currentUser = await getLoggedInUser(db)

    if (!currentUser?.id || !currentUser?.ownerId) return

    // Core reminder-action mutation intentionally omitted
    // from the public showcase.
    //
    // await handleReminderAction(
    //   db,
    //   occurrenceId,
    //   remId,
    //   status,
    //   currentUser.id,
    //   currentUser.ownerId,
    //   medicine,
    //   currentUser.userName
    // )
  } catch (error) {
    console.error(
      '[notifee] Background reminder action failed:',
      error
    )
  }
})

AppRegistry.registerComponent(appName, () => App)

AppRegistry.registerComponent(
  'ReminderAlarmScreen',
  () => ReminderAlarmScreen
)
