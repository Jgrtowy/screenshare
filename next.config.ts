import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    async rewrites() {
        return [
            {
                source: "/rtc/:path*",
                destination: `https://${process.env.RTC_SERVER_HOST || "localhost"}/rtc/:path*/`,
            },
            {
                source: "/rtc/:path*/",
                destination: `https://${process.env.RTC_SERVER_HOST || "localhost"}/rtc/:path*/`,
            },
        ];
    },
    images: {
        localPatterns: [
            {
                pathname: "/api/avatar**",
            },
        ],
        remotePatterns: [
            {
                hostname: "cdn.discordapp.com",
            },
        ],
    },
    output: "standalone",
    allowedDevOrigins: ["a455-88-156-120-71.ngrok-free.app"],
};

export default nextConfig;
