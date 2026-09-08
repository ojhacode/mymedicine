package com.mymedicine.speech

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), RecognitionListener, ActivityEventListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val SPEECH_REQUEST_CODE = 100
    private var isUsingPopupFallback = false

    private var isEngineReady = false
    private var bootTimeoutRunnable: Runnable? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "SpeechModule"

    @ReactMethod
    fun startSpeech(language: String) {
        mainHandler.post {
            isUsingPopupFallback = false
            isEngineReady = false
            
            bootTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }

            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                emitDebug("⚠️ Background recognition unavailable. Forcing Popup Intent...")
                launchPopupIntent(language)
                return@post
            }

            try {
                speechRecognizer?.cancel()

                if (speechRecognizer == null) {
                    val googleComponent = ComponentName(
                        "com.google.android.googlequicksearchbox",
                        "com.google.android.voicesearch.recognizer.VoiceRecognitionService"
                    )
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext.applicationContext, googleComponent)
                    speechRecognizer?.setRecognitionListener(this)
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactContext.packageName)
                }

                emitDebug("🚀 [KOTLIN] Booting hardware engine...")
                speechRecognizer?.startListening(intent)

                bootTimeoutRunnable = Runnable {
                    if (!isEngineReady && !isUsingPopupFallback) {
                        emitDebug("⚠️ OS silently ignored background mic (Tecno/Go behavior). Deploying Popup...")
                        speechRecognizer?.cancel()
                        launchPopupIntent(language)
                    }
                }
                mainHandler.postDelayed(bootTimeoutRunnable!!, 1500)

            } catch (e: Exception) {
                emitDebug("💥 Background Engine failed: ${e.message}. Deploying Popup...")
                launchPopupIntent(language)
            }
        }
    }

    private fun launchPopupIntent(language: String) {
        isUsingPopupFallback = true
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "भन्नुहोस् (Listening...)")
        }
        
        // FIX: Explicitly referencing the reactContext to get the current activity
        val activity = reactContext.currentActivity
        if (activity != null) {
            activity.startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } else {
            emitError("Unable to open mic: Native Activity is null")
        }
    }

    @ReactMethod
    fun stopSpeech() {
        mainHandler.post {
            if (!isUsingPopupFallback) {
                try {
                    speechRecognizer?.stopListening()
                    speechRecognizer?.cancel()
                    emitDebug("Cleanly stopped ambient background session")
                } catch (_: Exception) {}
            }
        }
    }

    // FIX: Removed the '?' from Activity to match modern React Native signatures
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SPEECH_REQUEST_CODE && isUsingPopupFallback) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                val text = matches?.firstOrNull().orEmpty()
                if (text.isNotEmpty()) {
                    emitDebug("🎯 [POPUP SUCCESS]: $text")
                    sendSpeechResult(text)
                }
            } else {
                emitDebug("🛑 [POPUP] Closed by user or silent timeout.")
                emitError("Speech cancelled or timed out.")
            }
        }
    }

    override fun onReadyForSpeech(params: Bundle?) {
        isEngineReady = true
        emitDebug("🎙️ [BACKGROUND] Mic active!")
    }
    
    override fun onBeginningOfSpeech() = emitDebug("🗣️ [BACKGROUND] User talking...")
    override fun onEndOfSpeech() = emitDebug("🛑 [BACKGROUND] Processing...")
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    override fun onError(error: Int) {
        if (error == SpeechRecognizer.ERROR_CLIENT || error == 5 || error == 9) { 
            emitDebug("❌ Background engine rejected request (Code $error). Deploying Popup...")
            mainHandler.post { launchPopupIntent("ne-NP") }
        } else {
            emitDebug("❌ Background engine error code: $error")
            emitError("Speech engine error code: $error")
        }
    }

    override fun onResults(results: Bundle?) {
        val data = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = data?.firstOrNull().orEmpty()
        if (text.isNotEmpty()) {
            emitDebug("🎯 [BACKGROUND SUCCESS]: $text")
            sendSpeechResult(text)
        }
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val data = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = data?.firstOrNull().orEmpty()
        if (text.isNotEmpty()) {
            val payload = Arguments.createMap().apply { putString("text", text) }
            emit("onSpeechPartialResult", payload)
        }
    }

    private fun sendSpeechResult(text: String) {
        val payload = Arguments.createMap().apply { putString("text", text) }
        emit("onSpeechResult", payload)
    }

    private fun emit(eventName: String, params: WritableMap) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
    }

    private fun emitError(message: String) {
        val payload = Arguments.createMap().apply { putString("message", message) }
        emit("onSpeechError", payload)
    }

    private fun emitDebug(message: String) {
        Log.d("SPEECH_NATIVE", message)
        try {
            val payload = Arguments.createMap().apply { putString("log", message) }
            emit("onNativeDebugLog", payload)
        } catch (_: Exception) {}
    }

    // FIX: Removed the '?' from Intent to match modern React Native signatures
    override fun onNewIntent(intent: Intent) {}
    
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}