package com.kkhsmedia.callpro.ui.dialer

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kkhsmedia.callpro.ui.theme.IncomingCall

@Composable
fun DialerScreen() {
    var dialedNumber by remember { mutableStateOf("") }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = dialedNumber.ifEmpty { "Enter number" },
            fontSize = if (dialedNumber.length > 12) 28.sp else 36.sp,
            fontWeight = FontWeight.Light,
            color = if (dialedNumber.isEmpty())
                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f)
            else MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
            maxLines = 1,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        val keys = listOf(
            listOf("1" to "", "2" to "ABC", "3" to "DEF"),
            listOf("4" to "GHI", "5" to "JKL", "6" to "MNO"),
            listOf("7" to "PQRS", "8" to "TUV", "9" to "WXYZ"),
            listOf("*" to "", "0" to "+", "#" to "")
        )

        keys.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                row.forEach { (digit, letters) ->
                    DialpadKey(
                        digit = digit,
                        letters = letters,
                        onClick = { dialedNumber += digit },
                        onLongClick = {
                            if (digit == "0") dialedNumber += "+"
                        }
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(modifier = Modifier.width(72.dp))

            IconButton(
                onClick = {
                    if (dialedNumber.isNotEmpty()) {
                        makeCall(context, dialedNumber)
                    }
                },
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(IncomingCall)
            ) {
                Icon(
                    Icons.Default.Call,
                    contentDescription = "Call",
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }

            Spacer(modifier = Modifier.width(24.dp))

            if (dialedNumber.isNotEmpty()) {
                IconButton(
                    onClick = {
                        if (dialedNumber.isNotEmpty()) {
                            dialedNumber = dialedNumber.dropLast(1)
                        }
                    },
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        Icons.Default.Backspace,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        modifier = Modifier.size(28.dp)
                    )
                }
            } else {
                Spacer(modifier = Modifier.width(48.dp))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun DialpadKey(
    digit: String,
    letters: String,
    onClick: () -> Unit,
    onLongClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = digit,
                fontSize = 28.sp,
                fontWeight = FontWeight.Normal,
                color = MaterialTheme.colorScheme.onBackground
            )
            if (letters.isNotEmpty()) {
                Text(
                    text = letters,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                    letterSpacing = 2.sp
                )
            }
        }
    }
}

fun makeCall(context: Context, number: String) {
    if (number.isBlank()) return
    try {
        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:${Uri.encode(number)}")
        }
        context.startActivity(intent)
    } catch (_: SecurityException) {
        try {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:${Uri.encode(number)}")
            }
            context.startActivity(dialIntent)
        } catch (_: Exception) {
            // No dialer available
        }
    } catch (_: Exception) {
        // Catch any unexpected errors
    }
}
