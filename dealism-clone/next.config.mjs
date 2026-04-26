/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14: instrumentation.ts is gated behind this flag.
    instrumentationHook: true,
    // Keep Node-only / native-ish deps out of the webpack server bundle
    // so we don't pull `child_process`/`fs`/`crypto` shims into edge code.
    serverComponentsExternalPackages: [
      "@whiskeysockets/baileys",
      "bullmq",
      "ioredis",
      "@sentry/nextjs",
      "sharp",
      "libsignal",
    ],
  },
};

export default nextConfig;
