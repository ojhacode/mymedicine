import { usersPublicCollectionRef } from "@firebase/collections"
import { User } from "@react-native-firebase/auth"
import { doc, setDoc } from "@react-native-firebase/firestore"
import { hashEmail } from "@utils/hash"

export const ensurePublicUser = async (firebaseUser: User) => {
  if (!firebaseUser.email) return
  const email = firebaseUser.email.trim().toLowerCase()
  await setDoc(
    doc(usersPublicCollectionRef(), hashEmail(email)), {
      email,
      serverId: firebaseUser.uid,
      name: firebaseUser.displayName || '',
    },
    { merge: true }
  )
}