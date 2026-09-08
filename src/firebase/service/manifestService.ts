// firebase/service/manifestService.ts

import { getDownloadURL } from "@react-native-firebase/storage"
import { manifestRef } from "../storage/manifest"
import { Manifest } from "@type/manifest"

/**
 * Provides access to the remotely hosted application manifest.
 *
 * The manifest is stored in Firebase Storage and downloaded as JSON,
 * allowing the application to retrieve remote configuration/metadata
 * without coupling consumers directly to Firebase Storage APIs.
 */
class ManifestService {
  download = async (): Promise<Manifest> => {
    // Resolve the Firebase Storage file URL and download the manifest.
    const url = await getDownloadURL(manifestRef())

    const response = await fetch(url)

    if (!response.ok)
      throw new Error("Unable to download manifest.json")

    return await response.json()
  }
}

export const manifestService = new ManifestService()