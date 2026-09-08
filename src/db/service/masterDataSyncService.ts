import { SQLiteDatabase } from "expo-sqlite"
import { manifestService } from "@firebase/service/manifestService"
import { moduleRegistry } from "@db/registery/moduleRegistry"
import { moduleSyncService } from "./moduleSyncService"

class MasterDataSyncService {
    async sync(db: SQLiteDatabase): Promise<boolean> {
        const manifest = await manifestService.download()
        let updated = false
        for (const key of Object.keys(moduleRegistry) as (keyof typeof moduleRegistry)[]) {
            updated = await moduleSyncService.sync(db, manifest.modules[key], moduleRegistry[key]) || updated
        }
        return updated
    }
}

export const masterDataSyncService = new MasterDataSyncService()