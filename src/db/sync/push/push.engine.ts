import { SQLiteDatabase } from "expo-sqlite"
import { pushToFirebase } from "./pushToFirebase"
import '@db/sync/push/handlers'
import { getPendingSyncItems } from "@db/repository/queue/fetch"
import { removeFromQueue } from "@db/repository/queue/delete"
import { markQueueFailed } from "@db/repository/queue/update"
import { authCredentials } from "@type/context/auth"

/**
 * Processes the local sync queue in batches and pushes pending
 * operations to Firebase.
 *
 * Successful operations are removed from the queue, while failed
 * operations are marked for retry/error tracking.
 *
 * The engine continuously checks the lifecycle cancellation state
 * so an in-flight sync can stop safely during logout, shutdown,
 * or provider cleanup.
 */
export const runPushEngine = async (
  db: SQLiteDatabase,
  auth: authCredentials,
  isStopped: () => boolean
) => {
  while (!isStopped()) {
    if (isStopped()) return

    const items = await getPendingSyncItems(db, auth.ownerId, 20)

    if (!items.length) break

    try {
      const { successIds, failedIds } =
        await pushToFirebase(db, items, auth, isStopped)

      if (isStopped()) return

      if (successIds.length)
        await removeFromQueue(db, successIds)

      if (isStopped()) return

      if (failedIds.length)
        await markQueueFailed(db, failedIds, "Push_Failed")

      if (isStopped()) return

      // Give JS/UI thread some breathing room between batches.
      await new Promise<void>(resolve =>
        setTimeout(resolve, 100)
      )

    } catch (e) {
      if (isStopped()) return

      console.log("[PushEngine] Run failed:", e)
      throw e
    }
  }
}