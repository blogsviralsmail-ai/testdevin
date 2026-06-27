package com.kkhsmedia.callpro.data.repository

import android.content.ContentValues
import android.content.Context
import android.provider.CallLog
import com.kkhsmedia.callpro.data.model.CallAnalytics
import com.kkhsmedia.callpro.data.model.CallLogEntry
import com.kkhsmedia.callpro.data.model.NumberStat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class CallLogRepository(private val context: Context) {

    suspend fun getCallLogs(limit: Int = 500): List<CallLogEntry> = withContext(Dispatchers.IO) {
        val callLogs = mutableListOf<CallLogEntry>()
        val projection = arrayOf(
            CallLog.Calls._ID,
            CallLog.Calls.NUMBER,
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
            CallLog.Calls.DURATION,
            CallLog.Calls.IS_READ,
            CallLog.Calls.PHONE_ACCOUNT_ID
        )

        try {
            context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )?.use { cursor ->
                val idIdx = cursor.getColumnIndex(CallLog.Calls._ID)
                val numberIdx = cursor.getColumnIndex(CallLog.Calls.NUMBER)
                val nameIdx = cursor.getColumnIndex(CallLog.Calls.CACHED_NAME)
                val typeIdx = cursor.getColumnIndex(CallLog.Calls.TYPE)
                val dateIdx = cursor.getColumnIndex(CallLog.Calls.DATE)
                val durationIdx = cursor.getColumnIndex(CallLog.Calls.DURATION)
                val simIdx = cursor.getColumnIndex(CallLog.Calls.PHONE_ACCOUNT_ID)

                var count = 0
                while (cursor.moveToNext() && count < limit) {
                    try {
                        callLogs.add(
                            CallLogEntry(
                                id = cursor.getLong(idIdx),
                                number = cursor.getString(numberIdx) ?: "",
                                name = cursor.getString(nameIdx),
                                type = cursor.getInt(typeIdx),
                                date = cursor.getLong(dateIdx),
                                duration = cursor.getLong(durationIdx),
                                simId = cursor.getString(simIdx)
                            )
                        )
                    } catch (_: Exception) {
                        // Skip malformed entries
                    }
                    count++
                }
            }
        } catch (e: SecurityException) {
            // Permission not granted
        }
        callLogs
    }

    suspend fun editCallLog(
        callLogId: Long,
        newNumber: String? = null,
        newName: String? = null,
        newDate: Long? = null,
        newDuration: Long? = null,
        newType: Int? = null
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val values = ContentValues()
            newNumber?.let { values.put(CallLog.Calls.NUMBER, it) }
            newName?.let { values.put(CallLog.Calls.CACHED_NAME, it) }
            newDate?.let { values.put(CallLog.Calls.DATE, it) }
            newDuration?.let { values.put(CallLog.Calls.DURATION, it) }
            newType?.let { values.put(CallLog.Calls.TYPE, it) }

            if (values.size() == 0) return@withContext false

            val rowsUpdated = context.contentResolver.update(
                CallLog.Calls.CONTENT_URI,
                values,
                "${CallLog.Calls._ID} = ?",
                arrayOf(callLogId.toString())
            )
            rowsUpdated > 0
        } catch (e: Exception) {
            false
        }
    }

    suspend fun addCallLog(
        number: String,
        type: Int,
        date: Long,
        duration: Long
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val values = ContentValues().apply {
                put(CallLog.Calls.NUMBER, number)
                put(CallLog.Calls.TYPE, type)
                put(CallLog.Calls.DATE, date)
                put(CallLog.Calls.DURATION, duration)
                put(CallLog.Calls.NEW, 1)
            }
            val uri = context.contentResolver.insert(CallLog.Calls.CONTENT_URI, values)
            uri != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun deleteCallLog(callLogId: Long): Boolean = withContext(Dispatchers.IO) {
        try {
            val rowsDeleted = context.contentResolver.delete(
                CallLog.Calls.CONTENT_URI,
                "${CallLog.Calls._ID} = ?",
                arrayOf(callLogId.toString())
            )
            rowsDeleted > 0
        } catch (e: Exception) {
            false
        }
    }

    suspend fun deleteAllCallLogs(): Int = withContext(Dispatchers.IO) {
        try {
            context.contentResolver.delete(CallLog.Calls.CONTENT_URI, null, null)
        } catch (e: Exception) {
            0
        }
    }

    suspend fun getAnalytics(): CallAnalytics = withContext(Dispatchers.IO) {
        val logs = getCallLogs(limit = 5000)
        if (logs.isEmpty()) return@withContext CallAnalytics()

        val totalCalls = logs.size
        val incoming = logs.count { it.type == CallLogEntry.TYPE_INCOMING }
        val outgoing = logs.count { it.type == CallLogEntry.TYPE_OUTGOING }
        val missed = logs.count { it.type == CallLogEntry.TYPE_MISSED }
        val rejected = logs.count { it.type == CallLogEntry.TYPE_REJECTED }
        val totalDuration = logs.sumOf { it.duration }
        val avgDuration = if (totalCalls > 0) totalDuration / totalCalls else 0

        val numberStats = logs.groupBy { it.number }
            .map { (number, entries) ->
                NumberStat(
                    number = number,
                    name = entries.firstOrNull()?.name,
                    count = entries.size,
                    totalDuration = entries.sumOf { it.duration }
                )
            }
            .sortedByDescending { it.count }
            .take(10)

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val callsByDay = logs.groupBy { dateFormat.format(Date(it.date)) }
            .mapValues { it.value.size }

        val cal = Calendar.getInstance()
        val callsByHour = logs.groupBy {
            cal.timeInMillis = it.date
            cal.get(Calendar.HOUR_OF_DAY)
        }.mapValues { it.value.size }

        CallAnalytics(
            totalCalls = totalCalls,
            totalIncoming = incoming,
            totalOutgoing = outgoing,
            totalMissed = missed,
            totalRejected = rejected,
            totalDuration = totalDuration,
            averageDuration = avgDuration,
            mostCalledNumbers = numberStats,
            callsByDay = callsByDay,
            callsByHour = callsByHour
        )
    }
}
