package com.kkhsmedia.callpro.service

import android.content.Intent
import android.telecom.Call
import android.telecom.InCallService
import com.kkhsmedia.callpro.ui.call.InCallActivity

class CallService : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        CallManager.updateCall(call)

        val intent = Intent(this, InCallActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        startActivity(intent)

        call.registerCallback(callCallback)
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        call.unregisterCallback(callCallback)
        CallManager.updateCall(null)
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            CallManager.updateCall(call)
        }
    }
}

object CallManager {
    private var currentCall: Call? = null
    private val listeners = mutableListOf<(Call?) -> Unit>()

    fun updateCall(call: Call?) {
        currentCall = call
        listeners.forEach { it(call) }
    }

    fun getCall(): Call? = currentCall

    fun addListener(listener: (Call?) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (Call?) -> Unit) {
        listeners.remove(listener)
    }

    fun answer() {
        currentCall?.answer(0)
    }

    fun reject() {
        currentCall?.reject(false, null)
    }

    fun hangup() {
        currentCall?.disconnect()
    }

    fun toggleMute() {
        // Handled via AudioManager in the activity
    }

    fun toggleSpeaker() {
        // Handled via AudioManager in the activity
    }

    fun getState(): Int = currentCall?.state ?: Call.STATE_DISCONNECTED

    fun getCallerNumber(): String {
        return currentCall?.details?.handle?.schemeSpecificPart ?: "Unknown"
    }
}
