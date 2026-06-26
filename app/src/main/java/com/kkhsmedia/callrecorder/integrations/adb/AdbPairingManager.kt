/*
 * APP Call Recorder by KKHS Media Private Limited
 * Based on ShizuCallRecorder (GPL-3.0) by kitsumed (Med)
 */

package com.kkhsmedia.callrecorder.integrations.adb

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import com.kkhsmedia.callrecorder.utils.AppLogger
import io.github.muntashirakon.adb.AbsAdbConnectionManager
import io.github.muntashirakon.adb.AdbStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.conscrypt.Conscrypt
import android.sun.security.x509.AlgorithmId
import android.sun.security.x509.CertificateAlgorithmId
import android.sun.security.x509.CertificateIssuerName
import android.sun.security.x509.CertificateSerialNumber
import android.sun.security.x509.CertificateSubjectName
import android.sun.security.x509.CertificateValidity
import android.sun.security.x509.CertificateVersion
import android.sun.security.x509.CertificateX509Key
import android.sun.security.x509.X500Name
import android.sun.security.x509.X509CertImpl
import android.sun.security.x509.X509CertInfo
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.Security
import java.security.cert.Certificate
import java.security.cert.X509Certificate
import java.util.Date
import java.util.Random

/**
 * Concrete ADB connection manager using RSA key auth.
 * Uses sun-security-android library for reliable certificate generation.
 */
class AppAdbConnectionManager private constructor(
    private val privKey: PrivateKey,
    private val cert: X509Certificate
) : AbsAdbConnectionManager() {

    override fun getPrivateKey(): PrivateKey = privKey
    override fun getCertificate(): Certificate = cert
    override fun getDeviceName(): String = "APPCallRecorder@${Build.MODEL}"

    companion object {
        private const val TAG = "SCR:AppAdbConnMgr"
        private var instance: AppAdbConnectionManager? = null
        private var initDone = false

        @Synchronized
        fun initConscrypt() {
            if (!initDone) {
                try {
                    Security.insertProviderAt(Conscrypt.newProvider(), 1)
                    AppLogger.i(TAG, "Conscrypt provider initialized")
                } catch (e: Exception) {
                    AppLogger.w(TAG, "Conscrypt init failed", e)
                }
                initDone = true
            }
        }

        @Synchronized
        fun getInstance(context: Context): AppAdbConnectionManager {
            initConscrypt()
            if (instance == null) {
                val keyFile = File(context.filesDir, "adb_rsa_key")
                val certFile = File(context.filesDir, "adb_rsa_cert")
                val pair = loadOrGenerateKeys(keyFile, certFile)
                instance = AppAdbConnectionManager(pair.first, pair.second)
                instance!!.setApi(Build.VERSION.SDK_INT)
            }
            return instance!!
        }

        private fun loadOrGenerateKeys(keyFile: File, certFile: File): Pair<PrivateKey, X509Certificate> {
            if (keyFile.exists() && certFile.exists()) {
                try {
                    val keyFactory = java.security.KeyFactory.getInstance("RSA")
                    val keySpec = java.security.spec.PKCS8EncodedKeySpec(keyFile.readBytes())
                    val privateKey = keyFactory.generatePrivate(keySpec)
                    val certFactory = java.security.cert.CertificateFactory.getInstance("X.509")
                    val cert = certFactory.generateCertificate(certFile.inputStream()) as X509Certificate
                    AppLogger.i(TAG, "Loaded saved ADB keys")
                    return Pair(privateKey, cert)
                } catch (e: Exception) {
                    AppLogger.w(TAG, "Failed to load keys, regenerating", e)
                    keyFile.delete()
                    certFile.delete()
                }
            }

            AppLogger.i(TAG, "Generating new RSA 2048 key pair...")
            val kpg = KeyPairGenerator.getInstance("RSA")
            kpg.initialize(2048)
            val keyPair = kpg.generateKeyPair()
            val cert = generateSelfSignedCert(keyPair)
            AppLogger.i(TAG, "Certificate generated OK")

            try {
                keyFile.writeBytes(keyPair.private.encoded)
                certFile.writeBytes(cert.encoded)
            } catch (e: Exception) {
                AppLogger.w(TAG, "Failed to save keys", e)
            }

            return Pair(keyPair.private, cert)
        }

        private fun generateSelfSignedCert(keyPair: java.security.KeyPair): X509Certificate {
            val now = Date()
            val until = Date(now.time + 25L * 365 * 24 * 60 * 60 * 1000)
            val algorithmName = "SHA256withRSA"

            val x500Name = X500Name("CN=adb")
            val x509CertInfo = X509CertInfo()
            x509CertInfo.set("version", CertificateVersion(CertificateVersion.V3))
            x509CertInfo.set("serialNumber", CertificateSerialNumber(Random().nextInt() and Int.MAX_VALUE))
            x509CertInfo.set("algorithmID", CertificateAlgorithmId(AlgorithmId.get(algorithmName)))
            x509CertInfo.set("subject", CertificateSubjectName(x500Name))
            x509CertInfo.set("key", CertificateX509Key(keyPair.public))
            x509CertInfo.set("validity", CertificateValidity(now, until))
            x509CertInfo.set("issuer", CertificateIssuerName(x500Name))

            val x509CertImpl = X509CertImpl(x509CertInfo)
            x509CertImpl.sign(keyPair.private, algorithmName)

            return x509CertImpl
        }
    }
}

/**
 * Manages ADB wireless pairing and connection from within the app.
 */
class AdbPairingManager(private val context: Context) {

    companion object {
        private const val TAG = "SCR:AdbPairingManager"
    }

    private val connectionManager: AppAdbConnectionManager by lazy {
        AppAdbConnectionManager.getInstance(context)
    }

    data class PairResult(val success: Boolean, val errorDetail: String = "")

    private fun findWifiNetwork(): Network? {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        for (network in cm.allNetworks) {
            val caps = cm.getNetworkCapabilities(network) ?: continue
            if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                return network
            }
        }
        return null
    }

    /**
     * Pair with ADB using IPv4 TCP proxy to bypass IPv6 socket issues.
     *
     * On some devices (e.g. OnePlus Open), the library's Socket(host, port)
     * creates a dual-stack IPv6 socket (source /::`), causing ECONNREFUSED.
     * We route all connections through an IPv4-only TCP proxy to fix this.
     */
    suspend fun pairWithDetails(host: String, port: Int, pairingCode: String): PairResult = withContext(Dispatchers.IO) {
        val hostsToTry = mutableListOf("127.0.0.1")
        val wifiIp = getDeviceWifiIp()
        if (wifiIp != null && wifiIp != "127.0.0.1") {
            hostsToTry.add(wifiIp)
        }
        if (host != "127.0.0.1" && host != wifiIp) {
            hostsToTry.add(host)
        }

        var lastError = ""

        for (targetHost in hostsToTry) {
            for (attempt in 1..3) {
                val proxy = IPv4TcpProxy()
                try {
                    val proxyPort = proxy.start(targetHost, port)
                    AppLogger.i(TAG, "Attempt $attempt: pairing via IPv4 proxy 127.0.0.1:$proxyPort -> $targetHost:$port")
                    val result = connectionManager.pair("127.0.0.1", proxyPort, pairingCode)
                    if (result) {
                        AppLogger.i(TAG, "Pairing SUCCESS on $targetHost:$port (attempt $attempt)")
                        return@withContext PairResult(true)
                    }
                    lastError = "Pairing returned false - code may have expired"
                    AppLogger.w(TAG, "Pair returned false on $targetHost (attempt $attempt)")
                } catch (e: java.lang.reflect.InvocationTargetException) {
                    val cause = e.cause ?: e
                    lastError = "${cause.javaClass.simpleName}: ${cause.message ?: "unknown"}"
                    AppLogger.w(TAG, "Attempt $attempt on $targetHost: $lastError")
                } catch (e: Exception) {
                    lastError = "${e.javaClass.simpleName}: ${e.message ?: "unknown"}"
                    AppLogger.w(TAG, "Attempt $attempt on $targetHost: $lastError")
                } finally {
                    proxy.stop()
                }
                if (attempt < 3) {
                    Thread.sleep(500L * attempt)
                }
            }
        }

        AppLogger.e(TAG, "All pairing attempts failed. Last error: $lastError")
        PairResult(false, lastError)
    }

    suspend fun autoConnect(): Boolean = withContext(Dispatchers.IO) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return@withContext false
            val result = connectionManager.autoConnect(context, 15000)
            AppLogger.i(TAG, "Auto-connect result: $result")
            result
        } catch (e: Exception) {
            AppLogger.e(TAG, "Auto-connect failed", e)
            false
        }
    }

    suspend fun connect(host: String, port: Int): Boolean = withContext(Dispatchers.IO) {
        val hostsToTry = mutableListOf("127.0.0.1")
        if (host != "127.0.0.1") hostsToTry.add(host)
        val wifiIp = getDeviceWifiIp()
        if (wifiIp != null && wifiIp != "127.0.0.1" && wifiIp != host) hostsToTry.add(wifiIp)

        for (targetHost in hostsToTry) {
            try {
                AppLogger.i(TAG, "Connecting to $targetHost:$port")
                val result = connectionManager.connect(targetHost, port)
                if (result) {
                    AppLogger.i(TAG, "Connected to $targetHost:$port")
                    return@withContext true
                }
            } catch (e: Exception) {
                AppLogger.w(TAG, "Connect to $targetHost:$port failed: ${e.message}")
            }
        }
        AppLogger.e(TAG, "All connect attempts failed")
        false
    }

    fun getDeviceWifiIp(): String? {
        try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val wifiNetwork = findWifiNetwork() ?: return null
            val linkProperties = cm.getLinkProperties(wifiNetwork) ?: return null
            for (addr in linkProperties.linkAddresses) {
                val ip = addr.address
                if (ip is java.net.Inet4Address && !ip.isLoopbackAddress) {
                    return ip.hostAddress
                }
            }
        } catch (e: Exception) {
            AppLogger.w(TAG, "Failed to get Wi-Fi IP", e)
        }
        return null
    }

    suspend fun startShizukuServer(): Boolean = withContext(Dispatchers.IO) {
        try {
            if (!connectionManager.isConnected) {
                AppLogger.w(TAG, "Not connected to ADB")
                return@withContext false
            }
            val startCommand = "sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh"
            AppLogger.i(TAG, "Running: $startCommand")
            val stream: AdbStream = connectionManager.openStream("shell:$startCommand")
            val reader = BufferedReader(InputStreamReader(stream.openInputStream()))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.appendLine(line)
            }
            stream.close()
            val result = output.toString()
            AppLogger.i(TAG, "Shizuku start output: $result")
            result.contains("started", ignoreCase = true) || result.contains("running", ignoreCase = true)
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to start Shizuku server", e)
            false
        }
    }

    fun disconnect() {
        try { connectionManager.disconnect() } catch (e: Exception) { }
    }
}
