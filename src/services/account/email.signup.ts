import { userDocRef } from "@firebase/collections"
import { createUserWithEmailAndPassword, getAuth, getIdToken, updateProfile} from '@react-native-firebase/auth'
import { setDoc } from "@react-native-firebase/firestore"

export const emailSignUp = async (userName:string, email: string, password: string) => {
  try {
    const auth = getAuth() 
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = credential.user

    // Fetch the token modularly to stay fully authenticated
    await getIdToken(firebaseUser, true)
    if (!firebaseUser.uid)
      throw new Error('Firebase user is null')

    await updateProfile(firebaseUser, {
      displayName: userName,
    })    

    // Save user profile structure to Firestore to match social signs
      await setDoc(
        userDocRef(firebaseUser.uid), // The DocumentReference goes here as the first argument
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          userName,
          photoURL: firebaseUser.photoURL,
          lastSignInTime: new Date().toISOString(),
          providerId: 'password' // Firebase standard string for email credentials
    }, { merge: true })
    return firebaseUser
  } catch (err: any) {
    throw err
  }
}