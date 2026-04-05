import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // This allows all paths under res.cloudinary.com
      },
    ],
  },

  output: "standalone",

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete
    // even if your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
