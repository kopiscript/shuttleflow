// verify-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return new NextResponse('Invalid verification link', { status: 400 });
        }

        // Find subscriber with this token
        const subscriber = await prisma.emailSubscriber.findUnique({
            where: { token }
        });

        if (!subscriber) {
            return new NextResponse('Invalid or expired verification link', { status: 400 });
        }

        if (subscriber.verified) {
            return new NextResponse('Email already verified', { status: 400 });
        }

        // Mark as verified
        await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: { verified: true, verifiedAt: new Date() },
        });

        // Redirect to success page
        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Subscription Confirmed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #EEEBE4; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    h1 { color: #99121A; }
                    button { background: #99121A; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
                    button:hover { background: #7a0e15; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Subscription Confirmed!</h1>
                    <p>You will now receive bus delay and schedule updates via email.</p>
                    <button onclick="window.close()">Close Window</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });

    } catch (error) {
        console.error('Verification error:', error);
        return new NextResponse('Verification failed', { status: 500 });
    }
}