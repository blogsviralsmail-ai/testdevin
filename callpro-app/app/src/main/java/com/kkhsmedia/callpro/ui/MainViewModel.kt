package com.kkhsmedia.callpro.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kkhsmedia.callpro.data.database.AppDatabase
import com.kkhsmedia.callpro.data.model.CallAnalytics
import com.kkhsmedia.callpro.data.model.CallLogEntry
import com.kkhsmedia.callpro.data.model.CallNote
import com.kkhsmedia.callpro.data.model.Contact
import com.kkhsmedia.callpro.data.repository.BackupRepository
import com.kkhsmedia.callpro.data.repository.CallLogRepository
import com.kkhsmedia.callpro.data.repository.ContactRepository
import com.kkhsmedia.callpro.util.PreferencesManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val callLogRepo = CallLogRepository(application)
    private val contactRepo = ContactRepository(application)
    val backupRepo = BackupRepository(application)
    private val database = AppDatabase.getInstance(application)
    private val noteDao = database.callNoteDao()
    val preferencesManager = PreferencesManager(application)

    private val _callLogs = MutableStateFlow<List<CallLogEntry>>(emptyList())
    val callLogs: StateFlow<List<CallLogEntry>> = _callLogs.asStateFlow()

    private val _contacts = MutableStateFlow<List<Contact>>(emptyList())
    val contacts: StateFlow<List<Contact>> = _contacts.asStateFlow()

    private val _analytics = MutableStateFlow(CallAnalytics())
    val analytics: StateFlow<CallAnalytics> = _analytics.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    val notes = noteDao.getAllNotes().stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val isDarkMode = preferencesManager.darkMode.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), false
    )

    val isAppLockEnabled = preferencesManager.appLockEnabled.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), false
    )

    val appLockPin = preferencesManager.appLockPin.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), ""
    )

    fun loadCallLogs() {
        viewModelScope.launch {
            _callLogs.value = callLogRepo.getCallLogs()
        }
    }

    fun loadContacts() {
        viewModelScope.launch {
            _contacts.value = contactRepo.getContacts()
        }
    }

    fun loadAnalytics() {
        viewModelScope.launch {
            _analytics.value = callLogRepo.getAnalytics()
        }
    }

    fun editCallLog(
        callLogId: Long,
        newNumber: String?,
        newName: String?,
        newDate: Long?,
        newDuration: Long?,
        newType: Int?
    ) {
        viewModelScope.launch {
            val success = callLogRepo.editCallLog(callLogId, newNumber, newName, newDate, newDuration, newType)
            if (success) {
                _statusMessage.value = "Call log updated successfully"
                loadCallLogs()
            } else {
                _statusMessage.value = "Failed to update call log"
            }
        }
    }

    fun addCallLog(number: String, type: Int, date: Long, duration: Long) {
        viewModelScope.launch {
            val success = callLogRepo.addCallLog(number, type, date, duration)
            if (success) {
                _statusMessage.value = "Call log added successfully"
                loadCallLogs()
            } else {
                _statusMessage.value = "Failed to add call log"
            }
        }
    }

    fun deleteCallLog(callLogId: Long) {
        viewModelScope.launch {
            val success = callLogRepo.deleteCallLog(callLogId)
            if (success) {
                _statusMessage.value = "Call log deleted"
                loadCallLogs()
            } else {
                _statusMessage.value = "Failed to delete call log"
            }
        }
    }

    fun deleteAllCallLogs() {
        viewModelScope.launch {
            val count = callLogRepo.deleteAllCallLogs()
            _statusMessage.value = "$count call logs deleted"
            loadCallLogs()
        }
    }

    fun saveNote(callLogId: Long, phoneNumber: String, noteText: String, label: String?) {
        viewModelScope.launch {
            val existingNote = noteDao.getNoteForCallLog(callLogId)
            if (existingNote != null) {
                noteDao.updateNote(
                    existingNote.copy(
                        note = noteText,
                        label = label,
                        updatedAt = System.currentTimeMillis()
                    )
                )
            } else {
                noteDao.insertNote(
                    CallNote(
                        callLogId = callLogId,
                        phoneNumber = phoneNumber,
                        note = noteText,
                        label = label
                    )
                )
            }
            _statusMessage.value = "Note saved"
        }
    }

    fun updateNote(note: CallNote, newText: String, newLabel: String?) {
        viewModelScope.launch {
            noteDao.updateNote(
                note.copy(
                    note = newText,
                    label = newLabel,
                    updatedAt = System.currentTimeMillis()
                )
            )
        }
    }

    fun deleteNote(note: CallNote) {
        viewModelScope.launch {
            noteDao.deleteNote(note)
            _statusMessage.value = "Note deleted"
        }
    }

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch { preferencesManager.setDarkMode(enabled) }
    }

    fun setAppLockEnabled(enabled: Boolean) {
        viewModelScope.launch { preferencesManager.setAppLockEnabled(enabled) }
    }

    fun setAppLockPin(pin: String) {
        viewModelScope.launch { preferencesManager.setAppLockPin(pin) }
    }

    fun restoreNotes(notes: List<CallNote>) {
        viewModelScope.launch {
            notes.forEach { note ->
                noteDao.insertNote(note)
            }
        }
    }

    fun clearStatusMessage() {
        _statusMessage.value = null
    }

    suspend fun getNoteForCallLog(callLogId: Long): CallNote? {
        return noteDao.getNoteForCallLog(callLogId)
    }
}
