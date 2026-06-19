/*
 * APP Call Recorder by KKHS Media Private Limited
 * Based on ShizuCallRecorder (GPL-3.0) by kitsumed (Med)
 */

package com.kkhsmedia.callrecorder.integrations.adb

import android.content.Context
import android.os.Build
import com.kkhsmedia.callrecorder.utils.AppLogger
import io.github.muntashirakon.adb.AbsAdbConnectionManager
import io.github.muntashirakon.adb.AdbStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.conscrypt.Conscrypt
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

/**
 * Concrete ADB connection manager using RSA key auth.
 * Generates and persists keys for ADB pairing/connection.
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
                    AppLogger.i(TAG, "Conscrypt provider initialized successfully")
                } catch (e: Exception) {
                    AppLogger.w(TAG, "Conscrypt init failed, using default provider", e)
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
                    AppLogger.i(TAG, "Loaded saved ADB keys successfully")
                    return Pair(privateKey, cert)
                } catch (e: Exception) {
                    AppLogger.w(TAG, "Failed to load saved keys, regenerating", e)
                    keyFile.delete()
                    certFile.delete()
                }
            }

            AppLogger.i(TAG, "Generating new RSA key pair for ADB auth...")
            val kpg = KeyPairGenerator.getInstance("RSA")
            kpg.initialize(2048)
            val keyPair = kpg.generateKeyPair()
            val cert = generateSelfSignedCert(keyPair)
            AppLogger.i(TAG, "Certificate generated: subject=${cert.subjectDN}")

            try {
                keyFile.writeBytes(keyPair.private.encoded)
                certFile.writeBytes(cert.encoded)
                AppLogger.i(TAG, "ADB keys saved to disk")
            } catch (e: Exception) {
                AppLogger.w(TAG, "Failed to persist ADB keys", e)
            }

            return Pair(keyPair.private, cert)
        }

        @Suppress("DEPRECATION")
        private fun generateSelfSignedCert(keyPair: java.security.KeyPair): X509Certificate {
            val now = Date()
            val until = Date(now.time + 25L * 365 * 24 * 60 * 60 * 1000)
            val serial = BigInteger.valueOf(System.currentTimeMillis())
            val subject = "CN=adb"

            // Use sun.security (available on Android runtime)
            val x509InfoClass = Class.forName("sun.security.x509.X509CertInfo")
            val x509Info = x509InfoClass.getDeclaredConstructor().newInstance()
            val setInfo = x509InfoClass.getMethod("set", String::class.java, Any::class.java)

            val certValidity = Class.forName("sun.security.x509.CertificateValidity")
                .getDeclaredConstructor(Date::class.java, Date::class.java)
                .newInstance(now, until)
            setInfo.invoke(x509Info, "validity", certValidity)

            val certSerial = Class.forName("sun.security.x509.CertificateSerialNumber")
                .getDeclaredConstructor(BigInteger::class.java)
                .newInstance(serial)
            setInfo.invoke(x509Info, "serialNumber", certSerial)

            val x500NameClass = Class.forName("sun.security.x509.X500Name")
            val x500Name = x500NameClass.getDeclaredConstructor(String::class.java).newInstance(subject)

            val certSubject = Class.forName("sun.security.x509.CertificateSubjectName")
                .getDeclaredConstructor(x500NameClass)
                .newInstance(x500Name)
            setInfo.invoke(x509Info, "subject", certSubject)

            val certIssuer = Class.forName("sun.security.x509.CertificateIssuerName")
                .getDeclaredConstructor(x500NameClass)
                .newInstance(x500Name)
            setInfo.invoke(x509Info, "issuer", certIssuer)

            val certKey = Class.forName("sun.security.x509.CertificateX509Key")
                .getDeclaredConstructor(java.security.PublicKey::class.java)
                .newInstance(keyPair.public)
            setInfo.invoke(x509Info, "key", certKey)

            val certVersion = Class.forName("sun.security.x509.CertificateVersion")
                .getDeclaredConstructor(Int::class.java)
                .newInstance(2) // v3
            setInfo.invoke(x509Info, "version", certVersion)

            val algIdClass = Class.forName("sun.security.x509.AlgorithmId")
            val algId = algIdClass.getMethod("get", String::class.java).invoke(null, "SHA256withRSA")
            val certAlgId = Class.forName("sun.security.x509.CertificateAlgorithmId")
                .getDeclaredConstructor(algIdClass)
                .newInstance(algId)
            setInfo.invoke(x509Info, "algorithmID", certAlgId)

            val x509ImplClass = Class.forName("sun.security.x509.X509CertImpl")
            val certImpl = x509ImplClass.getDeclaredConstructor(x509InfoClass).newInstance(x509Info)
            x509ImplClass.getMethod("sign", PrivateKey::class.java, String::class.java)
                .invoke(certImpl, keyPair.private, "SHA256withRSA")

            return certImpl as X509Certificate
        }
    }
}

/**
 * Manages ADB wireless pairing and connection from within the app.
 * Eliminates the need for a separate Shizuku manager app on Android 11+.
 */
class AdbPairingManager(private val context: Context) {

    companion object {
        private const val TAG = "SCR:AdbPairingManager"
    }

    private val connectionManager: AppAdbConnectionManager by lazy {
        AppAdbConnectionManager.getInstance(context)
    }

    /** Result of a pairing attempt with details. */
    data class PairResult(val success: Boolean, val errorDetail: String = "")

    /**
     * Pairs with the device's wireless debugging.
     * Returns detailed result including error message on failure.
     */
    suspend fun pairWithDetails(host: String, port: Int, pairingCode: String): PairResult = withContext(Dispatchers.IO) {
        try {
            AppLogger.i(TAG, "Attempting ADB pairing to $host:$port")
            val result = connectionManager.pair(host, port, pairingCode)
            AppLogger.i(TAG, "ADB pairing result: $result")
            PairResult(result, if (!result) "Pairing returned false - code may have expired" else "")
        } catch (e: Exception) {
            val msg = "${e.javaClass.simpleName}: ${e.message ?: "unknown"}"
            AppLogger.e(TAG, "ADB pairing failed: $msg", e)
            PairResult(false, msg)
        }
    }

    /**
     * Auto-connects to the device using mDNS discovery (Android 11+).
     */
    suspend fun autoConnect(): Boolean = withContext(Dispatchers.IO) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return@withContext false
            AppLogger.i(TAG, "Attempting ADB auto-connect via mDNS...")
            val result = connectionManager.autoConnect(context, 15000)
            AppLogger.i(TAG, "ADB auto-connect result: $result")
            result
        } catch (e: Exception) {
            AppLogger.e(TAG, "ADB auto-connect failed", e)
            false
        }
    }

    /**
     * Connects to a specific ADB host:port.
     */
    suspend fun connect(host: String, port: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            AppLogger.i(TAG, "Connecting to ADB at $host:$port")
            val result = connectionManager.connect(host, port)
            AppLogger.i(TAG, "ADB connect result: $result")
            result
        } catch (e: Exception) {
            AppLogger.e(TAG, "ADB connect failed", e)
            false
        }
    }

    /**
     * Starts Shizuku server via ADB shell command.
     */
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
        try {
            connectionManager.disconnect()
        } catch (e: Exception) {
            AppLogger.w(TAG, "Error disconnecting", e)
        }
    }
}
