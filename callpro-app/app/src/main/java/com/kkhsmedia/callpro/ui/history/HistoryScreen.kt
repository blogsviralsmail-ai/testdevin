package com.kkhsmedia.callpro.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallMade
import androidx.compose.material.icons.filled.CallMissed
import androidx.compose.material.icons.filled.CallReceived
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PhoneDisabled
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SearchBar
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kkhsmedia.callpro.data.model.CallLogEntry
import com.kkhsmedia.callpro.ui.components.ContactAvatar
import com.kkhsmedia.callpro.ui.theme.IncomingCall
import com.kkhsmedia.callpro.ui.theme.MissedCall
import com.kkhsmedia.callpro.ui.theme.OutgoingCall
import com.kkhsmedia.callpro.ui.theme.RejectedCall
import com.kkhsmedia.callpro.util.Formatters

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    callLogs: List<CallLogEntry>,
    onEditClick: (CallLogEntry) -> Unit,
    onDeleteClick: (CallLogEntry) -> Unit,
    onCallClick: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchActive by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf<CallLogEntry?>(null) }

    val filteredLogs = if (searchQuery.isBlank()) callLogs
    else callLogs.filter {
        it.number.contains(searchQuery, ignoreCase = true) ||
                (it.name?.contains(searchQuery, ignoreCase = true) == true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SearchBar(
            query = searchQuery,
            onQueryChange = { searchQuery = it },
            onSearch = { searchActive = false },
            active = false,
            onActiveChange = { },
            placeholder = { Text("Search calls...") },
            leadingIcon = { Icon(Icons.Default.Search, "Search") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) { }

        if (filteredLogs.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "No call history",
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredLogs, key = { "${it.id}-${it.date}" }) { entry ->
                    CallLogItem(
                        entry = entry,
                        onEditClick = { onEditClick(entry) },
                        onDeleteClick = { showDeleteDialog = entry },
                        onCallClick = { onCallClick(entry.number) }
                    )
                }
            }
        }
    }

    showDeleteDialog?.let { entry ->
        AlertDialog(
            onDismissRequest = { showDeleteDialog = null },
            title = { Text("Delete Call Log") },
            text = { Text("Are you sure you want to delete this call log entry for ${entry.name ?: entry.number}?") },
            confirmButton = {
                TextButton(onClick = {
                    onDeleteClick(entry)
                    showDeleteDialog = null
                }) {
                    Text("Delete", color = MissedCall)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun CallLogItem(
    entry: CallLogEntry,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    onCallClick: () -> Unit
) {
    val (icon, color) = when (entry.type) {
        CallLogEntry.TYPE_INCOMING -> Icons.Default.CallReceived to IncomingCall
        CallLogEntry.TYPE_OUTGOING -> Icons.Default.CallMade to OutgoingCall
        CallLogEntry.TYPE_MISSED -> Icons.Default.CallMissed to MissedCall
        CallLogEntry.TYPE_REJECTED -> Icons.Default.PhoneDisabled to RejectedCall
        else -> Icons.Default.CallReceived to Color.Gray
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable(onClick = onCallClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ContactAvatar(name = entry.name ?: entry.number, size = 48.dp)

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.name ?: entry.number,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = if (entry.type == CallLogEntry.TYPE_MISSED) MissedCall
                    else MaterialTheme.colorScheme.onSurface
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (entry.name != null) entry.number else CallLogEntry.typeToString(entry.type),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Row {
                    Text(
                        text = Formatters.formatDate(entry.date),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                    if (entry.duration > 0) {
                        Text(
                            text = " • ${Formatters.formatDuration(entry.duration)}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                        )
                    }
                }
            }

            IconButton(onClick = onEditClick, modifier = Modifier.size(36.dp)) {
                Icon(
                    Icons.Default.Edit,
                    contentDescription = "Edit",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
            }

            IconButton(onClick = onDeleteClick, modifier = Modifier.size(36.dp)) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = MissedCall,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
