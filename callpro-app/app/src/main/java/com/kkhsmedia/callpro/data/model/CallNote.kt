package com.kkhsmedia.callpro.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "call_notes")
data class CallNote(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val callLogId: Long,
    val phoneNumber: String,
    val note: String,
    val label: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
