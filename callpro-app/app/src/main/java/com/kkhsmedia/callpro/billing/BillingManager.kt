package com.kkhsmedia.callpro.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class BillingManager(context: Context) : PurchasesUpdatedListener {

    companion object {
        const val MONTHLY_PRODUCT_ID = "callpro_monthly_49"
        const val YEARLY_PRODUCT_ID = "callpro_yearly_399"
        const val LIFETIME_PRODUCT_ID = "callpro_lifetime_999"
    }

    private val _purchaseState = MutableStateFlow<PurchaseState>(PurchaseState.Idle)
    val purchaseState: StateFlow<PurchaseState> = _purchaseState.asStateFlow()

    private val _productDetails = MutableStateFlow<Map<String, ProductDetails>>(emptyMap())
    val productDetails: StateFlow<Map<String, ProductDetails>> = _productDetails.asStateFlow()

    private var billingClient: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    fun startConnection(onConnected: () -> Unit = {}) {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts()
                    queryExistingPurchases()
                    onConnected()
                }
            }

            override fun onBillingServiceDisconnected() {
                // Retry on next user action
            }
        })
    }

    private fun queryProducts() {
        val subsProducts = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(MONTHLY_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(YEARLY_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        val inAppProducts = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(LIFETIME_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        )

        val subsParams = QueryProductDetailsParams.newBuilder()
            .setProductList(subsProducts)
            .build()

        billingClient.queryProductDetailsAsync(subsParams) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val details = _productDetails.value.toMutableMap()
                productDetailsList.forEach { details[it.productId] = it }
                _productDetails.value = details
            }
        }

        val inAppParams = QueryProductDetailsParams.newBuilder()
            .setProductList(inAppProducts)
            .build()

        billingClient.queryProductDetailsAsync(inAppParams) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val details = _productDetails.value.toMutableMap()
                productDetailsList.forEach { details[it.productId] = it }
                _productDetails.value = details
            }
        }
    }

    fun queryExistingPurchases() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val activeSub = purchases.any {
                    it.purchaseState == Purchase.PurchaseState.PURCHASED
                }
                if (activeSub) {
                    _purchaseState.value = PurchaseState.Purchased("subscription")
                }
            }
        }

        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        ) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val hasLifetime = purchases.any {
                    it.products.contains(LIFETIME_PRODUCT_ID) &&
                            it.purchaseState == Purchase.PurchaseState.PURCHASED
                }
                if (hasLifetime) {
                    _purchaseState.value = PurchaseState.Purchased("lifetime")
                }
            }
        }
    }

    fun launchPurchaseFlow(activity: Activity, planType: String) {
        val productId = when (planType) {
            "monthly" -> MONTHLY_PRODUCT_ID
            "yearly" -> YEARLY_PRODUCT_ID
            "lifetime" -> LIFETIME_PRODUCT_ID
            else -> return
        }

        val details = _productDetails.value[productId]
        if (details == null) {
            _purchaseState.value = PurchaseState.Error(
                "Product not available. Please try again later."
            )
            return
        }

        val productDetailsParamsList = if (planType == "lifetime") {
            listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .build()
            )
        } else {
            val offerToken = details.subscriptionOfferDetails?.firstOrNull()?.offerToken
            if (offerToken == null) {
                _purchaseState.value = PurchaseState.Error(
                    "Subscription offer not available. Please try again later."
                )
                return
            }
            listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(offerToken)
                    .build()
            )
        }

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        billingClient.launchBillingFlow(activity, billingFlowParams)
    }

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    handlePurchase(purchase)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                _purchaseState.value = PurchaseState.Idle
            }
            else -> {
                _purchaseState.value = PurchaseState.Error(
                    "Purchase failed. Please try again."
                )
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()

                billingClient.acknowledgePurchase(acknowledgePurchaseParams) { billingResult ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        val planType = when {
                            purchase.products.contains(LIFETIME_PRODUCT_ID) -> "lifetime"
                            purchase.products.contains(YEARLY_PRODUCT_ID) -> "yearly"
                            purchase.products.contains(MONTHLY_PRODUCT_ID) -> "monthly"
                            else -> "unknown"
                        }
                        _purchaseState.value = PurchaseState.Purchased(planType)
                    }
                }
            } else {
                val planType = when {
                    purchase.products.contains(LIFETIME_PRODUCT_ID) -> "lifetime"
                    purchase.products.contains(YEARLY_PRODUCT_ID) -> "yearly"
                    purchase.products.contains(MONTHLY_PRODUCT_ID) -> "monthly"
                    else -> "unknown"
                }
                _purchaseState.value = PurchaseState.Purchased(planType)
            }
        } else if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
            _purchaseState.value = PurchaseState.Pending
        }
    }

    fun endConnection() {
        billingClient.endConnection()
    }
}

sealed class PurchaseState {
    data object Idle : PurchaseState()
    data object Pending : PurchaseState()
    data class Purchased(val planType: String) : PurchaseState()
    data class Error(val message: String) : PurchaseState()
}
