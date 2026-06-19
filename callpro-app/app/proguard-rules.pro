# Keep Room entities
-keep class com.kkhsmedia.callpro.data.** { *; }

# Keep Gson models
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }

# Keep Google Play Billing
-keep class com.android.vending.billing.** { *; }
-keep class com.kkhsmedia.callpro.billing.** { *; }
