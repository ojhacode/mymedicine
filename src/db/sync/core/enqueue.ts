import { SQLiteDatabase } from "expo-sqlite"
import { existingEnqueueSync } from "./_interface"
import { QueueTable } from "@type/queue"

/**
 * Adds a local database operation to the sync queue.
 *
 * Before inserting a new operation, existing pending operations
 * for the same record are compacted where possible.
 *
 * Examples:
 *   create + delete → remove queue entry
 *   update + delete → replace with delete
 *   create + update → ignore update
 *   update + update → keep one update
 *   delete + anything → keep delete
 *
 * This reduces redundant remote operations and keeps the queue
 * efficient when multiple local changes happen before synchronization.
 */
export const enqueueSync = async (
  db: SQLiteDatabase,
  tableName: QueueTable,
  rowId: number,
  action: 'create' | 'update' | 'delete',
  userId: number,
  ownerId: number
) => {
  const existing = await db.getFirstAsync<existingEnqueueSync>(
    `SELECT id, action
     FROM sync_queue
     WHERE ownerId = ?
       AND tableName = ?
       AND rowId = ?
     ORDER BY createdAtLocal DESC
     LIMIT 1`,
    [ownerId, tableName, rowId]
  )

  // 🧠 COMPACTION LOGIC
  if (existing) {
    const prev = existing.action

    // 🔴 create + delete → remove both
    if (prev === 'create' && action === 'delete') {
      await db.runAsync(
        `DELETE FROM sync_queue WHERE id = ?`,
        [existing.id]
      )
      return
    }

    // 🔴 update + delete → replace with delete
    if (prev === 'update' && action === 'delete') {
      await db.runAsync(
        `UPDATE sync_queue
         SET action = ?,
             createdAtLocal = ?,
             attempts = 0,
             lastError = NULL,
             nextRetryAt = NULL
         WHERE id = ?`,
        ['delete', Date.now(), existing.id]
      )
      return
    }

    // 🟡 create + create → ignore
    if (prev === 'create' && action === 'create')
      return

    // 🟡 create + update → ignore
    if (prev === 'create' && action === 'update')
      return

    // 🟢 update + update → keep one update
    if (prev === 'update' && action === 'update') {
      await db.runAsync(
        `UPDATE sync_queue
         SET createdAtLocal = ?,
             attempts = 0,
             lastError = NULL,
             nextRetryAt = NULL
         WHERE id = ?`,
        [Date.now(), existing.id]
      )
      return
    }

    // 🟢 delete stays delete
    if (prev === 'delete')
      return
  }

  // ✅ DEFAULT → insert new operation
  await db.runAsync(
    `INSERT OR IGNORE INTO sync_queue
      (tableName, rowId, action, createdAtLocal, userId, ownerId)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tableName, rowId, action, Date.now(), userId, ownerId]
  )
}