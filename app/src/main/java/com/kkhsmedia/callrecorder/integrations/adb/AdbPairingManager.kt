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

    suspend fun pairWithDetails(host: String, port: Int, pairingCode: String): PairResult = withContext(Dispatchers.IO) {
        try {
            AppLogger.i(TAG, "Pairing to $host:$port ...")
            val result = connectionManager.pair(host, port, pairingCode)
            AppLogger.i(TAG, "Pairing result: $result")
            PairResult(result, if (!result) "Pairing returned false - code may have expired" else "")
        } catch (e: java.lang.reflect.InvocationTargetException) {
            val cause = e.cause ?: e
            val msg = "${cause.javaClass.simpleName}: ${cause.message ?: "unknown"}"
            AppLogger.e(TAG, "Pairing failed (ITE): $msg", cause)
            PairResult(false, msg)
        } catch (e: Exception) {
            val msg = "${e.javaClass.simpleName}: ${e.message ?: "unknown"}"
            AppLogger.e(TAG, "Pairing failed: $msg", e)
            PairResult(false, msg)
        }
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
        try {
            val result = connectionManager.connect(host, port)
            AppLogger.i(TAG, "Connect result: $result")
            result
        } catch (e: Exception) {
            AppLogger.e(TAG, "Connect failed", e)
            false
        }
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
