package com.kkhsmedia.callpro

import android.app.Application

class CallProApp : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: CallProApp
            private set
    }
}
