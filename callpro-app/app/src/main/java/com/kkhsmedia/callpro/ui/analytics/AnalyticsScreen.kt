package com.kkhsmedia.callpro.ui.analytics

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kkhsmedia.callpro.data.model.CallAnalytics
import com.kkhsmedia.callpro.ui.theme.IncomingCall
import com.kkhsmedia.callpro.ui.theme.MissedCall
import com.kkhsmedia.callpro.ui.theme.OutgoingCall
import com.kkhsmedia.callpro.ui.theme.RejectedCall
import com.kkhsmedia.callpro.util.Formatters

@Composable
fun AnalyticsScreen(analytics: CallAnalytics) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Call Analytics",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Total Calls",
                    value = analytics.totalCalls.toString(),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Total Duration",
                    value = Formatters.formatDuration(analytics.totalDuration),
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Incoming",
                    value = analytics.totalIncoming.toString(),
                    color = IncomingCall,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Outgoing",
                    value = analytics.totalOutgoing.toString(),
                    color = OutgoingCall,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Missed",
                    value = analytics.totalMissed.toString(),
                    color = MissedCall,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Rejected",
                    value = analytics.totalRejected.toString(),
                    color = RejectedCall,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            StatCard(
                title = "Average Call Duration",
                value = Formatters.formatDuration(analytics.averageDuration),
                color = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.fillMaxWidth()
            )
        }

        if (analytics.mostCalledNumbers.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Most Called",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            val maxCount = analytics.mostCalledNumbers.maxOfOrNull { it.count } ?: 1

            itemsIndexed(analytics.mostCalledNumbers) { index, stat ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${index + 1}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.width(28.dp)
                        )

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = stat.name ?: stat.number,
                                fontWeight = FontWeight.Medium,
                                fontSize = 15.sp
                            )
                            if (stat.name != null) {
                                Text(
                                    text = stat.number,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = stat.count.toFloat() / maxCount,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(RoundedCornerShape(2.dp)),
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${stat.count} calls",
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = Formatters.formatDuration(stat.totalDuration),
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(RoundedCornerShape(1.5.dp))
                    .background(color.copy(alpha = 0.3f))
            )
        }
    }
}
