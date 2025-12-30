import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "media.kitsu.app",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "media.kitsu.io",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname:
                    "kitsu-production-media.s3.us-west-002.backblazeb2.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "s4.anilist.co",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn.myanimelist.net",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
