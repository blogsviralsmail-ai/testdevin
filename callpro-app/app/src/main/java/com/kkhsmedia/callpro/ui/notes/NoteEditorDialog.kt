package com.kkhsmedia.callpro.ui.notes

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kkhsmedia.callpro.data.model.CallNote

@Composable
fun NoteEditorDialog(
    existingNote: CallNote?,
    phoneNumber: String,
    callLogId: Long,
    onSave: (note: String, label: String?) -> Unit,
    onDismiss: () -> Unit
) {
    var noteText by remember { mutableStateOf(existingNote?.note ?: "") }
    var labelText by remember { mutableStateOf(existingNote?.label ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = if (existingNote != null) "Edit Note" else "Add Note")
        },
        text = {
            Column {
                Text(text = "Number: $phoneNumber")
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = labelText,
                    onValueChange = { labelText = it },
                    label = { Text("Label (optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("e.g. Work, Personal, Important") }
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = noteText,
                    onValueChange = { noteText = it },
                    label = { Text("Note") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Add your notes here...") }
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (noteText.isNotBlank()) {
                        onSave(noteText, labelText.ifBlank { null })
                    }
                },
                enabled = noteText.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
