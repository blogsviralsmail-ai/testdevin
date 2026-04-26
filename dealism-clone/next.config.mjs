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
      "discord.js",
      "@discordjs/ws",
      "zlib-sync",
      "bufferutil",
      "utf-8-validate",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // discord.js + ws have several optional native deps that webpack
      // tries to resolve even though they're guarded at runtime. Mark
      // them as externals so the server bundle doesn't fail to build.
      config.externals = [
        ...(config.externals || []),
        "zlib-sync",
        "bufferutil",
        "utf-8-validate",
      ];
    }
    return config;
  },
};

export default nextConfig;
