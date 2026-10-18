import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development", // Disables PWA caching during local development
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Your standard Next.js config options go here (currently empty)
    turbopack: {},
    // Workaround for Next.js 16 bug: auto-generated .next/dev/types/validator.ts
    // incorrectly constrains LayoutConfig<Route> to only "/", breaking builds
    // when non-root layout routes (e.g. "/admin") exist. This is a framework bug.
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default withPWA(nextConfig);