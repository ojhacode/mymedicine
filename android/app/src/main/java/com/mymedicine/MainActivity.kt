package com.mymedicine

import android.app.KeyguardManager
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import io.invertase.notifee.NotifeeApiModule

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Must be set before super.onCreate() finishes attaching the window
    super.onCreate(null) // see note below re: savedInstanceState

    setShowWhenLocked(true)
    setTurnScreenOn(true)
    val keyguardManager = getSystemService(KEYGUARD_SERVICE) as KeyguardManager
    keyguardManager.requestDismissKeyguard(this, null)

    val notificationManager = getSystemService(NotificationManager::class.java)
    val canUseFullScreenIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        notificationManager.canUseFullScreenIntent()
    } else {
        true
    }
    if (!canUseFullScreenIntent) {
        // TODO: surface this to the user (banner/dialog) prompting them to enable it
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   *
   * Delegates to notifee so that when a notification (e.g. fullScreenAction / pressAction)
   * specifies a `mainComponent`, that component is rendered instead of the default app.
   * Falls back to "mymedicine" when there's no notifee-selected component.
   */
  override fun getMainComponentName(): String = NotifeeApiModule.getMainComponent("mymedicine")

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}