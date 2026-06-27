package com.kkhsmedia.callpro.ui.subscription

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.android.billingclient.api.ProductDetails

data class PlanPricing(
    val monthlyPrice: String?,
    val monthlyPeriod: String,
    val yearlyPrice: String?,
    val yearlyPeriod: String,
    val yearlyOriginalPrice: String?,
    val lifetimePrice: String?,
    val lifetimePeriod: String
)

fun extractPricing(productDetails: Map<String, ProductDetails>): PlanPricing {
    val monthlyDetails = productDetails["callpro_monthly_49"]
    val yearlyDetails = productDetails["callpro_yearly_399"]
    val lifetimeDetails = productDetails["callpro_lifetime_999"]

    val monthlyPrice = monthlyDetails?.subscriptionOfferDetails
        ?.firstOrNull()?.pricingPhases?.pricingPhaseList
        ?.firstOrNull()?.formattedPrice

    val yearlyPrice = yearlyDetails?.subscriptionOfferDetails
        ?.firstOrNull()?.pricingPhases?.pricingPhaseList
        ?.firstOrNull()?.formattedPrice

    val lifetimePrice = lifetimeDetails?.oneTimePurchaseOfferDetails?.formattedPrice

    val monthlyMicros = monthlyDetails?.subscriptionOfferDetails
        ?.firstOrNull()?.pricingPhases?.pricingPhaseList
        ?.firstOrNull()?.priceAmountMicros ?: 0L

    val yearlyOriginalPrice = if (monthlyMicros > 0) {
        val annualFromMonthly = monthlyMicros * 12
        val currencyCode = monthlyDetails?.subscriptionOfferDetails
            ?.firstOrNull()?.pricingPhases?.pricingPhaseList
            ?.firstOrNull()?.priceCurrencyCode ?: ""
        val amountWhole = annualFromMonthly / 1_000_000
        formatSimplePrice(amountWhole, currencyCode)
    } else null

    return PlanPricing(
        monthlyPrice = monthlyPrice,
        monthlyPeriod = "/month",
        yearlyPrice = yearlyPrice,
        yearlyPeriod = "/year",
        yearlyOriginalPrice = yearlyOriginalPrice,
        lifetimePrice = lifetimePrice,
        lifetimePeriod = "one-time"
    )
}

private fun formatSimplePrice(amount: Long, currencyCode: String): String {
    return when (currencyCode) {
        "INR" -> "\u20B9$amount"
        "USD" -> "\$$amount"
        "EUR" -> "\u20AC$amount"
        "GBP" -> "\u00A3$amount"
        else -> "$currencyCode $amount"
    }
}

@Composable
fun PaywallScreen(
    editCount: Int,
    productDetails: Map<String, ProductDetails> = emptyMap(),
    errorMessage: String? = null,
    onSubscribe: (planType: String) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedPlan by remember { mutableStateOf("yearly") }
    val pricing = remember(productDetails) { extractPricing(productDetails) }
    val hasLoadedPrices = pricing.monthlyPrice != null || pricing.lifetimePrice != null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF1A73E8),
                            Color(0xFF0D47A1)
                        )
                    )
                )
                .padding(24.dp)
        ) {
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.align(Alignment.TopEnd)
            ) {
                Icon(Icons.Default.Close, "Close", tint = Color.White)
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.WorkspacePremium,
                        contentDescription = null,
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Upgrade to Premium",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "You've used $editCount of 10 free edits",
                    fontSize = 15.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Unlock unlimited edits with Premium!",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Premium Features",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = 8.dp)
            )

            val features = listOf(
                "Unlimited call log edits",
                "Add unlimited fake call entries",
                "Delete any call log entry",
                "Edit contact names in call history",
                "Full backup & restore",
                "Export to CSV & JSON",
                "App lock with PIN",
                "Priority support"
            )

            features.forEach { feature ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = null,
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = feature, fontSize = 14.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Choose Your Plan",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold
            )

            if (!hasLoadedPrices) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(32.dp),
                            color = Color(0xFF1A73E8)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Loading prices...",
                            fontSize = 14.sp,
                            color = Color.Gray
                        )
                    }
                }
            } else {
                if (pricing.monthlyPrice != null) {
                    PlanCard(
                        title = "Monthly",
                        price = pricing.monthlyPrice,
                        period = pricing.monthlyPeriod,
                        isSelected = selectedPlan == "monthly",
                        onClick = { selectedPlan = "monthly" }
                    )
                }

                if (pricing.yearlyPrice != null) {
                    PlanCard(
                        title = "Yearly",
                        price = pricing.yearlyPrice,
                        period = pricing.yearlyPeriod,
                        badge = "SAVE 32%",
                        originalPrice = pricing.yearlyOriginalPrice,
                        isSelected = selectedPlan == "yearly",
                        isRecommended = true,
                        onClick = { selectedPlan = "yearly" }
                    )
                }

                if (pricing.lifetimePrice != null) {
                    PlanCard(
                        title = "Lifetime",
                        price = pricing.lifetimePrice,
                        period = pricing.lifetimePeriod,
                        badge = "BEST VALUE",
                        isSelected = selectedPlan == "lifetime",
                        onClick = { selectedPlan = "lifetime" }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = { onSubscribe(selectedPlan) },
                enabled = hasLoadedPrices,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1A73E8)
                )
            ) {
                Icon(Icons.Default.Star, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Subscribe Now",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }

            if (errorMessage != null) {
                Text(
                    text = errorMessage,
                    fontSize = 13.sp,
                    color = Color(0xFFF44336),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
            }

            Text(
                text = "Cancel anytime \u2022 Secure payment via Google Play",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun PlanCard(
    title: String,
    price: String,
    period: String,
    badge: String? = null,
    originalPrice: String? = null,
    isSelected: Boolean = false,
    isRecommended: Boolean = false,
    onClick: () -> Unit
) {
    val borderColor = if (isSelected) Color(0xFF1A73E8) else Color.LightGray
    val bgColor = if (isSelected)
        Color(0xFF1A73E8).copy(alpha = 0.05f)
    else
        MaterialTheme.colorScheme.surface

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isSelected) 4.dp else 1.dp
        ),
        colors = CardDefaults.cardColors(containerColor = bgColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(CircleShape)
                    .border(
                        width = 2.dp,
                        color = if (isSelected) Color(0xFF1A73E8) else Color.LightGray,
                        shape = CircleShape
                    )
                    .then(
                        if (isSelected)
                            Modifier.background(Color(0xFF1A73E8), CircleShape)
                        else Modifier
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isSelected) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    if (badge != null) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(
                                    if (isRecommended) Color(0xFF4CAF50)
                                    else Color(0xFFFF6F00)
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = badge,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                if (originalPrice != null) {
                    Text(
                        text = originalPrice,
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textDecoration = TextDecoration.LineThrough
                    )
                }
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = price,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = if (isSelected) Color(0xFF1A73E8)
                        else MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = period,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        modifier = Modifier.padding(bottom = 2.dp, start = 2.dp)
                    )
                }
            }
        }
    }
}
