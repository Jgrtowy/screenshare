import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    async rewrites() {
        return [
            {
                source: "/rtc/:path*",
                destination: `http://${process.env.RTC_SERVER_HOST || "localhost"}/rtc/:path*`,
            },
        ];
    },
};

export default nextConfig;
