package com.kkhsmedia.callpro.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object Formatters {

    fun formatDuration(seconds: Long): String {
        val hours = TimeUnit.SECONDS.toHours(seconds)
        val minutes = TimeUnit.SECONDS.toMinutes(seconds) % 60
        val secs = seconds % 60

        return when {
            hours > 0 -> String.format("%d:%02d:%02d", hours, minutes, secs)
            minutes > 0 -> String.format("%d:%02d", minutes, secs)
            else -> String.format("0:%02d", secs)
        }
    }

    fun formatDate(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        val dayMs = 86400000L

        return when {
            diff < dayMs -> {
                SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(timestamp))
            }
            diff < 2 * dayMs -> "Yesterday"
            diff < 7 * dayMs -> {
                SimpleDateFormat("EEEE", Locale.getDefault()).format(Date(timestamp))
            }
            else -> {
                SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(timestamp))
            }
        }
    }

    fun formatDateTime(timestamp: Long): String {
        return SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date(timestamp))
    }

    fun formatFullDate(timestamp: Long): String {
        return SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date(timestamp))
    }

    fun formatTime(timestamp: Long): String {
        return SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(timestamp))
    }

    fun getInitials(name: String?): String {
        if (name.isNullOrBlank()) return "#"
        val parts = name.trim().split("\\s+".toRegex()).filter { it.isNotEmpty() }
        return try {
            when {
                parts.size >= 2 -> "${parts[0].first().uppercase()}${parts[1].first().uppercase()}"
                parts.size == 1 && parts[0].isNotEmpty() -> parts[0].first().uppercase()
                else -> "#"
            }
        } catch (_: Exception) {
            "#"
        }
    }
}
