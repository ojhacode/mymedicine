import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Text, TouchableOpacity, View, Image, Platform, Linking} from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useLanguage } from "@context/LanguageContext"
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons/static'
import { useAuth } from "@context/AuthContext"
import LoadingScreen from "@components/LoadingScreen"
import { LoadingMiniButton } from "@components/LoadingButton"
import { LoginForm } from "@components/login_signup/Login"
import { ForgotPassword, ResetPassword } from "@components/login_signup/ForgotPassword"
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin'
import { useSQLite } from "@context/DatabaseContext"
import { SocialBtn } from "@components/login_signup/SocialButton"
import { BottomCard } from "@components/login_signup/BottomCard"
import { useNetworkStatus } from "@hooks/useNetworkStatus"
import Toast from "react-native-toast-message"
import { insertActivityLog } from "@db/repository/activity_log/insert"
import { GoogleDialog } from "@components/login_signup/GoogleDialog"
import { SQLiteDatabase } from "expo-sqlite"
import { confirmPasswordReset, getAuth, sendPasswordResetEmail, User, verifyPasswordResetCode } from "@react-native-firebase/auth"
import { enqueueSync } from "@db/sync/core/enqueue"
import { insertUser } from "@db/repository/user/insert"
import { languages } from "@utils/langugage"
import { LanguageModal } from "@components/modal/LanguageModal"
import MyModal from "@components/Modal"
import TandCModal from "@components/modal/TandCModal"
import PrivacyPolicyModal from "@components/modal/PrivacyPolicyModal"
import { AppTheme, DarkTheme, DefaultTheme } from "@utils/theme"
import { useTheme } from "@context/ThemeContext"
import FaqModal from "@components/modal/FaqModal"
import Contact from "@components/modal/ContactModal"
import { googleSignIn } from "@services/auth/google.signin"
import { facebookSignIn } from "@services/auth/facebook.signin"
import { appleSignIn } from "@services/auth/apple.signin"
import { emailSignUp } from "@services/account/email.signup"
import { emailSignIn } from "@services/auth/email.signin"
import { SignUpForm } from "@components/login_signup/SignUp"

const LogIn = () => {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<{SignIn: {mode: string}}, 'SignIn'>>()
  const {db} = useSQLite()
  const [miniLoading, setMiniLoading] = useState<boolean>(false)
  const {setCurrentUser, loading, appDeviceId, setGuestMode} = useAuth()
  const [mdlPrp, setMdlPrp] = useState<"NONE" | "ENTER" | "OTP" | "SIGNUP" | "LOGIN" | "FORGOT_PWD" | "RESET_PWD" | "GOOGLE_DIALOG" | "LANGUAGE" | "PRVCY_PLCY" | "TOR" | "FAQ" | "CONTACT" >("NONE")
  const {t, locale, setLocale} = useLanguage()
  const { theme } = useTheme()  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [rePassword, setRePassword] = useState("")
  const isConnected = useNetworkStatus()
  const [resetCode, setResetCode] = useState('')
  const mode = route.params?.mode
  const googleSigningInRef = useRef(false)
  const currentLang = useMemo(() => languages.find(l => l.key === locale) ?? languages[0], [locale])
  const [modal, setModal] = useState<boolean>(false)
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme
  const c: AppTheme['colors'] = navTheme.colors

  const passwordRules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }

  const performGoogleSignIn = async () => {
    if (googleSigningInRef.current) return
    googleSigningInRef.current = true
    setMiniLoading(true)
    try {
      if (appDeviceId === null) throw new Error(t('general.errors.deviceId'))
      if (!db) throw new Error(t('general.errors.dbInit'))
      const firebaseUser = await googleSignIn()
      const email = firebaseUser.email
      const serverId = firebaseUser.uid
      if (!email) throw new Error(t('auth.errors.invalidEmail'))
      if (!serverId) throw new Error(t('general.errors.serverIdIsNotProvided'))
      await signInCore(db, firebaseUser, 'google')

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${t('auth.signIn')} ${t('general.inSucc')}, ${t('general.welcome')} ${firebaseUser.displayName || firebaseUser.email}`,
      })
      if (mode === 'guest') navigation.goBack()

    } catch (err) {
      console.log(err)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('NETWORK_ERROR')) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `${t('general.errors.internet')}, ${t('general.please')} ${t('action.retry')}`,
        })
      } else if (
        isErrorWithCode(err) &&
        Object.values(statusCodes).includes(err.code)
      ) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            break

          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: t('auth.errors.playServicesAreNotAvailable'),
            })
            break

          default:
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: t('auth.errors.errorOccuredDuringSignIn'),
            })
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: t('general.errors.unknown'),
        })
      }
    } finally {
      googleSigningInRef.current = false
      setMiniLoading(false)
    }
  }

  const continueCurrentGoogleSession = async () => {
    const currentGoogleUser = GoogleSignin.getCurrentUser()
    if (!currentGoogleUser) {
      setMdlPrp('NONE')
      return
    }
    await performGoogleSignIn()
  }

  const signInCore = async (db: SQLiteDatabase, firebaseUsr: User,
    provider: 'google' | 'facebook' | 'apple' | 'Email'
  ) => {
    if (!firebaseUsr.email)
      throw new Error(t('auth.errors.invalidEmail'))

    const userId = await insertUser(
      db,
      firebaseUsr.email,
      firebaseUsr.uid,
      firebaseUsr.photoURL || '',
      firebaseUsr.displayName || ''
    )

    const logId = await insertActivityLog(
      db,
      2,
      userId,
      userId,
      { provider, device: Platform.OS }
    )

    await enqueueSync(db, 'users', userId, 'create', userId, userId)
    await enqueueSync(db, 'activity_logs', logId, 'create', userId, userId)

    setCurrentUser({
      id: userId,
      email: firebaseUsr.email,
      userServerId: firebaseUsr.uid,
      photoUrl: firebaseUsr.photoURL || '',
      userName: firebaseUsr.displayName || '',
      ownerId: userId,
      ownerServerId: firebaseUsr.uid,
      ownerName:firebaseUsr.displayName || '',
      ownerPhotoUrl:firebaseUsr.photoURL || '',     
      isLoggedIn: 1
    })
  }

  const signUpCore = async (db: SQLiteDatabase, firebaseUsr: User) => {
    if (!firebaseUsr.email)
      throw new Error(t('auth.errors.invalidEmail'))

    const userId = await insertUser(
      db,
      firebaseUsr.email,
      firebaseUsr.uid,
      firebaseUsr.photoURL || '',
      firebaseUsr.displayName || ''
    )

    const logId = await insertActivityLog(
      db,
      1,
      userId,
      userId,
      { provider:'password', device: Platform.OS }
    )

    await enqueueSync(db, 'users', userId, 'create', userId, userId)
    await enqueueSync(db, 'activity_logs', logId, 'create', userId, userId)
  }  

  const handleGoogle = async () => {
    if (googleSigningInRef.current) return
    const currentGoogleUser = GoogleSignin.getCurrentUser()
    if (currentGoogleUser !== null) {
      setMdlPrp('GOOGLE_DIALOG')
      setModal(true)
      return
    }
    await performGoogleSignIn()
  }

  const handleFacebook = async () => {
    try {
      if(!db)
        throw new Error(t('general.errors.dbInit'))      
      if(!isConnected)
        throw new Error(t('general.errors.internet'))
    
      // 1. Trigger Facebook Sign In
      const firebaseUser = await facebookSignIn()
      const email = firebaseUser.email
      const serverId = firebaseUser.uid

      if(!email)
        throw new Error(t('auth.errors.invalidEmail'))
      if(!serverId)
        throw new Error(t('general.errors.serverIdIsNotProvided'))

      await signInCore(db, firebaseUser, 'facebook')
      Toast.show({type:"success", text1:"Success", text2:`${t('auth.signIn')} ${t('general.inSucc')}, ${t('general.welcome')} ${firebaseUser.displayName || firebaseUser.email}`})      

    } catch (err:any) {
      // Silently ignore if the user simply closed the Facebook modal
      if (err.message?.includes('cancel')) return
      console.log(err)
      // err.message will now either be your t('general.errors.internet') OR the Facebook SDK error
      Toast.show({type: "error", text1: "Error", text2: err.message || t('general.errors.unknown')})
    } finally {
      setMiniLoading(false)
    }
  }

  const handleApple = async () => {
    setMiniLoading(true)
    try {
      if(appDeviceId === null)
        throw new Error(t('general.errors.deviceId'))
      if(!db)
        throw new Error(t('general.errors.dbInit'))
      if(!isConnected)
        throw new Error(t('general.errors.internet'))
    
      // 1. Trigger Apple Sign In
      const firebaseUser = await appleSignIn()
      
      // Note: Apple allows users to hide their email, but it generates a private relay email for them, so this check will still pass.
      const email = firebaseUser.email
      const serverId = firebaseUser.uid

      if(!email)
        throw new Error(t('auth.errors.invalidEmail'))
      if(!serverId)
        throw new Error(t('general.errors.serverIdIsNotProvided'))

      await signInCore(db, firebaseUser, 'apple')
      Toast.show({type:"success", text1:"Success", text2:`${t('auth.signIn')} ${t('general.inSucc')}, ${t('general.welcome')} ${firebaseUser.displayName || firebaseUser.email}`})     

    } catch (err:any) {
      // Silently ignore if the user simply closed the Apple modal
      // Note: Apple Auth error code 1001 is canceled.
      if (err.message?.includes('cancel') || err.message?.includes('1001') || err.code === 'ERR_CANCELED') return

      // Handle custom thrown errors (like general.errors.internet) or unknown SDK errors
      Toast.show({type: "error", text1: "Error", text2: err.message || t('general.errors.unknown')})
    } finally {
      setMiniLoading(false)
    }
  }  

  const signUpWithEmail = async (name: string, email: string, password: string, rePassword: string) => {
    try {
      if (appDeviceId === null)
        throw new Error(t('general.errors.deviceId'))
      if (!db)
        throw new Error(t('general.errors.dbInit'))      
      if (!isConnected)
        throw new Error(t('general.errors.internet'))      
      if (typeof name !== 'string' || !name.trim())
        throw new Error(t("auth.errors.fullNameIsRequired"))
      if (typeof email !== 'string' || !email.trim())
        throw new Error(t("auth.errors.emailIsRequired"))
      if (!password)
        throw new Error(t("auth.errors.passwordIsRequired"))
      if (password !== rePassword)
        throw new Error(t("auth.errors.passwordDoNotMatch"))
      if (password.length < 6)
        throw new Error(t("auth.errors.passwordLengthNotMatch"))
      setMiniLoading(true)
      const firebaseUser = await emailSignUp(name, email, password)
      const serverId = firebaseUser.uid

      if(!firebaseUser.email)
        throw new Error(t('auth.errors.emailIsRequired'))
      if(!serverId)
        throw new Error(t('general.errors.serverIdIsNotProvided'))

      await signUpCore(db, firebaseUser)
      setMdlPrp('LOGIN')
      Toast.show({type:"success", text1:"Success", text2:`${t('auth.signIn')} ${t('general.inSucc')}, ${t('general.welcome')} ${firebaseUser.displayName || firebaseUser.email}`})  

    } catch (e: any) {
      console.log(e)
        switch (e?.code) {
          case 'auth/invalid-credential':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.incorrectEmailOrPassword')})
            break
          case 'auth/wrong-password':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.passwordIsWrong')})
            break
          case 'auth/user-not-found':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.emailHasNotBeenRegisterd')})
            break
          case 'auth/invalid-email':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.invalidEmail')})
            break
          case 'auth/too-many-requests':
            Toast.show({type: "error", text1: "Error", text2: `${t('general.errors.manyAttempts')}, ${t('general.please')} ${t('action.retryLater')}`})
            break
          case 'auth/network-request-failed':
            Toast.show({type: "error", text1: "Error", text2: `${t('general.errors.internet')}, ${t('general.please')} ${t('general.checkYourInternet')}`})
            break
          default:
            Toast.show({type: "error", text1: "Error", text2: e?.message ?? t('general.errors.unknown')})
            return
        }
      return
    } finally {
      setMiniLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
       if (appDeviceId === null)
        throw new Error(t('general.errors.deviceId'))
      if (!db)
        throw new Error(t('general.errors.dbInit'))
      if(email==='')
        throw new Error(t('auth.errors.emailIsRequired'))
      if (typeof email !== 'string' || !email.trim())
        throw new Error(t('auth.errors.emailIsRequired'))
      if (!password?.trim())
        throw new Error(t('auth.errors.passwordIsRequired'))
      setMiniLoading(true)
      const firebaseUser = await emailSignIn(email.trim(), password)
      if (!firebaseUser.email)
        throw new Error('Email is not provided')
      console.log(firebaseUser)
      await signInCore(db, firebaseUser, 'Email')
      
      Toast.show({ type: "success", text1: "Success", text2: `${t('auth.signIn')} ${t('general.inSucc')}, ${t('general.welcome')} ${firebaseUser.email}` })
    } catch (e: any) {
      console.log(e)
        switch (e?.code) {
          case 'auth/invalid-credential':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.incorrectEmailOrPassword')})
            break
          case 'auth/wrong-password':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.passwordIsWrong')})
            break
          case 'auth/user-not-found':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.emailHasNotBeenRegisterd')})
            break
          case 'auth/invalid-email':
            Toast.show({type: "error", text1: "Error", text2: t('auth.errors.invalidEmail')})
            break
          case 'auth/too-many-requests':
            Toast.show({type: "error", text1: "Error", text2: `${t('general.errors.manyAttempts')}, ${t('general.please')} ${t('action.retryLater')}`})
            break
          case 'auth/network-request-failed':
            Toast.show({type: "error", text1: "Error", text2: `${t('general.errors.internet')}, ${t('general.please')} ${t('general.checkYourInternet')}`})
            break
          default:
            Toast.show({type: "error", text1: "Error", text2: e?.message ?? t('general.errors.unknown')})
            return
        }
      return
    } finally {
      setMiniLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setMiniLoading(true)
    try {
      if (!isConnected)
        throw new Error(t('general.errors.internet'))

      const cleanEmail = email?.trim()
      if (!cleanEmail)
        // You can use a translation key here if you have one, e.g., t('emailRequired')
        throw new Error(t('auth.errors.emailIsRequired'))
      
      const auth = getAuth()

      // 1. Trigger the reset email
      await sendPasswordResetEmail(auth, email)      

      // 2. Success Feedback
      Toast.show({ type: "success", text1: "Email Sent", text2: t('auth.passwordResetEmailSent') })

    } catch (err: any) {
      console.log("Forgot Password Error: ", err)

      // 3. Handle specific Firebase error codes
      if (err.code === 'auth/invalid-email')
        Toast.show({ type: "error", text1: "Error", text2: t('auth.errors.invalidEmail') })
      // Note: For security reasons, modern Firebase often suppresses 'user-not-found' 
      // to prevent email enumeration, but it's good practice to check for it anyway.
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        Toast.show({ type: "error", text1: "Error", text2: t('auth.errors.userNotFound') })
      } 
      else {
        // Fallback for manually thrown errors (like your network check) or unknown SDK errors
        Toast.show({ type: "error", text1: "Error", text2: err.message || t('general.errors.unknown') })
      }
    } finally {
      setMiniLoading(false)
    }
  }

// STEP 1: Invisibly Verify the Code from the URL
  const verifyCode = async (urlCode: string) => {
    setMiniLoading(true)
    try {
      if (!isConnected) throw new Error(t('general.errors.internet'))
      
      // Check with Firebase if the link's code is still valid
      const auth = getAuth() 
      // Returns the email address tied to the code if valid
      const userEmail = await verifyPasswordResetCode(auth, urlCode)
      
      // Success! The link is valid.
      if (userEmail) {
        setResetCode(urlCode)      // Save code for the final step
        setMdlPrp('RESET_PWD')
        setModal(true)
      }
    } catch (err: any) {
      console.log("Verify Code Error: ", err)
      // If the link expired while they were in their email
      if (err.code === 'auth/expired-action-code') {
        Toast.show({ type: "error", text1: "Error", text2: t('auth.errors.resetCodeExpired') })
      } else if (err.code === 'auth/invalid-action-code') {
        Toast.show({ type: "error", text1: "Error", text2: t('auth.errors.invalidResetCode')})
      } else {
        Toast.show({ type: "error", text1: "Error", text2: err.message || t('general.errors.unknown') })
      }
    } finally {
      setMiniLoading(false)
    }
  }

  // STEP 2: Submit New Password
  const resetPassword = async (newPassword: string, confirmPassword: string) => {
    setMiniLoading(true)
    try {
      if (!isConnected) throw new Error(t('general.errors.internet'))

      // Frontend Validation Check
      if (!newPassword || newPassword.length < 6)
        throw new Error("Password must be at least 6 characters")
      if (newPassword !== confirmPassword)
        throw new Error("Passwords do not match") // Catch typos immediately

      const auth = getAuth() 
      await confirmPasswordReset(auth, resetCode, newPassword)
            
      // Execute the final reset using the code we saved in Step 1
      
      Toast.show({ type: "success", text1: "Success", text2: `${t('auth.passwordResetSuccess')} ${t('auth.youCanNowLogIn')}`})
      setResetCode('')
      setMdlPrp('LOGIN')

    } catch (err: any) {
      console.log("Set Password Error: ", err)
      if (err.code === 'auth/weak-password') {
        Toast.show({ type: "error", text1: "Error", text2: t('auth.errors.weakPassword') })
      } else {
        Toast.show({ type: "error", text1: "Error", text2: err.message || t('general.errors.unknown') })
      }
    } finally {
      setMiniLoading(false)
    }
  }

  // If you are using React Navigation deep linking, you can extract it from route params:
  // const { oobCode, mode } = route.params || {};

  const clearCrntGglSession = async () => {
    try {
      await GoogleSignin.signOut()
      await handleGoogle()
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return
      if (url.includes('mode=resetPassword') && url.includes('oobCode=')) {
        const matches = url.match(/oobCode=([^&]+)/)
        const code = matches ? matches[1] : null
        if (code)
          // Triggers the verification process whether app was asleep or dead
          verifyCode(code)
      }
    }

    // Scenario A: Cold start (App was killed)
    Linking.getInitialURL().then((url) => {handleDeepLink(url)})

    // Scenario B: Warm start (App was asleep in background)
    const subscription = Linking.addEventListener('url', ({ url }) => {handleDeepLink(url)})

    return () => {
      subscription.remove()
    }
  }, [])

  return <LinearGradient 
    colors={['#F8B4B4', '#D94A4A', '#2AA9A0']}
    locations={[0, 0.6, 1]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="flex-1 items-center justify-center"
  >
    {(loading) ? <LoadingScreen bgColor="bg-transparent" /> :
      <View className="bg-white/95 rounded-3xl px-6 pt-5 pb-5 shadow-xl w-10/12">

        <View className="flex-row justify-end">
          <TouchableOpacity onPress={() => {setModal(true);setMdlPrp('LANGUAGE')} }
            className='flex-row items-center px-2 py-1.5 rounded-fullshadow-md shadow-black/10 elevation-3'
          >
            <Image source={currentLang.flag} className={`w-5 h-5 rounded-full`}/>
            <MaterialDesignIcons name="chevron-down" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        <View className="items-center mt-4 mb-7">
          <Image source={require("@asset/logo_small.png")} className="w-40 h-20" resizeMode="contain"/>
        </View>
        <Text className="text-center text-xs text-gray-400 tracking-widest uppercase mb-3">{t('auth.continueWith')}</Text>

        <View className="flex-row justify-center gap-x-4 mb-6">
          <SocialBtn onPress={handleGoogle} label="Continue with Google" disabled={miniLoading}>
            <MaterialDesignIcons name="google" size={24} color={miniLoading ? "#f5e7e5" : "#DB4437" } />
          </SocialBtn>

          <SocialBtn onPress={handleFacebook} label="Continue with Facebook" disabled={miniLoading}>
            <MaterialDesignIcons name="facebook" size={24} color={miniLoading ? "#f5e7e5" : "#1877F2"} />
          </SocialBtn>
    {/*
          <SocialBtn onPress={handleApple} label="Continue with Apple" disabled={miniLoading}>
            <MaterialDesignIcons name="apple" size={24} color="#000000" />
          </SocialBtn>
    */}          
          <SocialBtn 
            onPress={() => {setMdlPrp('LOGIN');setModal(true)}}
            label="Login with email" disabled={miniLoading}
          >
            <MaterialDesignIcons name="email" size={22} color={miniLoading ? "#f5e7e5" :"#6b7280"} />
          </SocialBtn>
        </View>
        
        {/* ---------------- Signup Section ---------------- */}
        <View className="items-center mb-8">
          <Text className="text-sm text-gray-400 mb-2">{t('auth.newHere')}</Text>
          <View className="flex-row justify-between items-center">
            <TouchableOpacity disabled={miniLoading} className="bg-gray-200 rounded-2xl p-2"
              onPress={() => {setMdlPrp('SIGNUP');setModal(true)}}>
              <Text className={`${miniLoading ? 'text-gray-400':'text-sky-600'} font-semibold`}>{t('auth.createAccount')}</Text>
            </TouchableOpacity>
            <Text className="mx-2 text-gray-400">||</Text>
            <TouchableOpacity disabled={miniLoading} className={`${miniLoading ?'bg-gray-300':'bg-blue-500'} rounded-2xl p-2`} onPress={() => setGuestMode(true)}>
              <Text className="text-gray-100 ">{t('auth.lookAroundFirst')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row space-x-3 mb-3">
          <BottomCard icon="shield-account-outline" label={t("general.privacy")} onPress={() => {setMdlPrp('PRVCY_PLCY');setModal(true)}} color="#16a34a"/>
          <BottomCard icon="file-document-edit-outline" label={t("section.trmsAndCndt")} onPress={() => {setMdlPrp('TOR');setModal(true)}} color="#ca8a04"/>
          <BottomCard icon="frequently-asked-questions" label={t("section.faq")} onPress={() => {setMdlPrp('FAQ');setModal(true)}}color="#475569"/>
          <BottomCard icon="chat-question-outline" label={t("section.support")} onPress={() => {setModal(true);setMdlPrp('CONTACT')}} color="#7c3aed"/>
        </View>

      {miniLoading && <LoadingMiniButton />}

      </View>
    }

    {modal &&
      <>
        {mdlPrp==='LANGUAGE' && 
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            width={56}
            content={
              <LanguageModal setModal={setModal} locale={locale} setLocale={setLocale} size={5}/>
            }
          />
        }

        {mdlPrp==="SIGNUP" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            content={
              <SignUpForm
                name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} rePassword={rePassword} setRePassword={setRePassword} showPassword={showPassword} setShowPassword={setShowPassword} setMdlPrp={setMdlPrp} signUpWithEmail={()=>signUpWithEmail(name,email,password,rePassword)} miniLoading={miniLoading} rules={passwordRules}
              />
            }
          />
        }

        {mdlPrp==="LOGIN" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            content={
              <LoginForm
                email={email} setEmail={setEmail} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} setMdlPrp={setMdlPrp} signInWithEmail={()=>signInWithEmail(email, password)} miniLoading={miniLoading}
              />
            }
          />
        }

        {mdlPrp==="GOOGLE_DIALOG" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            content={
              <GoogleDialog
                user={GoogleSignin.getCurrentUser()} loading={miniLoading} clearCrntGglSession={clearCrntGglSession} continueCrntGglSession={continueCurrentGoogleSession} t={t}
              />
            }
          />
        }

        {mdlPrp==="RESET_PWD" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            content={
              <ResetPassword 
                password={password} setPassword={setPassword} rePassword={rePassword} setRePassword={setRePassword} showPassword={showPassword} setShowPassword={setShowPassword} miniLoading={miniLoading} handleConfirmReset={()=>resetPassword(password, rePassword)}
              />
            }
          />
        }

        {mdlPrp==="TOR" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            height={90}
            content={<TandCModal title={t('section.termsAndCondition')} lastUpdtDate={t('general.lastUpdtDate')} locale={locale} />}
          />
        }

        {mdlPrp==="PRVCY_PLCY" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            height={90}
            content={<PrivacyPolicyModal title={`${t('general.privacy')} ${t('section.policy')}`} lastUpdtDate={t('general.lastUpdtDate')} locale={locale} />}
          />
        }

        {mdlPrp==="FAQ" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            height={90}
            content={<FaqModal t={t} />}
          />
        }

        {mdlPrp==="CONTACT" &&
          <MyModal
            c={c}
            onClose={() => setModal(false)}
            content={<Contact t={t} c={c} />}
          />
        }

      </>
    }

    {
      /* 
        <ForgotPassword email={email} setEmail={setEmail} miniLoading={miniLoading} handleConfirmReset={()=>forgotPassword(email)}/> 
      */
    }

  </LinearGradient>
}
export default LogIn