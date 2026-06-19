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
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.kkhsmedia.callrecorder.integrations.adb.AdbPairingManager
import com.kkhsmedia.callrecorder.integrations.shizuku.ShizukuConnectionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * A step-by-step wizard that guides users through Shizuku setup
 * with built-in ADB pairing (no separate Shizuku app needed on Android 11+).
 */
@Composable
fun ShizukuSetupWizardScreen(
    onSetupComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var currentStep by remember { mutableIntStateOf(0) }
    var pairingCode by remember { mutableStateOf("") }
    var pairingPort by remember { mutableStateOf("") }
    var connectPort by remember { mutableStateOf("") }
    var statusMessage by remember { mutableStateOf("") }
    var isPairing by remember { mutableStateOf(false) }
    var isConnecting by remember { mutableStateOf(false) }
    var pairingDone by remember { mutableStateOf(false) }

    val isShizukuInstalled = remember(currentStep) {
        ShizukuConnectionManager.getPackageName(context) != null
    }
    val isShizukuRunning = remember(currentStep) {
        ShizukuConnectionManager.isAvailable()
    }
    val hasShizukuPermission = remember(currentStep) {
        ShizukuConnectionManager.hasPermission(context)
    }

    // Auto-advance when Shizuku is already running
    LaunchedEffect(isShizukuRunning, hasShizukuPermission) {
        if (isShizukuRunning && hasShizukuPermission) {
            onSetupComplete()
        }
        if (isShizukuRunning && !hasShizukuPermission) {
            currentStep = 2
        }
    }

    // Determine if we can use built-in ADB pairing (Android 11+)
    val canUseBuiltInPairing = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R

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
                text = "Setup - One Time Only",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (canUseBuiltInPairing)
                    "APP Call Recorder ko setup karne ke liye neeche ke steps follow karein. Ye sirf ek baar karna hai."
                else
                    "APP Call Recorder ko Shizuku app ki zaroorat hai. Neeche ke steps follow karein.",
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
                if (canUseBuiltInPairing) {
                    // BUILT-IN APPROACH (Android 11+): No Shizuku app needed

                    // Step 0: Shizuku still needed as service host
                    if (!isShizukuInstalled) {
                        SetupStepCard(
                            stepNumber = 1,
                            title = "Shizuku App Install Karein",
                            description = "Shizuku ek chhota sa helper app hai (3MB). Ye background mein kaam karta hai. Install karne ke baad kholne ki zaroorat nahi.",
                            isCompleted = isShizukuInstalled,
                            isActive = currentStep == 0 && !isShizukuInstalled,
                            icon = Icons.Default.GetApp,
                            buttonText = "Install (Play Store)",
                            onButtonClick = { openShizukuInstallPage(context) }
                        )
                    }

                    // Step 1: Enable Wireless Debugging
                    SetupStepCard(
                        stepNumber = if (!isShizukuInstalled) 2 else 1,
                        title = "Wireless Debugging ON Karein",
                        description = "Phone Settings > Developer Options > Wireless Debugging enable karein.\n\n" +
                            "Developer Options nahi dikh raha? Settings > About Phone > Build Number par 7 baar tap karein.",
                        isCompleted = currentStep > 0 || isShizukuRunning,
                        isActive = currentStep == 0 && isShizukuInstalled,
                        icon = Icons.Default.Wifi,
                        buttonText = "Developer Options Kholein",
                        onButtonClick = { openDeveloperOptions(context) }
                    )

                    // Step 2: Enter Pairing Code (Built-in ADB pairing)
                    SetupStepCard(
                        stepNumber = if (!isShizukuInstalled) 3 else 2,
                        title = "Pairing Code Enter Karein",
                        description = "Wireless Debugging > 'Pair device with pairing code' tap karein.\n" +
                            "Jo code aur port dikhega wo neeche enter karein:",
                        isCompleted = pairingDone || isShizukuRunning,
                        isActive = (currentStep == 0 && isShizukuInstalled) || currentStep == 1,
                        icon = Icons.Default.Pin,
                        customContent = {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = pairingCode,
                                    onValueChange = { pairingCode = it.filter { c -> c.isDigit() }.take(6) },
                                    label = { Text("Pairing Code (6 digit)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true
                                )
                                OutlinedTextField(
                                    value = pairingPort,
                                    onValueChange = { pairingPort = it.filter { c -> c.isDigit() }.take(5) },
                                    label = { Text("Pairing Port (e.g. 37429)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true
                                )

                                if (statusMessage.isNotEmpty()) {
                                    Text(
                                        statusMessage,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (statusMessage.contains("Success") || statusMessage.contains("safal"))
                                            MaterialTheme.colorScheme.primary
                                        else
                                            MaterialTheme.colorScheme.error
                                    )
                                }

                                Button(
                                    onClick = {
                                        if (pairingCode.length == 6 && pairingPort.isNotEmpty()) {
                                            isPairing = true
                                            statusMessage = "Pairing ho rahi hai..."
                                            scope.launch {
                                                val manager = AdbPairingManager(context)
                                                val port = pairingPort.toIntOrNull() ?: 0
                                                val success = manager.pair("127.0.0.1", port, pairingCode)
                                                if (success) {
                                                    statusMessage = "✓ Pairing safal! Ab Shizuku start ho raha hai..."
                                                    pairingDone = true
                                                    // Now try to auto-connect and start Shizuku
                                                    delay(1000)
                                                    val connected = manager.autoConnect()
                                                    if (connected) {
                                                        manager.startShizukuServer()
                                                        delay(3000)
                                                        currentStep = 2
                                                    } else {
                                                        statusMessage = "Pairing done! Ab Shizuku app mein 'Start' karein."
                                                        currentStep = 2
                                                    }
                                                } else {
                                                    statusMessage = "Pairing fail. Code/Port check karein aur dobara try karein."
                                                }
                                                isPairing = false
                                            }
                                        } else {
                                            statusMessage = "6 digit code aur port daalein"
                                        }
                                    },
                                    enabled = !isPairing && pairingCode.length == 6 && pairingPort.isNotEmpty(),
                                    shape = MaterialTheme.shapes.small
                                ) {
                                    if (isPairing) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                    }
                                    Text(if (isPairing) "Pairing..." else "Pair & Start")
                                }
                            }
                        }
                    )

                    // Step 3: Grant Permission
                    SetupStepCard(
                        stepNumber = if (!isShizukuInstalled) 4 else 3,
                        title = "Permission Allow Karein",
                        description = "Ek popup aayega - 'Allow' button dabayein.",
                        isCompleted = hasShizukuPermission,
                        isActive = currentStep == 2 && isShizukuRunning,
                        icon = Icons.Default.Security,
                        buttonText = "Permission Dein",
                        onButtonClick = {
                            ShizukuConnectionManager.requestPermission()
                        }
                    )

                } else {
                    // FALLBACK (Android 10 and below): Need Shizuku app + PC

                    SetupStepCard(
                        stepNumber = 1,
                        title = "Shizuku App Install Karein",
                        description = "Play Store se Shizuku install karein.",
                        isCompleted = isShizukuInstalled,
                        isActive = !isShizukuInstalled,
                        icon = Icons.Default.GetApp,
                        buttonText = "Install Shizuku",
                        onButtonClick = { openShizukuInstallPage(context) }
                    )

                    SetupStepCard(
                        stepNumber = 2,
                        title = "Computer se ADB Command Run Karein",
                        description = "Computer par ADB install karein aur ye command run karein:\n\n" +
                            "adb shell sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh\n\n" +
                            "Ya phir Shizuku app kholein aur instructions follow karein.",
                        isCompleted = isShizukuRunning,
                        isActive = isShizukuInstalled && !isShizukuRunning,
                        icon = Icons.Default.Computer,
                        buttonText = "Shizuku Kholein",
                        onButtonClick = { openShizukuApp(context) }
                    )

                    SetupStepCard(
                        stepNumber = 3,
                        title = "Permission Allow Karein",
                        description = "Shizuku start hone ke baad 'Allow' button dabayein.",
                        isCompleted = hasShizukuPermission,
                        isActive = isShizukuRunning && !hasShizukuPermission,
                        icon = Icons.Default.Security,
                        buttonText = "Permission Dein",
                        onButtonClick = { ShizukuConnectionManager.requestPermission() }
                    )
                }

                // Info card
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.elevatedCardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Zaruri Jaankari", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            if (canUseBuiltInPairing)
                                "• Ye setup sirf EK BAAR karna hai\n" +
                                "• Phone restart hone par dobara pairing karni padegi\n" +
                                "• Settings mein 'Manage Shizuku' ON karein toh auto-start hoga\n" +
                                "• Koi data ya privacy issue nahi hai - sab local hai"
                            else
                                "• Computer se ADB connection lagana padega\n" +
                                "• Phone restart hone par dobara command run karna padega\n" +
                                "• Android 11+ mein computer ki zaroorat nahi hoti",
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
                    onClick = {
                        currentStep = 0
                        statusMessage = ""
                    },
                    modifier = Modifier.weight(1f),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Refresh")
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
    buttonText: String? = null,
    onButtonClick: (() -> Unit)? = null,
    customContent: (@Composable () -> Unit)? = null
) {
    val containerColor = when {
        isCompleted -> MaterialTheme.colorScheme.surfaceContainerHigh
        isActive -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceContainerLow
    }

    ElevatedCard(
        colors = CardDefaults.elevatedCardColors(containerColor = containerColor),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = if (isActive) 4.dp else 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = if (isCompleted || isActive) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.outline,
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (isCompleted) {
                            Icon(Icons.Default.Check, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onPrimary)
                        } else {
                            Text("$stepNumber", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
                Text(title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.weight(1f))
                if (isCompleted) {
                    Icon(Icons.Default.CheckCircle, "Done", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            if (isActive && !isCompleted) {
                Spacer(modifier = Modifier.height(12.dp))

                if (customContent != null) {
                    customContent()
                } else if (buttonText != null && onButtonClick != null) {
                    Button(onClick = onButtonClick, shape = MaterialTheme.shapes.small) {
                        Text(buttonText, style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }
    }
}

private fun openShizukuInstallPage(context: Context) {
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=moe.shizuku.privileged.api"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    } catch (e: Exception) {
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
