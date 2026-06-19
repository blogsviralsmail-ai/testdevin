package com.kkhsmedia.callpro.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "callpro_prefs")

class PreferencesManager(private val context: Context) {

    companion object {
        val DARK_MODE = booleanPreferencesKey("dark_mode")
        val APP_LOCK_ENABLED = booleanPreferencesKey("app_lock_enabled")
        val APP_LOCK_PIN = stringPreferencesKey("app_lock_pin")
        val IS_DEFAULT_DIALER = booleanPreferencesKey("is_default_dialer")
        val SORT_ORDER = stringPreferencesKey("sort_order")
    }

    val darkMode: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[DARK_MODE] ?: false
    }

    val appLockEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[APP_LOCK_ENABLED] ?: false
    }

    val appLockPin: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[APP_LOCK_PIN] ?: ""
    }

    suspend fun setDarkMode(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[DARK_MODE] = enabled
        }
    }

    suspend fun setAppLockEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[APP_LOCK_ENABLED] = enabled
        }
    }

    suspend fun setAppLockPin(pin: String) {
        context.dataStore.edit { prefs ->
            prefs[APP_LOCK_PIN] = pin
        }
    }
}
