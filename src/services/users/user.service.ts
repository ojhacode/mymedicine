import { userDocRef } from "@firebase/collections"
import { ensurePublicUser } from "./user.public.service"
import { setDoc } from "@react-native-firebase/firestore"
import { User } from "@react-native-firebase/auth"

export const saveFirebaseUser = async (firebaseUser: User, providerId: string) => {
  await setDoc(
    userDocRef(firebaseUser.uid),
    {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      userName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      lastSignInTime: new Date().toISOString(),
      providerId
    }, { merge: true }
  )
  await ensurePublicUser(firebaseUser)
  return firebaseUser
}