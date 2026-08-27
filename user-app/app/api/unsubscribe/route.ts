// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/url';

// ✅ ADD THIS: Handle GET requests from email links
export async function GET(request: NextRequest) {
    try {
        const email = request.nextUrl.searchParams.get('email');

        if (!email) {
            return new NextResponse(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Unsubscribe</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #EEEBE4; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                        h1 { color: #99121A; }
                        .error { color: red; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Unsubscribe Failed</h1>
                        <p class="error">Email address is required.</p>
                        <a href="${getBaseUrl()}/settings" style="color: #99121A;">Go back to Settings</a>
                    </div>
                </body>
                </html>
            `, {
                status: 400,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // Check if subscriber exists
        const subscriber = await prisma.emailSubscriber.findUnique({
            where: { email }
        });

        if (!subscriber) {
            return new NextResponse(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Unsubscribe</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #EEEBE4; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                        h1 { color: #99121A; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>ℹ️ Not Subscribed</h1>
                        <p>This email is not in our subscriber list.</p>
                        <a href="${getBaseUrl()}/settings" style="color: #99121A;">Go back to Settings</a>
                    </div>
                </body>
                </html>
            `, {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // Delete the subscriber
        await prisma.emailSubscriber.delete({
            where: { email }
        });

        // Return success page
        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Unsubscribed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #EEEBE4; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    h1 { color: #99121A; }
                    button { background: #99121A; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px; }
                    button:hover { background: #7a0e15; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Unsubscribed Successfully</h1>
                    <p>You have been removed from our email list.</p>
                    <p>You will no longer receive email notifications from ShuttleFlow.</p>
                    <button onclick="window.location.href='${getBaseUrl()}/settings'">Go to Settings</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Unsubscribe Failed</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #EEEBE4; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    h1 { color: red; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Unsubscribe Failed</h1>
                    <p>Something went wrong. Please try again later.</p>
                    <a href="${getBaseUrl()}/settings" style="color: #99121A;">Go back to Settings</a>
                </div>
            </body>
            </html>
        `, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

// ✅ Keep POST for API calls
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        await prisma.emailSubscriber.delete({
            where: { email }
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully unsubscribed'
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}