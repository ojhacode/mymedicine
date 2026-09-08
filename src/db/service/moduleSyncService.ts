import { SQLiteDatabase } from "expo-sqlite"
import { ModuleManifest } from "@type/manifest"
import { Registry } from "@type/registery"
import { getSettingNumber, setSetting } from "@db/repository/app_setting.ts"

class ModuleSyncService {
    async sync(db: SQLiteDatabase, manifest: ModuleManifest, registry: Registry): Promise<boolean> {
        let updated = false
        for (const [tableName, table] of Object.entries(registry)) {
            const manifestTable = manifest.tables[tableName]
            if (!manifestTable) continue

            const localVersion = await getSettingNumber(db, table.setting)
            if (localVersion >= manifestTable.version) continue

            // Download outside transaction
            const rows = await table.download()

            // Only DB operations inside transaction
            await db.withTransactionAsync(async () => {
                await table.clear(db)
                await table.insert(db, rows)
                await setSetting(db, table.setting, String(manifestTable.version))
            })
            updated = true
        }
        return updated
    }
}
export const moduleSyncService = new ModuleSyncService()