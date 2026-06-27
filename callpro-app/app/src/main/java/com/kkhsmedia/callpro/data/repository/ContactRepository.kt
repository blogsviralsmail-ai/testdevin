package com.kkhsmedia.callpro.data.repository

import android.content.Context
import android.provider.ContactsContract
import com.kkhsmedia.callpro.data.model.Contact
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ContactRepository(private val context: Context) {

    suspend fun getContacts(): List<Contact> = withContext(Dispatchers.IO) {
        val contacts = mutableListOf<Contact>()
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.PHOTO_URI
        )

        try {
            context.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                null,
                null,
                "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"
            )?.use { cursor ->
                val idIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numberIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val photoIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI)

                val seen = mutableSetOf<String>()
                while (cursor.moveToNext()) {
                    val number = cursor.getString(numberIdx)?.replace("\\s".toRegex(), "") ?: continue
                    val name = cursor.getString(nameIdx) ?: continue
                    val key = "$name-$number"
                    if (key in seen) continue
                    seen.add(key)

                    contacts.add(
                        Contact(
                            id = cursor.getLong(idIdx),
                            name = name,
                            phoneNumber = number,
                            photoUri = cursor.getString(photoIdx)
                        )
                    )
                }
            }
        } catch (e: SecurityException) {
            // Permission not granted
        }
        contacts
    }

    suspend fun searchContacts(query: String): List<Contact> = withContext(Dispatchers.IO) {
        if (query.isBlank()) return@withContext emptyList()
        getContacts().filter {
            it.name.contains(query, ignoreCase = true) ||
                    it.phoneNumber.contains(query)
        }
    }

    fun getContactName(phoneNumber: String): String? {
        try {
            val uri = android.net.Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                android.net.Uri.encode(phoneNumber)
            )
            context.contentResolver.query(
                uri,
                arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME),
                null, null, null
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    return cursor.getString(0)
                }
            }
        } catch (_: Exception) { }
        return null
    }
}
