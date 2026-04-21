const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer, nextRuntime }) => {
    // Suppress purely server/edge Node dependencies during edge build
    if (isServer && nextRuntime === "edge") {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);