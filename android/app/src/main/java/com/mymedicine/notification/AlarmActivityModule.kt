package com.mymedicine.notification

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmActivityModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AlarmActivity"

    @ReactMethod
    fun finishActivity() {
        AlarmActivity.instance?.runOnUiThread {
            AlarmActivity.instance?.finish()
        }
    }
}