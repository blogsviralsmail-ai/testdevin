/*
 * APP Call Recorder by KKHS Media Private Limited
 * Based on ShizuCallRecorder (GPL-3.0) by kitsumed (Med)
 */

package com.kkhsmedia.callrecorder.integrations.adb

import com.kkhsmedia.callrecorder.utils.AppLogger
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket

/**
 * TCP proxy that forces all connections through IPv4 sockets.
 *
 * On some Android devices (e.g. OnePlus Open), `new Socket(host, port)`
 * creates a dual-stack IPv6 socket (source address `/::`), even for IPv4
 * destinations. This causes ECONNREFUSED when the ADB pairing server
 * only listens on IPv4.
 *
 * This proxy:
 * 1. Binds an IPv4-only ServerSocket on 127.0.0.1
 * 2. Accepts exactly one connection from the library
 * 3. Opens an explicit IPv4 socket to the real ADB pairing server
 * 4. Forwards bytes bidirectionally until either side closes
 */
class IPv4TcpProxy {

    companion object {
        private const val TAG = "SCR:IPv4TcpProxy"
    }

    @Volatile
    private var serverSocket: ServerSocket? = null

    /**
     * Starts the proxy targeting [targetHost]:[targetPort].
     * Returns the local port the proxy is listening on (127.0.0.1:port).
     * The caller should connect to 127.0.0.1:returnedPort instead of
     * the real target.
     */
    fun start(targetHost: String, targetPort: Int): Int {
        val ipv4Loopback = Inet4Address.getByAddress(byteArrayOf(127, 0, 0, 1))

        val ss = ServerSocket()
        ss.reuseAddress = true
        ss.bind(InetSocketAddress(ipv4Loopback, 0))
        ss.soTimeout = 30_000 // 30s timeout for accept
        serverSocket = ss

        val proxyPort = ss.localPort
        AppLogger.i(TAG, "Proxy listening on 127.0.0.1:$proxyPort -> $targetHost:$targetPort")

        Thread({
            try {
                val clientConn = ss.accept()
                AppLogger.i(TAG, "Accepted connection from library")

                // Create explicit IPv4 socket to the real target
                val targetAddr = resolveIpv4(targetHost)
                val targetConn = Socket()
                targetConn.bind(InetSocketAddress(
                    Inet4Address.getByAddress(byteArrayOf(0, 0, 0, 0)), 0
                ))
                targetConn.connect(InetSocketAddress(targetAddr, targetPort), 10_000)
                AppLogger.i(TAG, "Connected to target $targetHost:$targetPort via IPv4")

                // Bidirectional forwarding
                val t1 = Thread({ forward(clientConn.getInputStream(), targetConn.getOutputStream(), "client->target") }, "proxy-c2t")
                val t2 = Thread({ forward(targetConn.getInputStream(), clientConn.getOutputStream(), "target->client") }, "proxy-t2c")
                t1.isDaemon = true
                t2.isDaemon = true
                t1.start()
                t2.start()

                // Wait for both directions to finish
                t1.join()
                t2.join()

                clientConn.close()
                targetConn.close()
                AppLogger.i(TAG, "Proxy session completed")
            } catch (e: Exception) {
                AppLogger.e(TAG, "Proxy error: ${e.message}", e)
            } finally {
                stop()
            }
        }, "ipv4-tcp-proxy").apply {
            isDaemon = true
            start()
        }

        // Small delay to ensure server socket is ready
        Thread.sleep(50)
        return proxyPort
    }

    fun stop() {
        try {
            serverSocket?.close()
        } catch (_: Exception) {}
        serverSocket = null
    }

    private fun resolveIpv4(host: String): InetAddress {
        // Parse literal IPv4 address directly
        val parts = host.split(".")
        if (parts.size == 4) {
            try {
                val bytes = ByteArray(4)
                for (i in 0..3) {
                    val v = parts[i].toInt()
                    if (v < 0 || v > 255) break
                    bytes[i] = v.toByte()
                }
                return Inet4Address.getByAddress(bytes)
            } catch (_: Exception) {}
        }

        // Fallback: resolve and pick first IPv4 address
        val addrs = InetAddress.getAllByName(host)
        for (addr in addrs) {
            if (addr is Inet4Address) return addr
        }
        // Last resort: return first address
        return addrs[0]
    }

    private fun forward(input: InputStream, output: OutputStream, label: String) {
        try {
            val buf = ByteArray(8192)
            while (true) {
                val n = input.read(buf)
                if (n < 0) break
                output.write(buf, 0, n)
                output.flush()
            }
        } catch (e: IOException) {
            // Normal when connection closes
            AppLogger.d(TAG, "Forward $label ended: ${e.message}")
        }
    }
}
