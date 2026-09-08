import { getFunctions, httpsCallable } from '@react-native-firebase/functions'

/**
 * Requests account deletion through a Firebase Callable Function.
 *
 * The actual deletion logic is handled securely on the backend,
 * keeping destructive account operations outside the client.
 */
export const deleteAccount = async () => {
  const functions = getFunctions()
  const deleteAccountFn = httpsCallable(functions, 'deleteAccount')

  await deleteAccountFn()
}