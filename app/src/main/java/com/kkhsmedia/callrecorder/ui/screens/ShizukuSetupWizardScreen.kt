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

/** Supported languages for the setup wizard */
enum class WizardLanguage(val displayName: String, val code: String) {
    ENGLISH("English", "en"),
    HINDI("हिन्दी (Hindi)", "hi"),
    TAMIL("தமிழ் (Tamil)", "ta"),
    TELUGU("తెలుగు (Telugu)", "te"),
    BENGALI("বাংলা (Bengali)", "bn"),
    MARATHI("मराठी (Marathi)", "mr"),
    GUJARATI("ગુજરાતી (Gujarati)", "gu"),
    KANNADA("ಕನ್ನಡ (Kannada)", "kn"),
    MALAYALAM("മലയാളം (Malayalam)", "ml"),
    PUNJABI("ਪੰਜਾਬੀ (Punjabi)", "pa")
}

/** Localized strings for the setup wizard */
private fun getStrings(lang: WizardLanguage): Map<String, String> {
    return when (lang) {
        WizardLanguage.HINDI -> mapOf(
            "title" to "सेटअप - सिर्फ एक बार",
            "subtitle" to "APP Call Recorder सेटअप करने के लिए नीचे के स्टेप्स फॉलो करें।",
            "step1_title" to "Wireless Debugging चालू करें",
            "step1_desc" to "Phone Settings > Developer Options > Wireless Debugging enable करें।\n\nDeveloper Options नहीं दिख रहा? Settings > About Phone > Build Number पर 7 बार tap करें।",
            "step1_button" to "Developer Options खोलें",
            "step2_title" to "Pairing Code डालें",
            "step2_desc" to "Wireless Debugging > 'Pair device with pairing code' tap करें।\nजो code और port दिखेगा वो नीचे enter करें:",
            "step3_title" to "Permission Allow करें",
            "step3_desc" to "एक popup आएगा - 'Allow' button दबाएं।",
            "step3_button" to "Permission दें",
            "info_title" to "ज़रूरी जानकारी",
            "info_text" to "• ये setup सिर्फ एक बार करना है\n• Phone restart होने पर दोबारा pairing करनी पड़ेगी\n• Settings में 'Manage Shizuku' ON करें तो auto-start होगा\n• कोई data या privacy issue नहीं - सब local है",
            "pairing_code" to "Pairing Code (6 अंक)",
            "pairing_port" to "Pairing Port (जैसे 37429)",
            "pair_button" to "Pair करें और Start करें",
            "pairing_progress" to "Pairing हो रही है...",
            "pairing_success" to "Pairing सफल! Shizuku start हो रहा है...",
            "pairing_fail" to "Pairing fail। Code/Port check करें और दोबारा try करें।",
            "pairing_done" to "Pairing done! Shizuku start हो गया।",
            "enter_code_error" to "6 digit code और port डालें",
            "refresh" to "Refresh",
            "continue_btn" to "Continue",
            "select_language" to "भाषा चुनें"
        )
        WizardLanguage.TAMIL -> mapOf(
            "title" to "அமைப்பு - ஒரு முறை மட்டும்",
            "subtitle" to "APP Call Recorder-ஐ அமைக்க கீழே உள்ள படிகளைப் பின்பற்றவும்.",
            "step1_title" to "Wireless Debugging-ஐ இயக்கவும்",
            "step1_desc" to "Phone Settings > Developer Options > Wireless Debugging enable செய்யவும்.\n\nDeveloper Options தெரியவில்லையா? Settings > About Phone > Build Number-ஐ 7 முறை tap செய்யவும்.",
            "step1_button" to "Developer Options திறக்கவும்",
            "step2_title" to "Pairing Code உள்ளிடவும்",
            "step2_desc" to "Wireless Debugging > 'Pair device with pairing code' tap செய்யவும்.\nகாண்பிக்கும் code மற்றும் port-ஐ கீழே உள்ளிடவும்:",
            "step3_title" to "Permission அனுமதிக்கவும்",
            "step3_desc" to "ஒரு popup வரும் - 'Allow' button அழுத்தவும்.",
            "step3_button" to "Permission கொடுக்கவும்",
            "info_title" to "முக்கிய தகவல்",
            "info_text" to "• இந்த setup ஒரு முறை மட்டும்\n• Phone restart ஆனால் மீண்டும் pairing செய்ய வேண்டும்\n• Settings-ல் 'Manage Shizuku' ON செய்தால் auto-start ஆகும்\n• தரவு அல்லது privacy பிரச்சனை இல்லை",
            "pairing_code" to "Pairing Code (6 இலக்கம்)",
            "pairing_port" to "Pairing Port (எ.கா. 37429)",
            "pair_button" to "Pair & Start",
            "pairing_progress" to "Pairing நடக்கிறது...",
            "pairing_success" to "Pairing வெற்றி! Shizuku தொடங்குகிறது...",
            "pairing_fail" to "Pairing தோல்வி. Code/Port சரிபார்க்கவும்.",
            "pairing_done" to "Pairing முடிந்தது! Shizuku தொடங்கியது.",
            "enter_code_error" to "6 digit code மற்றும் port உள்ளிடவும்",
            "refresh" to "Refresh",
            "continue_btn" to "Continue",
            "select_language" to "மொழியை தேர்ந்தெடுக்கவும்"
        )
        WizardLanguage.TELUGU -> mapOf(
            "title" to "సెటప్ - ఒక్కసారి మాత్రమే",
            "subtitle" to "APP Call Recorder సెటప్ చేయడానికి క్రింది స్టెప్స్ ఫాలో చేయండి.",
            "step1_title" to "Wireless Debugging ఆన్ చేయండి",
            "step1_desc" to "Phone Settings > Developer Options > Wireless Debugging enable చేయండి.\n\nDeveloper Options కనిపించడం లేదా? Settings > About Phone > Build Number పై 7 సార్లు tap చేయండి.",
            "step1_button" to "Developer Options తెరవండి",
            "step2_title" to "Pairing Code ఎంటర్ చేయండి",
            "step2_desc" to "Wireless Debugging > 'Pair device with pairing code' tap చేయండి.\nకనిపించే code మరియు port క్రింద ఎంటర్ చేయండి:",
            "step3_title" to "Permission Allow చేయండి",
            "step3_desc" to "ఒక popup వస్తుంది - 'Allow' button నొక్కండి.",
            "step3_button" to "Permission ఇవ్వండి",
            "info_title" to "ముఖ్యమైన సమాచారం",
            "info_text" to "• ఈ setup ఒక్కసారి మాత్రమే\n• Phone restart అయితే మళ్ళీ pairing చేయాలి\n• Settings లో 'Manage Shizuku' ON చేస్తే auto-start అవుతుంది\n• డేటా లేదా privacy సమస్య లేదు",
            "pairing_code" to "Pairing Code (6 అంకెలు)",
            "pairing_port" to "Pairing Port (ఉదా. 37429)",
            "pair_button" to "Pair & Start",
            "pairing_progress" to "Pairing జరుగుతోంది...",
            "pairing_success" to "Pairing విజయవంతం! Shizuku ప్రారంభమవుతోంది...",
            "pairing_fail" to "Pairing విఫలం. Code/Port తనిఖీ చేయండి.",
            "pairing_done" to "Pairing పూర్తి! Shizuku ప్రారంభమైంది.",
            "enter_code_error" to "6 digit code మరియు port ఎంటర్ చేయండి",
            "refresh" to "Refresh",
            "continue_btn" to "Continue",
            "select_language" to "భాషను ఎంచుకోండి"
        )
        else -> mapOf(
            "title" to "Setup - One Time Only",
            "subtitle" to "Follow the steps below to setup APP Call Recorder. This is required only once.",
            "step1_title" to "Enable Wireless Debugging",
            "step1_desc" to "Go to Phone Settings > Developer Options > Enable Wireless Debugging.\n\nCan't find Developer Options? Go to Settings > About Phone > Tap Build Number 7 times.",
            "step1_button" to "Open Developer Options",
            "step2_title" to "Enter Pairing Code",
            "step2_desc" to "In Wireless Debugging, tap 'Pair device with pairing code'.\nEnter the code and port shown below:",
            "step3_title" to "Allow Permission",
            "step3_desc" to "A popup will appear - tap the 'Allow' button.",
            "step3_button" to "Grant Permission",
            "info_title" to "Important Information",
            "info_text" to "• This setup is required only ONCE\n• After phone restart, you'll need to pair again\n• Enable 'Manage Shizuku' in Settings for auto-start\n• No data or privacy issues - everything is local",
            "pairing_code" to "Pairing Code (6 digits)",
            "pairing_port" to "Pairing Port (e.g. 37429)",
            "pair_button" to "Pair & Start",
            "pairing_progress" to "Pairing in progress...",
            "pairing_success" to "Pairing successful! Starting Shizuku...",
            "pairing_fail" to "Pairing failed. Please check code/port and try again.",
            "pairing_done" to "Pairing done! Shizuku started.",
            "enter_code_error" to "Please enter 6 digit code and port",
            "refresh" to "Refresh",
            "continue_btn" to "Continue",
            "select_language" to "Select Language"
        )
    }
}

/**
 * Setup wizard with built-in ADB pairing and language selection.
 * No separate Shizuku app download required on Android 11+.
 */
@Composable
fun ShizukuSetupWizardScreen(
    onSetupComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedLanguage by remember { mutableStateOf(WizardLanguage.ENGLISH) }
    var showLanguageMenu by remember { mutableStateOf(false) }
    var currentStep by remember { mutableIntStateOf(0) }
    var pairingCode by remember { mutableStateOf("") }
    var pairingPort by remember { mutableStateOf("") }
    var statusMessage by remember { mutableStateOf("") }
    var isPairing by remember { mutableStateOf(false) }
    var pairingDone by remember { mutableStateOf(false) }

    val strings = getStrings(selectedLanguage)

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
            // Language selector row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box {
                    OutlinedButton(
                        onClick = { showLanguageMenu = true },
                        shape = MaterialTheme.shapes.small
                    ) {
                        Icon(Icons.Default.Language, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(selectedLanguage.displayName, style = MaterialTheme.typography.labelMedium)
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(18.dp))
                    }
                    DropdownMenu(
                        expanded = showLanguageMenu,
                        onDismissRequest = { showLanguageMenu = false }
                    ) {
                        WizardLanguage.entries.forEach { lang ->
                            DropdownMenuItem(
                                text = { Text(lang.displayName) },
                                onClick = {
                                    selectedLanguage = lang
                                    showLanguageMenu = false
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Header
            Text(
                text = strings["title"] ?: "Setup",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = strings["subtitle"] ?: "",
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
                // Step 1: Enable Wireless Debugging
                SetupStepCard(
                    stepNumber = 1,
                    title = strings["step1_title"] ?: "",
                    description = strings["step1_desc"] ?: "",
                    isCompleted = currentStep > 0 || isShizukuRunning,
                    isActive = currentStep == 0 && !isShizukuRunning,
                    icon = Icons.Default.Wifi,
                    buttonText = strings["step1_button"],
                    onButtonClick = { openDeveloperOptions(context) }
                )

                // Step 2: Enter Pairing Code
                SetupStepCard(
                    stepNumber = 2,
                    title = strings["step2_title"] ?: "",
                    description = strings["step2_desc"] ?: "",
                    isCompleted = pairingDone || isShizukuRunning,
                    isActive = !isShizukuRunning,
                    icon = Icons.Default.Pin,
                    customContent = {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = pairingCode,
                                onValueChange = { pairingCode = it.filter { c -> c.isDigit() }.take(6) },
                                label = { Text(strings["pairing_code"] ?: "Pairing Code") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = pairingPort,
                                onValueChange = { pairingPort = it.filter { c -> c.isDigit() }.take(5) },
                                label = { Text(strings["pairing_port"] ?: "Pairing Port") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )

                            if (statusMessage.isNotEmpty()) {
                                Text(
                                    statusMessage,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (statusMessage.contains("success", true) ||
                                        statusMessage.contains("सफल", true) ||
                                        statusMessage.contains("வெற்றி", true) ||
                                        statusMessage.contains("విజయ", true))
                                        MaterialTheme.colorScheme.primary
                                    else
                                        MaterialTheme.colorScheme.error
                                )
                            }

                            Button(
                                onClick = {
                                    if (pairingCode.length == 6 && pairingPort.isNotEmpty()) {
                                        isPairing = true
                                        statusMessage = strings["pairing_progress"] ?: "Pairing..."
                                        scope.launch {
                                            val manager = AdbPairingManager(context)
                                            val port = pairingPort.toIntOrNull() ?: 0
                                            val success = manager.pair("127.0.0.1", port, pairingCode)
                                            if (success) {
                                                statusMessage = strings["pairing_success"] ?: "Success!"
                                                pairingDone = true
                                                delay(1000)
                                                val connected = manager.autoConnect()
                                                if (connected) {
                                                    manager.startShizukuServer()
                                                    delay(3000)
                                                    currentStep = 2
                                                } else {
                                                    statusMessage = strings["pairing_done"] ?: "Pairing done!"
                                                    currentStep = 2
                                                }
                                            } else {
                                                statusMessage = strings["pairing_fail"] ?: "Pairing failed."
                                            }
                                            isPairing = false
                                        }
                                    } else {
                                        statusMessage = strings["enter_code_error"] ?: "Enter code and port"
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
                                Text(
                                    if (isPairing) strings["pairing_progress"] ?: "Pairing..."
                                    else strings["pair_button"] ?: "Pair & Start"
                                )
                            }
                        }
                    }
                )

                // Step 3: Grant Permission
                SetupStepCard(
                    stepNumber = 3,
                    title = strings["step3_title"] ?: "",
                    description = strings["step3_desc"] ?: "",
                    isCompleted = hasShizukuPermission,
                    isActive = currentStep == 2 && isShizukuRunning,
                    icon = Icons.Default.Security,
                    buttonText = strings["step3_button"],
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
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                strings["info_title"] ?: "Important",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            strings["info_text"] ?: "",
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
                    Text(strings["refresh"] ?: "Refresh")
                }

                Button(
                    onClick = onSetupComplete,
                    modifier = Modifier.weight(1f),
                    shape = MaterialTheme.shapes.medium,
                    enabled = isShizukuRunning && hasShizukuPermission
                ) {
                    Text(strings["continue_btn"] ?: "Continue")
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
