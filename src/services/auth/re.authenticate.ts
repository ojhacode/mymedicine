import { FacebookAuthProvider, getAuth, GoogleAuthProvider, reauthenticateWithCredential } from "@react-native-firebase/auth"
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin"
import { AccessToken, LoginManager } from "react-native-fbsdk-next"

export const reauthenticateCurrentUser = async () => {
    const auth = getAuth()
    const firebaseUser = auth.currentUser

    if (!firebaseUser)
        throw new Error('FIREBASE_USER_NOT_FOUND')

    const providerId = firebaseUser.providerData[0]?.providerId

    // ---------------- Google ----------------

    if (providerId === 'google.com') {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true})

    const response: any = await GoogleSignin.signIn()

    if (!isSuccessResponse(response))
        throw new Error('GOOGLE_REAUTH_FAILED')

    const {idToken} = response.data
    const {accessToken} = await GoogleSignin.getTokens()
    const credential = GoogleAuthProvider.credential(idToken, accessToken)
    await reauthenticateWithCredential(firebaseUser, credential)
    return
  }

  // ---------------- Facebook ----------------

  if (providerId === 'facebook.com') {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email'])
    if (result.isCancelled)
      throw new Error('FACEBOOK_REAUTH_CANCELLED')
    const data = await AccessToken.getCurrentAccessToken()
    if (!data)
      throw new Error('FACEBOOK_REAUTH_FAILED')
    const credential = FacebookAuthProvider.credential(data.accessToken)
    await reauthenticateWithCredential(firebaseUser, credential)
    return
  }
  throw new Error('UNSUPPORTED_AUTH_PROVIDER')
}