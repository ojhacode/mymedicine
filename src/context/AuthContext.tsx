import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react'

// Database / local session
import { useSQLite } from './DatabaseContext'
import { getLoggedInUser } from '@db/repository/user/fetch'

// Network / synchronization
import { useNetworkStatus } from '@hooks/useNetworkStatus'
import { masterDataSyncService } from '@db/service/masterDataSyncService'

// User synchronization engines
import { runPullEngine } from '@db/sync/pull/pull.engine'
import { pushBackgroundService } from '@db/sync/push/push.background.engine'

// Device / notification services
import { getAppDeviceId } from '@core/session.service'
import { initializeDevice } from '@services/notifications/device/device.service'
import { initializeNotifications } from '@services/notifications/notification.init'
import { scheduleReminderNotifications } from '@services/notifications/notification.scheduler'
import { registerNotificationEvents } from '@services/notifications/notification.events'
import { startFcmTokenListener } from '@services/notifications/fcm/fcm.token.listener'
import { getAllDevice } from '@db/repository/device/fetch'

// Application state / sync readiness
import { hasRequiredMasterData, setSetting } from '@db/repository/app_setting'
import { markSyncReady, resetSyncReadiness } from '@db/sync/core/syncReadiness'

// Types
import { AuthContextType, InitError, InitStep, User } from '@type/context/auth'
import { useLanguage } from './LanguageContext'


/**
 * This is a deliberately simplified excerpt from the application's
 * authentication and initialization architecture.
 *
 * Production-specific implementations are omitted while the
 * orchestration and offline-first design remain visible.
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { db, ready } = useSQLite()
  const { t } = useLanguage()
  const isConnected = useNetworkStatus()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [appReady, setAppReady] = useState(false)
  const [appDeviceId, setAppDeviceId] = useState('')
  const [initialSyncComplete, setInitialSyncComplete] = useState(false)

  const previousConnectedRef = useRef<boolean | null>(null)
  const stopPushRef = useRef<(() => void) | null>(null)


  /**
   * Restore local state and prepare the application.
   *
   * Existing installations can start from local data.
   * First installations require the minimum master data.
   */
  const initialize = useCallback(
    async (online: boolean) => {
      if (!ready || !db) return

      setLoading(true)

      try {
        // Restore an existing local session.
        const user = await getLoggedInUser(db)

        if (user) {
          setCurrentUser(user)
          setAppReady(true)
          return
        }

        // First install: check for required offline data.
        const hasData = await hasRequiredMasterData(db)

        if (!hasData) {
          if (!online) return

          await masterDataSyncService.sync(db)
          await setSetting(db, 'master_data_ready', '1')
        }

        setAppReady(true)
      } catch (error) {
        console.error('Application initialization failed:', error)
      } finally {
        setLoading(false)
      }
    },
    [db, ready],
  )


  /**
   * Initial bootstrap.
   *
   * Connectivity changes only matter while the application
   * is waiting to become ready.
   */
  useEffect(() => {
    if (!appReady) {
      void initialize(isConnected === true)
    }
  }, [appReady, isConnected, initialize])


  /**
   * Reconnect handling.
   *
   * Network recovery triggers background master-data synchronization
   * without blocking or restarting the application.
   */
  useEffect(() => {
    if (!db || !appReady || isConnected === null) return

    const wasConnected = previousConnectedRef.current
    previousConnectedRef.current = isConnected

    if (wasConnected === false && isConnected === true) {
      void masterDataSyncService.sync(db)
    }
  }, [db, appReady, isConnected])


  /**
   * Authenticated user synchronization lifecycle.
   *
   * The complete production sync implementation is intentionally hidden.
   */
  useEffect(() => {
    if (!db || !appReady || !currentUser || !appDeviceId) return

    const auth = {
      userId: currentUser.id,
      ownerId: currentUser.ownerId,
      appDeviceId,
    }

    // Pull remote changes into the local database.
    const stopPull = runPullEngine(
      db,
      auth,
      () => setInitialSyncComplete(true),
      markSyncReady,
    )

    // Push local changes in the background.
    const stopPush = pushBackgroundService(db, auth)
    stopPushRef.current = stopPush

    // Register device and notification synchronization.
    void initializeDevice(db, auth.userId, auth.ownerId, appDeviceId)
    startFcmTokenListener(db, auth.userId, auth.ownerId)

    const stopNotifications = registerNotificationEvents(
      db,
      auth.userId,
      auth.ownerId,
      currentUser.userName,
    )

    return () => {
      stopPull?.()
      stopPush?.()
      stopPushRef.current = null
      stopNotifications?.()
    }
  }, [db, appReady, currentUser, appDeviceId])


  /**
   * Application-ready services.
   *
   * Notifications and device data are initialized after
   * the application can already operate locally.
   */
  useEffect(() => {
    if (!db || !appReady) return

    getAppDeviceId()
      .then(setAppDeviceId)
      .catch(error => console.error('Device ID failed:', error))

    void initializeNotifications()

    void scheduleReminderNotifications(db, t)

    void getAllDevice(db)
  }, [db, appReady, t])


  /**
   * Reset synchronization readiness when the authenticated
   * user changes.
   */
  useEffect(() => {
    if (currentUser?.id) {
      resetSyncReadiness()
    }
  }, [currentUser?.id])


  const retryInit = useCallback(() => {
    if (!appReady) {
      void initialize(isConnected === true)
    }
  }, [appReady, initialize, isConnected])


  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        appReady,
        initialSyncComplete,
        retryInit,
      } as AuthContextType}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within AppBootstrapProvider',
    )
  }

  return context
}