// app/api/notifications/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, message, type } = body;

        if (!title || !message) {
            return NextResponse.json(
                { success: false, error: 'Title and message are required' },
                { status: 400 }
            );
        }

        // Get all verified subscribers
        const subscribers = await prisma.emailSubscriber.findMany({
            where: { verified: true }
        });

        if (subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscribers to notify',
                emailsSent: 0
            });
        }

        console.log(`📧 Sending notification to ${subscribers.length} subscribers...`);

        let emailCount = 0;
        for (const subscriber of subscribers) {
            try {
                await resend.emails.send({
                    from: 'ShuttleFlow <noreply@shuttleflow.azmiproductions.com>',
                    to: subscriber.email,
                    subject: `🚌 ShuttleFlow Alert: ${title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                            <h2 style="color: #99121A;">ShuttleFlow Alert</h2>
                            <h3>${title}</h3>
                            <p>${message}</p>
                            <hr style="margin: 20px 0;" />
                            <p style="color: #666; font-size: 12px;">
                                You received this because you subscribed to ShuttleFlow alerts.
                                <br />
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?email=${subscriber.email}" style="color: #99121A;">
                                    Unsubscribe
                                </a>
                            </p>
                        </div>
                    `,
                });
                emailCount++;
                console.log(`✅ Email sent to ${subscriber.email}`);
            } catch (error) {
                console.error(`❌ Failed to send to ${subscriber.email}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Email sent to ${emailCount} subscribers`,
            emailsSent: emailCount
        });

    } catch (error) {
        console.error('Email notification error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send email notifications' },
            { status: 500 }
        );
    }
}