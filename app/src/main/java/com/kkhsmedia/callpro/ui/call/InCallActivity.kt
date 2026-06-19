package com.kkhsmedia.callpro.ui.call

import android.os.Bundle
import android.telecom.Call
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kkhsmedia.callpro.service.CallManager
import com.kkhsmedia.callpro.ui.theme.CallProTheme
import com.kkhsmedia.callpro.ui.theme.IncomingCall
import com.kkhsmedia.callpro.ui.theme.MissedCall

class InCallActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CallProTheme {
                InCallScreen(onFinish = { finish() })
            }
        }
    }
}

@Composable
fun InCallScreen(onFinish: () -> Unit) {
    var callState by remember { mutableIntStateOf(CallManager.getState()) }
    var callerNumber by remember { mutableStateOf(CallManager.getCallerNumber()) }
    var isMuted by remember { mutableStateOf(false) }
    var isSpeaker by remember { mutableStateOf(false) }

    DisposableEffect(Unit) {
        val listener: (Call?) -> Unit = { call ->
            callState = call?.state ?: Call.STATE_DISCONNECTED
            callerNumber = CallManager.getCallerNumber()
            if (callState == Call.STATE_DISCONNECTED) {
                onFinish()
            }
        }
        CallManager.addListener(listener)
        onDispose { CallManager.removeListener(listener) }
    }

    val stateText = when (callState) {
        Call.STATE_RINGING -> "Incoming Call"
        Call.STATE_DIALING -> "Calling..."
        Call.STATE_ACTIVE -> "On Call"
        Call.STATE_HOLDING -> "On Hold"
        Call.STATE_CONNECTING -> "Connecting..."
        else -> "Call Ended"
    }

    val isRinging = callState == Call.STATE_RINGING

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(80.dp))

            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (callerNumber.length >= 2) callerNumber.takeLast(2) else "#",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = callerNumber,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stateText,
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.weight(1f))

            if (!isRinging) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    CallActionButton(
                        icon = Icons.Default.MicOff,
                        label = if (isMuted) "Unmute" else "Mute",
                        isActive = isMuted,
                        onClick = { isMuted = !isMuted }
                    )
                    CallActionButton(
                        icon = Icons.Default.VolumeUp,
                        label = if (isSpeaker) "Earpiece" else "Speaker",
                        isActive = isSpeaker,
                        onClick = { isSpeaker = !isSpeaker }
                    )
                }
                Spacer(modifier = Modifier.height(40.dp))
            }

            if (isRinging) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    IconButton(
                        onClick = { CallManager.reject() },
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(MissedCall)
                    ) {
                        Icon(
                            Icons.Default.CallEnd,
                            contentDescription = "Reject",
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                    IconButton(
                        onClick = { CallManager.answer() },
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(IncomingCall)
                    ) {
                        Icon(
                            Icons.Default.Call,
                            contentDescription = "Answer",
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
            } else {
                IconButton(
                    onClick = { CallManager.hangup() },
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(MissedCall)
                ) {
                    Icon(
                        Icons.Default.CallEnd,
                        contentDescription = "End Call",
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Composable
fun CallActionButton(
    icon: ImageVector,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(
                    if (isActive) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.surfaceVariant
                )
        ) {
            Icon(
                icon,
                contentDescription = label,
                tint = if (isActive) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(28.dp)
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
        )
    }
}
