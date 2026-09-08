import { SQLiteDatabase } from 'expo-sqlite'
import { startCredentialListeners } from './handlers/credential.pull'
import { fetchRemoteRems } from '@pull/handlers/reminders/fetch'
import { pullReminders } from '@pull/executors/reminder.pull'
import { getSyncTimestamp } from '@db/repository/meta/fetch'
import { pullActivityLogs } from './executors/activity_log.pull'
import { fetchRemoteActivities } from './handlers/activity/fetch'
import { authCredentials } from '@type/context/auth'
import { pullFamilyMembers } from './executors/family_member.pull'
import { fetchRemoteFamilyMember } from './handlers/family_members/fetch'
import { pullFamilyInvites } from './executors/family_invites.pull'
import { fetchRemoteFamilyInvite } from './handlers/family_invites/fetch'
import { createPullContext } from '../core/pull.context'
import { pullSettings } from './executors/setting.pull'
import { fetchRemoteSettings } from './handlers/setting/fetch'
import { FamilyInvitesForPull, FamilyMembersForPull } from '@type/family'
import { ensureUsersByServerIds } from '../core/ensure/users.ensure'
import { fetchRemoteNotifications } from './handlers/notification/fetch'
import { pullNotification } from './executors/notification.pull'
import { SyncDomain } from '../core/syncReadiness'

/**
 * Extracts every user referenced by family members and invitations.
 *
 * These users are ensured locally before dependent family data
 * is written to SQLite.
 */
export const extractUserServerIds = (
  members: FamilyMembersForPull[],
  invites: FamilyInvitesForPull[]
): string[] => {
  // Collect owner/member IDs from relationships and
  // sender/receiver IDs from invitations.
  //
  // A Set prevents duplicate users from being processed.

  const ids = new Set<string>()

  for (const member of members) {
    ids.add(member.ownerServerId)
    ids.add(member.memberServerId)
  }

  for (const invite of invites) {
    ids.add(invite.senderServerId)
    ids.add(invite.receiverServerId)
  }

  return [...ids]
}

/**
 * Pull Engine
 *
 * Coordinates the complete remote → local synchronization flow.
 *
 * Responsibilities:
 * - Create a pull context for the current authenticated user
 * - Resume from the last successful sync timestamp
 * - Pull independent domains in a controlled order
 * - Handle cursor-based pagination
 * - Mark individual domains ready as soon as their first usable
 *   page has been persisted
 * - Support cancellation during an in-flight sync sequence
 * - Start realtime listeners only after initial pull completes
 * - Clean up listeners when the engine is disposed
 */
export const runPullEngine = (
  db: SQLiteDatabase,
  auth: authCredentials,
  onInitialSyncComplete: () => void,
  onDomainSyncComplete: (domain: SyncDomain) => void,
) => {
  //----------------------------------------
  // Lifecycle / Cancellation
  //----------------------------------------

  let disposed = false
  let stopUser: (() => void) | null = null

  const isStopped = () => disposed

  //----------------------------------------
  // Initial Remote Pull
  //----------------------------------------

  const sync = async () => {
    try {
      // Build shared pull context and recover the last sync timestamp.
      // Every subsequent pull uses this timestamp as its incremental
      // synchronization boundary.

      const pullCtx = await createPullContext(db, auth)
      if (isStopped()) return

      const lastSyncTime = await getSyncTimestamp(
        db,
        auth.ownerId,
        'SYNC_KEY'
      )
      if (isStopped()) return

      //--------------------------------------
      // Family References
      //--------------------------------------

      // Fetch family members and invitations first because they expose
      // user IDs that may be required by dependent local records.

      const member = await fetchRemoteFamilyMember(
        auth.userServerId,
        lastSyncTime
      )
      if (isStopped()) return

      const invites = await fetchRemoteFamilyInvite(
        auth.userServerId,
        lastSyncTime
      )
      if (isStopped()) return

      //--------------------------------------
      // Users
      //--------------------------------------

      // Ensure all referenced users exist locally before pulling
      // family-related records.

      await ensureUsersByServerIds(
        pullCtx,
        extractUserServerIds(member, invites)
      )
      if (isStopped()) return

      //--------------------------------------
      // Notifications
      //--------------------------------------

      // Pull notification data and immediately mark the domain ready
      // once its local representation has been persisted.

      const notification = await fetchRemoteNotifications(
        auth.userServerId,
        lastSyncTime
      )
      if (isStopped()) return

      await pullNotification(pullCtx, notification)
      if (isStopped()) return

      onDomainSyncComplete('notifications')

      //--------------------------------------
      // Reminders + Occurrences + Events
      //--------------------------------------

      // Reminders use cursor-based pagination.
      //
      // Only the first successfully persisted page is required to make
      // the reminder domain usable by the UI. Remaining pages continue
      // loading in the background.

      let reminderCursor: any = undefined
      let hasMoreReminders = true
      let remindersReady = false

      while (hasMoreReminders && !isStopped()) {
        const page = await fetchRemoteRems(
          auth.ownerServerId,
          lastSyncTime,
          reminderCursor
        )
        if (isStopped()) return

        await pullReminders({
          pullCtx,
          remoteReminders: page.items,
          options: { invalidate: false },
        })
        if (isStopped()) return

        if (!remindersReady) {
          remindersReady = true
          onDomainSyncComplete('reminders')
        }

        reminderCursor = page.nextCursor
        hasMoreReminders = page.hasMore
      }

      if (isStopped()) return

      //--------------------------------------
      // Activity Logs
      //--------------------------------------

      // Activity logs follow the same paginated pull pattern.
      // The first persisted page is enough to unblock the dependent UI.

      let activityLogCursor: any = undefined
      let hasMoreActivityLogs = true
      let activityLogsReady = false

      while (hasMoreActivityLogs && !isStopped()) {
        const page = await fetchRemoteActivities(
          auth.ownerServerId,
          lastSyncTime,
          activityLogCursor
        )
        if (isStopped()) return

        await pullActivityLogs({
          pullCtx,
          remoteActivityLogs: page.items,
          options: { invalidate: false },
        })
        if (isStopped()) return

        if (!activityLogsReady) {
          activityLogsReady = true
          onDomainSyncComplete('activity_logs')
        }

        activityLogCursor = page.nextCursor
        hasMoreActivityLogs = page.hasMore
      }

      if (isStopped()) return

      //--------------------------------------
      // Family Members
      //--------------------------------------

      await pullFamilyMembers(pullCtx, member)
      if (isStopped()) return

      onDomainSyncComplete('family_members')

      //--------------------------------------
      // Family Invitations
      //--------------------------------------

      await pullFamilyInvites(pullCtx, invites)
      if (isStopped()) return

      onDomainSyncComplete('family_invites')

      //--------------------------------------
      // Settings
      //--------------------------------------

      const settings = await fetchRemoteSettings(
        auth.ownerServerId,
        lastSyncTime
      )
      if (isStopped()) return

      await pullSettings(pullCtx, settings)
      if (isStopped()) return

      onDomainSyncComplete('settings')

      //--------------------------------------
      // Initial Remote Pull COMPLETE
      //--------------------------------------

      // At this point all required initial domains have completed
      // their pull operations.
      //
      // The application can now transition from initialization
      // into its normal synchronized state.

      onInitialSyncComplete?.()

      //--------------------------------------
      // Realtime Listeners
      //--------------------------------------

      // Realtime listeners are deliberately started only after the
      // initial remote snapshot has been persisted.
      //
      // This prevents realtime events from racing with initialization.

      try {
        stopUser = startCredentialListeners(pullCtx)
      } catch (error) {
        console.log(
          '[PullEngine] Failed to start credential listeners:',
          error
        )
      }

    } catch (error) {
      console.log('[PullEngine] Pull failed:', error)
    }
  }

  void sync()

  //----------------------------------------
  // Cleanup
  //----------------------------------------

  return () => {
    // Mark the engine as disposed so every await boundary can stop
    // the remaining synchronization pipeline.
    //
    // Also remove any realtime listeners that were already registered.

    disposed = true

    stopUser?.()
    stopUser = null
  }
}