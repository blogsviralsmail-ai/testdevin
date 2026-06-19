package com.kkhsmedia.callpro.data.model

data class BackupData(
    val version: Int = 1,
    val appName: String = "CallPro: Call Log Editor, Backup & Dialer",
    val createdAt: Long = System.currentTimeMillis(),
    val callLogs: List<CallLogEntry>,
    val notes: List<CallNote>
)

data class CallAnalytics(
    val totalCalls: Int = 0,
    val totalIncoming: Int = 0,
    val totalOutgoing: Int = 0,
    val totalMissed: Int = 0,
    val totalRejected: Int = 0,
    val totalDuration: Long = 0,
    val averageDuration: Long = 0,
    val mostCalledNumbers: List<NumberStat> = emptyList(),
    val callsByDay: Map<String, Int> = emptyMap(),
    val callsByHour: Map<Int, Int> = emptyMap()
)

data class NumberStat(
    val number: String,
    val name: String?,
    val count: Int,
    val totalDuration: Long
)

data class Contact(
    val id: Long,
    val name: String,
    val phoneNumber: String,
    val photoUri: String? = null
)
