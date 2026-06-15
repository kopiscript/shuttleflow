// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // Validate email
        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if already subscribed
        const existing = await prisma.emailSubscriber.findUnique({
            where: { email }
        });

        if (existing && existing.verified) {
            return NextResponse.json(
                { success: false, error: 'This email is already subscribed' },
                { status: 400 }
            );
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/verify-subscription?token=${token}`;

        // Upsert subscriber (create or update)
        await prisma.emailSubscriber.upsert({
            where: { email },
            update: { token, verified: false },
            create: { email, token, verified: false },
        });

        // Send verification email via Resend
        await resend.emails.send({
            from: 'ShuttleFlow <onboarding@resend.dev>',
            to: email,
            subject: 'Confirm Your Subscription to ShuttleFlow Alerts',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #99121A;">Confirm Your Subscription</h2>
                    <p>Thank you for subscribing to ShuttleFlow email alerts!</p>
                    <p>Click the button below to confirm your email address and start receiving bus delay notifications.</p>
                    <a href="${verifyUrl}" style="display: inline-block; background-color: #99121A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                        Confirm Subscription
                    </a>
                    <p style="color: #666; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
                </div>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to subscribe. Please try again.' },
            { status: 500 }
        );
    }
}