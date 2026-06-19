/*
 * APP Call Recorder by KKHS Media Private Limited
 * Based on ShizuCallRecorder (GPL-3.0) by kitsumed (Med)
 */

package com.kkhsmedia.callrecorder.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kkhsmedia.callrecorder.integrations.shizuku.ShizukuConnectionManager

/**
 * A step-by-step wizard that guides users through Shizuku setup.
 * This eliminates confusion for users who don't know what Shizuku is.
 */
@Composable
fun ShizukuSetupWizardScreen(
    onSetupComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var currentStep by remember { mutableIntStateOf(0) }

    val isShizukuInstalled = remember(currentStep) {
        ShizukuConnectionManager.getPackageName(context) != null
    }
    val isShizukuRunning = remember(currentStep) {
        ShizukuConnectionManager.isAvailable()
    }
    val hasShizukuPermission = remember(currentStep) {
        ShizukuConnectionManager.hasPermission(context)
    }

    // Auto-advance steps
    LaunchedEffect(isShizukuInstalled, isShizukuRunning, hasShizukuPermission) {
        if (isShizukuInstalled && currentStep == 0) currentStep = 1
        if (isShizukuRunning && currentStep == 1) currentStep = 2
        if (hasShizukuPermission && currentStep == 2) {
            onSetupComplete()
        }
    }

    Surface(
        modifier = modifier.navigationBarsPadding().fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .padding(top = 24.dp, bottom = 16.dp)
        ) {
            // Header
            Text(
                text = "Shizuku Setup",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "APP Call Recorder ko calls record karne ke liye Shizuku ki zaroorat hai. Neeche ke steps follow karein:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Steps
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Step 1: Install Shizuku
                SetupStepCard(
                    stepNumber = 1,
                    title = "Shizuku App Install Karein",
                    description = "Shizuku ek free app hai jo call recording ke liye zaroori permissions deta hai. Play Store se install karein.",
                    isCompleted = isShizukuInstalled,
                    isActive = currentStep == 0,
                    icon = Icons.Default.GetApp,
                    buttonText = "Install Shizuku",
                    onButtonClick = {
                        openShizukuInstallPage(context)
                    }
                )

                // Step 2: Start Shizuku
                SetupStepCard(
                    stepNumber = 2,
                    title = "Shizuku Start Karein",
                    description = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        "Shizuku app kholein aur 'Start via Wireless Debugging' option use karein.\n\n" +
                        "Steps:\n" +
                        "1. Phone Settings > Developer Options > Wireless Debugging ON karein\n" +
                        "2. Shizuku app mein 'Start' button dabayein\n" +
                        "3. Notification se pairing code enter karein"
                    } else {
                        "Shizuku app kholein aur computer se ADB command run karein:\n\n" +
                        "adb shell sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh"
                    },
                    isCompleted = isShizukuRunning,
                    isActive = currentStep == 1,
                    icon = Icons.Default.PlayArrow,
                    buttonText = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                        "Developer Options Kholein"
                    else
                        "Shizuku Kholein",
                    onButtonClick = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            openDeveloperOptions(context)
                        } else {
                            openShizukuApp(context)
                        }
                    },
                    secondaryButtonText = "Shizuku App Kholein",
                    onSecondaryButtonClick = {
                        openShizukuApp(context)
                    }
                )

                // Step 3: Grant Permission
                SetupStepCard(
                    stepNumber = 3,
                    title = "Permission Grant Karein",
                    description = "Shizuku start hone ke baad, APP Call Recorder ko permission dein. 'Allow' button dabayein jab dialog aaye.",
                    isCompleted = hasShizukuPermission,
                    isActive = currentStep == 2,
                    icon = Icons.Default.Security,
                    buttonText = "Permission Dein",
                    onButtonClick = {
                        ShizukuConnectionManager.requestPermission()
                    }
                )

                // Info card
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.elevatedCardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Info,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Zaruri Jaankari",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "• Shizuku ko phone restart hone par dubara start karna padta hai\n" +
                            "• App mein 'Manage Shizuku' option ON karein toh app khud start/stop karegi\n" +
                            "• Ye process bina root ke kaam karta hai\n" +
                            "• Aapka data safe hai - koi internet permission nahi hai",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }
                }
            }

            // Footer
            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(modifier = Modifier.padding(bottom = 16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { currentStep = 0 },
                    modifier = Modifier.weight(1f),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Refresh Status")
                }

                Button(
                    onClick = onSetupComplete,
                    modifier = Modifier.weight(1f),
                    shape = MaterialTheme.shapes.medium,
                    enabled = isShizukuRunning && hasShizukuPermission
                ) {
                    Text("Continue")
                }
            }
        }
    }
}

@Composable
private fun SetupStepCard(
    stepNumber: Int,
    title: String,
    description: String,
    isCompleted: Boolean,
    isActive: Boolean,
    icon: ImageVector,
    buttonText: String,
    onButtonClick: () -> Unit,
    secondaryButtonText: String? = null,
    onSecondaryButtonClick: (() -> Unit)? = null
) {
    val containerColor = when {
        isCompleted -> MaterialTheme.colorScheme.surfaceContainerHigh
        isActive -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceContainerLow
    }

    ElevatedCard(
        colors = CardDefaults.elevatedCardColors(containerColor = containerColor),
        elevation = CardDefaults.elevatedCardElevation(
            defaultElevation = if (isActive) 4.dp else 1.dp
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Step number badge
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = if (isCompleted) MaterialTheme.colorScheme.primary
                    else if (isActive) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.outline,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (isCompleted) {
                            Icon(
                                Icons.Default.Check,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text(
                                "$stepNumber",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))

                Text(
                    title,
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleSmall
                )

                Spacer(modifier = Modifier.weight(1f))

                if (isCompleted) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Done",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (isActive && !isCompleted) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onButtonClick,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(buttonText, style = MaterialTheme.typography.labelMedium)
                    }

                    if (secondaryButtonText != null && onSecondaryButtonClick != null) {
                        OutlinedButton(
                            onClick = onSecondaryButtonClick,
                            shape = MaterialTheme.shapes.small
                        ) {
                            Text(secondaryButtonText, style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }
        }
    }
}

private fun openShizukuInstallPage(context: Context) {
    try {
        // Try Play Store first
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=moe.shizuku.privileged.api"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    } catch (e: Exception) {
        // Fallback to browser
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=moe.shizuku.privileged.api"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}

private fun openShizukuApp(context: Context) {
    val packageName = ShizukuConnectionManager.getPackageName(context) ?: "moe.shizuku.privileged.api"
    try {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    } catch (e: Exception) {
        // Fallback: open app info
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        intent.data = Uri.parse("package:$packageName")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}

private fun openDeveloperOptions(context: Context) {
    try {
        val intent = Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    } catch (e: Exception) {
        val intent = Intent(Settings.ACTION_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
