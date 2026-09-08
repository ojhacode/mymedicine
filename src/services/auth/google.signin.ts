import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { getAuth, signInWithCredential, GoogleAuthProvider, getIdToken} from '@react-native-firebase/auth'
import { saveFirebaseUser } from "@services/users/user.service"


export const googleSignIn = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  const response: any = await GoogleSignin.signIn()

  if (!isSuccessResponse(response))
    throw new Error('GOOGLE_SIGN_IN_FAILED')

  const { idToken } = response.data

  // Get the OAuth access token
  const { accessToken } = await GoogleSignin.getTokens()

  const auth = getAuth() // Get the auth instance modularly

  // 1. Create the credential using the direct export (Fixes your specific warning)
  const googleCredential = GoogleAuthProvider.credential(idToken, accessToken)

  // 2. Sign in using the modular function
  const firebaseUserCredential = await signInWithCredential(auth, googleCredential)
  const firebaseUser = firebaseUserCredential.user

  // 3. Modular version of getIdToken
  await getIdToken(firebaseUser, true)
  if (!firebaseUser.uid)
    throw new Error('Firebase user is null')

  // Save user profile to Firestore (Assuming userRef handles the modular firestore migration)
  return saveFirebaseUser(
    firebaseUser,
    firebaseUser.providerData[0]?.providerId || 'Google'
  )
}