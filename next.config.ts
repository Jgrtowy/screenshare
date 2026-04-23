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
    output: "standalone",
};

export default nextConfig;
