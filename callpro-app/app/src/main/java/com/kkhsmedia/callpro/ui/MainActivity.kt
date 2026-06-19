package com.kkhsmedia.callpro.ui

import android.Manifest
import android.app.Activity
import android.app.role.RoleManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.TelecomManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Contacts
import androidx.compose.material.icons.filled.Dialpad
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.kkhsmedia.callpro.data.model.CallLogEntry
import com.kkhsmedia.callpro.ui.analytics.AnalyticsScreen
import com.kkhsmedia.callpro.ui.backup.BackupScreen
import com.kkhsmedia.callpro.ui.contacts.ContactsScreen
import com.kkhsmedia.callpro.ui.dialer.DialerScreen
import com.kkhsmedia.callpro.ui.dialer.makeCall
import com.kkhsmedia.callpro.ui.editor.EditorScreen
import com.kkhsmedia.callpro.ui.history.HistoryScreen
import com.kkhsmedia.callpro.ui.settings.SettingsScreen
import com.kkhsmedia.callpro.ui.subscription.EditLimitDialog
import com.kkhsmedia.callpro.ui.subscription.PaywallScreen
import com.kkhsmedia.callpro.ui.theme.CallProTheme
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val authenticated = intent.getBooleanExtra("authenticated", false)
        if (!authenticated) {
            val preferencesManager = com.kkhsmedia.callpro.util.PreferencesManager(this)
            lifecycleScope.launch {
                val isLockEnabled = preferencesManager.appLockEnabled.first()
                val pin = preferencesManager.appLockPin.first()
                if (isLockEnabled && pin.isNotBlank()) {
                    startActivity(Intent(this@MainActivity, com.kkhsmedia.callpro.ui.lock.AppLockActivity::class.java))
                    finish()
                    return@launch
                }
                showMainContent()
            }
        } else {
            showMainContent()
        }
    }

    private fun showMainContent() {
        setContent {
            val vm: MainViewModel = viewModel()
            val isDarkMode by vm.isDarkMode.collectAsState()

            CallProTheme(darkTheme = isDarkMode) {
                MainApp(vm)
            }
        }
    }
}

sealed class Screen(val title: String, val icon: ImageVector) {
    data object Dialer : Screen("Dialer", Icons.Default.Dialpad)
    data object History : Screen("History", Icons.Default.History)
    data object Contacts : Screen("Contacts", Icons.Default.Contacts)
    data object Analytics : Screen("Stats", Icons.Default.Analytics)
    data object Backup : Screen("Backup", Icons.Default.Save)
    data object Settings : Screen("Settings", Icons.Default.Settings)
    data class Editor(val callLog: CallLogEntry? = null, val isNew: Boolean = false) :
        Screen("Editor", Icons.Default.Dialpad)
    data object Paywall : Screen("Upgrade", Icons.Default.Dialpad)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(vm: MainViewModel) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var currentScreen by remember { mutableStateOf<Screen>(Screen.Dialer) }
    var selectedTab by remember { mutableIntStateOf(0) }

    val callLogs by vm.callLogs.collectAsState()
    val contacts by vm.contacts.collectAsState()
    val analytics by vm.analytics.collectAsState()
    val statusMessage by vm.statusMessage.collectAsState()
    val isDarkMode by vm.isDarkMode.collectAsState()
    val isAppLockEnabled by vm.isAppLockEnabled.collectAsState()
    val editCount by vm.editCount.collectAsState()
    val isPremium by vm.isPremium.collectAsState()
    val remainingFreeEdits by vm.remainingFreeEdits.collectAsState()
    val purchaseState by vm.billingManager.purchaseState.collectAsState()

    var showLimitDialog by remember { mutableStateOf(false) }

    LaunchedEffect(isPremium) {
        if (isPremium && currentScreen is Screen.Paywall) {
            currentScreen = Screen.History
            selectedTab = 1
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.values.all { it }) {
            vm.loadCallLogs()
            vm.loadContacts()
        }
    }

    val notes by vm.notes.collectAsState()

    val backupLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        uri?.let {
            scope.launch {
                val success = vm.backupRepo.createBackup(it, callLogs, notes)
                if (success) {
                    Toast.makeText(context, "Backup created successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Backup failed", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    val restoreLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let {
            scope.launch {
                val data = vm.backupRepo.restoreBackup(it)
                if (data != null) {
                    data.callLogs.forEach { log ->
                        vm.addCallLog(log.number, log.type, log.date, log.duration)
                    }
                    if (data.notes.isNotEmpty()) {
                        vm.restoreNotes(data.notes)
                    }
                    Toast.makeText(
                        context,
                        "Restored ${data.callLogs.size} call logs and ${data.notes.size} notes",
                        Toast.LENGTH_SHORT
                    ).show()
                    vm.loadCallLogs()
                } else {
                    Toast.makeText(context, "Restore failed", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    val csvExportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("text/csv")
    ) { uri ->
        uri?.let {
            scope.launch {
                val success = vm.backupRepo.exportToCsv(it, callLogs)
                Toast.makeText(
                    context,
                    if (success) "CSV exported" else "Export failed",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    val jsonExportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        uri?.let {
            scope.launch {
                val success = vm.backupRepo.exportToJson(it, callLogs)
                Toast.makeText(
                    context,
                    if (success) "JSON exported" else "Export failed",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.READ_CALL_LOG,
                Manifest.permission.WRITE_CALL_LOG,
                Manifest.permission.READ_CONTACTS,
                Manifest.permission.CALL_PHONE,
                Manifest.permission.READ_PHONE_STATE
            )
        )
    }

    LaunchedEffect(statusMessage) {
        statusMessage?.let {
            snackbarHostState.showSnackbar(it)
            vm.clearStatusMessage()
        }
    }

    val tabs = listOf(
        Screen.Dialer,
        Screen.History,
        Screen.Contacts,
        Screen.Analytics,
        Screen.Backup,
        Screen.Settings
    )

    val isEditorScreen = currentScreen is Screen.Editor
    val isPaywallScreen = currentScreen is Screen.Paywall

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (!isEditorScreen && !isPaywallScreen) {
                TopAppBar(
                    title = {
                        Text(
                            text = if (currentScreen == Screen.Dialer) "CallPro"
                            else tabs[selectedTab].title,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    actions = {
                        if (currentScreen == Screen.History && !isPremium) {
                            androidx.compose.material3.TextButton(
                                onClick = { currentScreen = Screen.Paywall }
                            ) {
                                Text(
                                    text = "$remainingFreeEdits edits left",
                                    fontSize = 12.sp,
                                    color = if (remainingFreeEdits <= 3)
                                        androidx.compose.ui.graphics.Color(0xFFF44336)
                                    else MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        },
        bottomBar = {
            if (!isEditorScreen && !isPaywallScreen) {
                NavigationBar {
                    tabs.forEachIndexed { index, screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title, fontSize = 10.sp) },
                            selected = selectedTab == index,
                            onClick = {
                                selectedTab = index
                                currentScreen = screen
                                when (screen) {
                                    Screen.History -> vm.loadCallLogs()
                                    Screen.Contacts -> vm.loadContacts()
                                    Screen.Analytics -> vm.loadAnalytics()
                                    else -> {}
                                }
                            }
                        )
                    }
                }
            }
        },
        floatingActionButton = {
            if (currentScreen == Screen.History) {
                FloatingActionButton(
                    onClick = {
                        scope.launch {
                            if (vm.canEdit()) {
                                currentScreen = Screen.Editor(callLog = null, isNew = true)
                            } else {
                                showLimitDialog = true
                            }
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Call Log")
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (val screen = currentScreen) {
                Screen.Dialer -> DialerScreen()

                Screen.History -> HistoryScreen(
                    callLogs = callLogs,
                    onEditClick = { entry ->
                        scope.launch {
                            if (vm.canEdit()) {
                                currentScreen = Screen.Editor(callLog = entry, isNew = false)
                            } else {
                                showLimitDialog = true
                            }
                        }
                    },
                    onDeleteClick = { entry ->
                        scope.launch {
                            if (vm.canEdit()) {
                                vm.consumeEdit()
                                vm.deleteCallLog(entry.id)
                            } else {
                                showLimitDialog = true
                            }
                        }
                    },
                    onCallClick = { number ->
                        makeCall(context, number)
                    }
                )

                Screen.Contacts -> ContactsScreen(
                    contacts = contacts,
                    onContactClick = { contact ->
                        makeCall(context, contact.phoneNumber)
                    }
                )

                Screen.Analytics -> AnalyticsScreen(analytics = analytics)

                Screen.Backup -> BackupScreen(
                    onBackup = {
                        backupLauncher.launch("callpro_backup_${System.currentTimeMillis()}.json")
                    },
                    onRestore = {
                        restoreLauncher.launch(arrayOf("application/json"))
                    },
                    onExportCsv = {
                        csvExportLauncher.launch("callpro_export_${System.currentTimeMillis()}.csv")
                    },
                    onExportJson = {
                        jsonExportLauncher.launch("callpro_export_${System.currentTimeMillis()}.json")
                    },
                    statusMessage = statusMessage
                )

                Screen.Settings -> SettingsScreen(
                    isDarkMode = isDarkMode,
                    isAppLockEnabled = isAppLockEnabled,
                    isDefaultDialer = isDefaultDialer(context),
                    onDarkModeToggle = { vm.setDarkMode(it) },
                    onAppLockToggle = { vm.setAppLockEnabled(it) },
                    onSetPin = { vm.setAppLockPin(it) },
                    onSetDefaultDialer = { requestDefaultDialer(context) },
                    onDeleteAllLogs = { vm.deleteAllCallLogs() }
                )

                is Screen.Editor -> EditorScreen(
                    callLog = screen.callLog,
                    isNew = screen.isNew,
                    onSave = { number, name, type, date, duration ->
                        scope.launch {
                            vm.consumeEdit()
                            if (screen.isNew) {
                                vm.addCallLog(number, type, date, duration)
                            } else {
                                screen.callLog?.let { log ->
                                    vm.editCallLog(
                                        callLogId = log.id,
                                        newNumber = number,
                                        newName = name,
                                        newDate = date,
                                        newDuration = duration,
                                        newType = type
                                    )
                                }
                            }
                            currentScreen = Screen.History
                            selectedTab = 1
                        }
                    },
                    onBack = {
                        currentScreen = Screen.History
                        selectedTab = 1
                    }
                )

                Screen.Paywall -> {
                    val billingError = when (val state = purchaseState) {
                        is com.kkhsmedia.callpro.billing.PurchaseState.Error -> state.message
                        else -> null
                    }
                    PaywallScreen(
                        editCount = editCount,
                        errorMessage = billingError,
                        onSubscribe = { planType ->
                            val activity = context as? Activity
                            if (activity != null) {
                                vm.launchPurchase(activity, planType)
                            }
                        },
                    onDismiss = {
                        currentScreen = Screen.History
                        selectedTab = 1
                    }
                    )
                }
            }
        }
    }

    if (showLimitDialog) {
        EditLimitDialog(
            editCount = editCount,
            onUpgrade = {
                showLimitDialog = false
                currentScreen = Screen.Paywall
            },
            onDismiss = { showLimitDialog = false }
        )
    }
}

private fun isDefaultDialer(context: android.content.Context): Boolean {
    val telecomManager = context.getSystemService(android.content.Context.TELECOM_SERVICE) as? TelecomManager
    return telecomManager?.defaultDialerPackage == context.packageName
}

private fun requestDefaultDialer(context: android.content.Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = context.getSystemService(android.content.Context.ROLE_SERVICE) as? RoleManager
        if (roleManager?.isRoleAvailable(RoleManager.ROLE_DIALER) == true) {
            val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
            (context as? ComponentActivity)?.startActivityForResult(intent, 1001)
        }
    } else {
        val intent = Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER).apply {
            putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, context.packageName)
        }
        context.startActivity(intent)
    }
}
