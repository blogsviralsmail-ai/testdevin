package com.kkhsmedia.callpro.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "callpro_prefs")

class PreferencesManager(private val context: Context) {

    companion object {
        val DARK_MODE = booleanPreferencesKey("dark_mode")
        val APP_LOCK_ENABLED = booleanPreferencesKey("app_lock_enabled")
        val APP_LOCK_PIN = stringPreferencesKey("app_lock_pin")
        val IS_DEFAULT_DIALER = booleanPreferencesKey("is_default_dialer")
        val SORT_ORDER = stringPreferencesKey("sort_order")

        val EDIT_COUNT = intPreferencesKey("edit_count")
        val IS_PREMIUM = booleanPreferencesKey("is_premium")
        val SUBSCRIPTION_TYPE = stringPreferencesKey("subscription_type")
        val SUBSCRIPTION_EXPIRY = stringPreferencesKey("subscription_expiry")
        val DEVICE_ID = stringPreferencesKey("device_id")

        const val FREE_EDIT_LIMIT = 10
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

    val editCount: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[EDIT_COUNT] ?: 0
    }

    val isPremium: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[IS_PREMIUM] ?: false
    }

    val subscriptionType: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[SUBSCRIPTION_TYPE] ?: ""
    }

    val remainingFreeEdits: Flow<Int> = context.dataStore.data.map { prefs ->
        val used = prefs[EDIT_COUNT] ?: 0
        (FREE_EDIT_LIMIT - used).coerceAtLeast(0)
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

    suspend fun incrementEditCount(): Int {
        var newCount = 0
        context.dataStore.edit { prefs ->
            val current = prefs[EDIT_COUNT] ?: 0
            newCount = current + 1
            prefs[EDIT_COUNT] = newCount
        }
        return newCount
    }

    suspend fun canEdit(): Boolean {
        val premium = isPremium.first()
        if (premium) return true
        val count = editCount.first()
        return count < FREE_EDIT_LIMIT
    }

    suspend fun setPremium(enabled: Boolean, type: String = "") {
        context.dataStore.edit { prefs ->
            prefs[IS_PREMIUM] = enabled
            prefs[SUBSCRIPTION_TYPE] = type
        }
    }

    suspend fun saveDeviceId(deviceId: String) {
        context.dataStore.edit { prefs ->
            prefs[DEVICE_ID] = deviceId
        }
    }
}
