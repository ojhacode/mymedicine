import { SQLiteDatabase } from 'expo-sqlite'

export type Migration = {
  id: number
  statements: string[]
}

const migrations: Migration[] = [
  {
    id: 1,
    statements: [],
  },
]

export const CURRENT_SCHEMA_VERSION =
  migrations.length > 0
    ? Math.max(...migrations.map(m => m.id))
    : 0

const tableExists = async (
  db: SQLiteDatabase,
  name: string
): Promise<boolean> => {
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name = ?`,
    [name]
  )

  return !!row
}

const LEGACY_MARKER_TABLES = [
  'users',
  'devices',
  'rem',
  'brand',
  'sync_queue',
]

export const isLegacyUnversionedDb = async (
  db: SQLiteDatabase
): Promise<boolean> => {
  for (const table of LEGACY_MARKER_TABLES) {
    if (await tableExists(db, table)) {
      return true
    }
  }

  return false
}

export const runMigrations = async (
  db: SQLiteDatabase,
  fromVersion: number
) => {
  const pending = migrations
    .filter(m => m.id > fromVersion)
    .sort((a, b) => a.id - b.id)

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement)
      }
    })

    await db.execAsync(
      `PRAGMA user_version = ${migration.id}`
    )
  }
}