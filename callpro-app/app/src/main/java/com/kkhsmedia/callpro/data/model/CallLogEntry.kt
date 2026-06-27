package com.kkhsmedia.callpro.data.model

data class CallLogEntry(
    val id: Long,
    val number: String,
    val name: String?,
    val type: Int,
    val date: Long,
    val duration: Long,
    val isNew: Boolean = false,
    val cachedName: String? = null,
    val simId: String? = null
) {
    companion object {
        const val TYPE_INCOMING = 1
        const val TYPE_OUTGOING = 2
        const val TYPE_MISSED = 3
        const val TYPE_VOICEMAIL = 4
        const val TYPE_REJECTED = 5
        const val TYPE_BLOCKED = 6

        fun typeToString(type: Int): String = when (type) {
            TYPE_INCOMING -> "Incoming"
            TYPE_OUTGOING -> "Outgoing"
            TYPE_MISSED -> "Missed"
            TYPE_VOICEMAIL -> "Voicemail"
            TYPE_REJECTED -> "Rejected"
            TYPE_BLOCKED -> "Blocked"
            else -> "Unknown"
        }
    }
}
