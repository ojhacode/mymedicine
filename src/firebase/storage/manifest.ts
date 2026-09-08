// firebase/storage/manifest.ts

import { getStorage, ref } from "@react-native-firebase/storage"
export const manifestRef = () => ref(getStorage(), "manifest.json")