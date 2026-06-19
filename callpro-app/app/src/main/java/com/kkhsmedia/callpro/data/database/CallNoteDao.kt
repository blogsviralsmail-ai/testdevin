package com.kkhsmedia.callpro.data.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.kkhsmedia.callpro.data.model.CallNote
import kotlinx.coroutines.flow.Flow

@Dao
interface CallNoteDao {
    @Query("SELECT * FROM call_notes ORDER BY updatedAt DESC")
    fun getAllNotes(): Flow<List<CallNote>>

    @Query("SELECT * FROM call_notes WHERE callLogId = :callLogId LIMIT 1")
    suspend fun getNoteForCallLog(callLogId: Long): CallNote?

    @Query("SELECT * FROM call_notes WHERE phoneNumber = :number ORDER BY updatedAt DESC")
    fun getNotesForNumber(number: String): Flow<List<CallNote>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: CallNote): Long

    @Update
    suspend fun updateNote(note: CallNote)

    @Delete
    suspend fun deleteNote(note: CallNote)

    @Query("DELETE FROM call_notes")
    suspend fun deleteAllNotes()

    @Query("SELECT * FROM call_notes WHERE note LIKE '%' || :query || '%' OR label LIKE '%' || :query || '%'")
    fun searchNotes(query: String): Flow<List<CallNote>>
}
