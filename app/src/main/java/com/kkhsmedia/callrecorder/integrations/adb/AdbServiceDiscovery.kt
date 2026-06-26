/*
 * APP Call Recorder by KKHS Media Private Limited
 * Based on ShizuCallRecorder (GPL-3.0) by kitsumed (Med)
 */

package com.kkhsmedia.callrecorder.integrations.adb

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import com.kkhsmedia.callrecorder.utils.AppLogger
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/**
 * Discovers ADB Wireless Debugging pairing service via mDNS/NSD.
 * When user taps "Pair device with pairing code" in settings,
 * a mDNS service of type _adb-tls-pairing._tcp is broadcast.
 * This class discovers it automatically to get IP and port.
 */
class AdbServiceDiscovery(private val context: Context) {

    companion object {
        private const val TAG = "SCR:AdbServiceDiscovery"
        private const val PAIRING_SERVICE_TYPE = "_adb-tls-pairing._tcp."
        private const val ADB_SERVICE_TYPE = "_adb-tls-connect._tcp."
    }

    data class DiscoveredService(val host: String, val port: Int)

    /**
     * Discover ADB pairing service. Returns host and port if found within timeout.
     * User must have "Pair device with pairing code" dialog open for this to work.
     */
    suspend fun discoverPairingService(timeoutMs: Long = 15000): DiscoveredService? {
        return withTimeoutOrNull(timeoutMs) {
            discoverService(PAIRING_SERVICE_TYPE)
        }
    }

    /**
     * Discover ADB connect service (for after pairing is done).
     */
    suspend fun discoverConnectService(timeoutMs: Long = 10000): DiscoveredService? {
        return withTimeoutOrNull(timeoutMs) {
            discoverService(ADB_SERVICE_TYPE)
        }
    }

    private suspend fun discoverService(serviceType: String): DiscoveredService? =
        suspendCancellableCoroutine { cont ->
            val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
            var discoveryListener: NsdManager.DiscoveryListener? = null
            var resolved = false

            val resolveListener = object : NsdManager.ResolveListener {
                override fun onResolveFailed(serviceInfo: NsdServiceInfo?, errorCode: Int) {
                    AppLogger.w(TAG, "NSD resolve failed: code=$errorCode")
                    if (!resolved && cont.isActive) {
                        resolved = true
                        cont.resume(null)
                    }
                }

                override fun onServiceResolved(serviceInfo: NsdServiceInfo?) {
                    if (serviceInfo != null && !resolved && cont.isActive) {
                        resolved = true
                        val host = serviceInfo.host?.hostAddress ?: "127.0.0.1"
                        val port = serviceInfo.port
                        AppLogger.i(TAG, "NSD resolved: $host:$port")
                        try {
                            discoveryListener?.let { nsdManager.stopServiceDiscovery(it) }
                        } catch (_: Exception) {}
                        cont.resume(DiscoveredService(host, port))
                    }
                }
            }

            discoveryListener = object : NsdManager.DiscoveryListener {
                override fun onDiscoveryStarted(regType: String) {
                    AppLogger.i(TAG, "NSD discovery started for $regType")
                }

                override fun onServiceFound(service: NsdServiceInfo?) {
                    if (service != null) {
                        AppLogger.i(TAG, "NSD service found: ${service.serviceName} type=${service.serviceType}")
                        nsdManager.resolveService(service, resolveListener)
                    }
                }

                override fun onServiceLost(service: NsdServiceInfo?) {
                    AppLogger.w(TAG, "NSD service lost: ${service?.serviceName}")
                }

                override fun onDiscoveryStopped(serviceType: String) {
                    AppLogger.i(TAG, "NSD discovery stopped")
                }

                override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                    AppLogger.e(TAG, "NSD start discovery failed: code=$errorCode")
                    if (!resolved && cont.isActive) {
                        resolved = true
                        cont.resume(null)
                    }
                }

                override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                    AppLogger.w(TAG, "NSD stop discovery failed: code=$errorCode")
                }
            }

            cont.invokeOnCancellation {
                try {
                    nsdManager.stopServiceDiscovery(discoveryListener)
                } catch (_: Exception) {}
            }

            try {
                nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
            } catch (e: Exception) {
                AppLogger.e(TAG, "Failed to start NSD discovery", e)
                if (!resolved && cont.isActive) {
                    resolved = true
                    cont.resume(null)
                }
            }
        }
}
