package com.kkhsmedia.callpro.data.repository

import android.content.Context
import android.net.Uri
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.kkhsmedia.callpro.data.model.BackupData
import com.kkhsmedia.callpro.data.model.CallLogEntry
import com.kkhsmedia.callpro.data.model.CallNote
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader

class BackupRepository(private val context: Context) {

    private val gson: Gson = GsonBuilder().setPrettyPrinting().create()

    suspend fun createBackup(
        uri: Uri,
        callLogs: List<CallLogEntry>,
        notes: List<CallNote>
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val backupData = BackupData(
                callLogs = callLogs,
                notes = notes
            )
            val json = gson.toJson(backupData)
            context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                outputStream.write(json.toByteArray())
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun restoreBackup(uri: Uri): BackupData? = withContext(Dispatchers.IO) {
        try {
            context.contentResolver.openInputStream(uri)?.use { inputStream ->
                val reader = BufferedReader(InputStreamReader(inputStream))
                val json = reader.readText()
                gson.fromJson(json, BackupData::class.java)
            }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun exportToCsv(uri: Uri, callLogs: List<CallLogEntry>): Boolean =
        withContext(Dispatchers.IO) {
            try {
                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    val header = "ID,Number,Name,Type,Date,Duration,SIM\n"
                    outputStream.write(header.toByteArray())
                    callLogs.forEach { log ->
                        val line = "${log.id},\"${log.number}\",\"${log.name ?: ""}\",${
                            CallLogEntry.typeToString(log.type)
                        },${log.date},${log.duration},\"${log.simId ?: ""}\"\n"
                        outputStream.write(line.toByteArray())
                    }
                }
                true
            } catch (e: Exception) {
                false
            }
        }

    suspend fun exportToJson(uri: Uri, callLogs: List<CallLogEntry>): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val json = gson.toJson(callLogs)
                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(json.toByteArray())
                }
                true
            } catch (e: Exception) {
                false
            }
        }
}
