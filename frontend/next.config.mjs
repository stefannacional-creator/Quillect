/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Transpile ESM-only packages so Next.js can bundle them
  transpilePackages: ["react-markdown", "remark-gfm"],
  // Proxy all /api/* calls to the backend (avoids CORS in both dev and Docker)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
