package com.kkhsmedia.callpro.ui.lock

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.kkhsmedia.callpro.ui.MainActivity
import com.kkhsmedia.callpro.ui.theme.CallProTheme
import com.kkhsmedia.callpro.util.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class AppLockActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val preferencesManager = PreferencesManager(this)

        lifecycleScope.launch {
            val pin = preferencesManager.appLockPin.first()
            if (pin.isBlank()) {
                proceed()
                return@launch
            }

            setContent {
                CallProTheme {
                    AppLockScreen(
                        onPinVerified = { proceed() },
                        correctPin = pin
                    )
                }
            }
        }
    }

    private fun proceed() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
