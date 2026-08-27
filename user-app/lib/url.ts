// lib/url.ts
export function getBaseUrl() {
    // If we're on Vercel (production or preview)
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Local development
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}