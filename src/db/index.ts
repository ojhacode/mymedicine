import { SQLiteDatabase } from "expo-sqlite"
import { createGenericTable } from "@db/schema/medicine/generic"
import { createBrandTable } from "@db/schema/medicine/brand"
import { createBrandMarketTable } from "@db/schema/medicine/brand_market"
import { createSymptomTable } from "@db/schema/medicine/symptom"
import { createSymptomGenericTable } from "@db/schema/medicine/symptom_generic"
import { createAppSettingsTable } from "@db/schema/app/appSetting"
import { createRemTable } from "@db/schema/reminder/rem"
import { createRemOccrncsTable } from "@db/schema/reminder/remOccrnc"
import { createRemEventTable } from "@db/schema/reminder/remEvent"
import { createRemSyncConflictsTable } from "@db/schema/reminder/remSyncConflict"
import { createLogCatTable } from "@db/schema/log/cat"
import { createLogEventTable } from "@db/schema/log/event"
import { createActivityLogsTable } from "@db/schema/activity_logs/activityLog"
import { createActivityLogsMetaTable } from "@db/schema/activity_logs/activityLogsMeta"
import { createSyncQueueTable } from "@db/schema/sync/queue"
import { createSyncMetaTable } from "@db/schema/sync/meta"
import { createUsersTable } from "@db/schema/users/user"
import { createIndexes } from "@db/schema/indexes"
import { createBrandFormTable } from "./medicine/brand_form"
import { createBrandStrengthTable } from "./medicine/brand_strength"
import { createSymptomAliasTable } from "./medicine/symptom_alias"
import { createFamilyInvitesTable } from "./family/familyInvite"
import { createFamilyMembersTable } from "./family/familyMember"
import { createSettingsTable } from "./setting/setting"
import { createNotificationsTable } from "./notification/notification"
import { createDevicesTable } from "./app/devices"
import { createRemOccrncsNotificationTable } from "./reminder/remOccurrenceNotification"

export const createTables = async (db: SQLiteDatabase) => {

  // App
  await createDevicesTable(db)
  await createAppSettingsTable(db)
  await createSettingsTable(db)
  // Core
  await createUsersTable(db)
  // Medicine
  await createGenericTable(db)
  await createBrandTable(db)
  await createBrandMarketTable(db)
  await createBrandFormTable(db)
  await createBrandStrengthTable(db)
  await createSymptomTable(db)
  await createSymptomGenericTable(db)
  await createSymptomAliasTable(db)

  // Family
  await createFamilyInvitesTable(db)
  await createFamilyMembersTable(db)

  // Reminder
  await createRemTable(db)
  await createRemOccrncsTable(db)
  await createRemEventTable(db)
  await createRemOccrncsNotificationTable(db)
  await createRemSyncConflictsTable(db)

  // Logs
  await createLogCatTable(db)
  await createLogEventTable(db)

  // Activity
  await createActivityLogsTable(db)
  await createActivityLogsMetaTable(db)

  // Sync
  await createSyncMetaTable(db)
  await createSyncQueueTable(db)

  //notifications
  await createNotificationsTable(db)

  // Indexes
  await createIndexes(db)
}