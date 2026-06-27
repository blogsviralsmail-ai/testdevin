package com.kkhsmedia.callpro.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

val Primary = Color(0xFF1A73E8)
val PrimaryDark = Color(0xFF0D47A1)
val PrimaryLight = Color(0xFF64B5F6)
val Accent = Color(0xFFFF6F00)
val AccentLight = Color(0xFFFFB74D)
val IncomingCall = Color(0xFF4CAF50)
val OutgoingCall = Color(0xFF2196F3)
val MissedCall = Color(0xFFF44336)
val RejectedCall = Color(0xFFFF5722)
val BackgroundLight = Color(0xFFF5F5F5)
val SurfaceLight = Color(0xFFFFFFFF)
val BackgroundDark = Color(0xFF121212)
val SurfaceDark = Color(0xFF1E1E1E)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    primaryContainer = PrimaryLight,
    onPrimaryContainer = PrimaryDark,
    secondary = Accent,
    onSecondary = Color.White,
    secondaryContainer = AccentLight,
    background = BackgroundLight,
    onBackground = Color(0xFF1C1B1F),
    surface = SurfaceLight,
    onSurface = Color(0xFF1C1B1F),
    error = MissedCall,
    onError = Color.White,
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLight,
    onPrimary = PrimaryDark,
    primaryContainer = Primary,
    onPrimaryContainer = Color.White,
    secondary = AccentLight,
    onSecondary = Color.Black,
    secondaryContainer = Accent,
    background = BackgroundDark,
    onBackground = Color(0xFFE6E1E5),
    surface = SurfaceDark,
    onSurface = Color(0xFFE6E1E5),
    error = Color(0xFFEF9A9A),
    onError = Color.Black,
)

@Composable
fun CallProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
