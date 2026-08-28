import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development", // Disables PWA caching during local development
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Your standard Next.js config options go here (currently empty)
};

export default withPWA(nextConfig);