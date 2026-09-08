import { reminderCollectionRef } from "@firebase/collections"
import { pullReminders } from "@pull/executors/reminder.pull"
import { createBufferedListener } from "@db/sync/core/bufferedListener"
import { ReminderForPull } from "@type/reminder"
import { PullContext } from "@type/pull"
import { deleteRemindersByServerIds } from "@db/repository/reminder/delete"

/**
 * Registers the realtime listener for reminder changes.
 *
 * Initial data is handled by the pull engine, so the listener skips
 * the initial Firestore snapshot and only processes subsequent changes.
 *
 * Changes originating from the current device are ignored because
 * they have already been persisted locally by the originating operation.
 *
 * Incoming changes are buffered and then applied to SQLite as either
 * upserts or deletes.
 */
export const registerReminderListener = (pullCtx: PullContext) =>
  createBufferedListener<ReminderForPull>(pullCtx.db, {
    collectionRef: () =>
      reminderCollectionRef(pullCtx.auth.ownerServerId),

    // Initial data is already handled by the pull engine.
    skipInitial: true,

    // Ignore changes originating from this device.
    shouldSkip: raw =>
      raw?.lastModifiedDevice === pullCtx.auth.appDeviceId,

    // Apply buffered remote changes to the local SQLite database.
    onFlush: async (upserts, deletes) => {

      if (upserts.length)
        await pullReminders({
          pullCtx,
          remoteReminders: upserts
        })

      if (deletes.length)
        await deleteRemindersByServerIds(
          pullCtx.db,
          deletes
        )
    }
  }, 'reminders')