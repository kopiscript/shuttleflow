import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, reportType, description, fileUrls } = body;

        // Validation
        if (!email || !reportType || !description) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate report type
        const validTypes = ['feedback', 'bus_delay', 'driver_issue', 'route_problem', 'other'];
        if (!validTypes.includes(reportType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid report type' },
                { status: 400 }
            );
        }

        // Create support ticket in database
        const ticket = await prisma.supportTicket.create({
            data: {
                email,
                reportType,
                description,
                fileUrl: fileUrls ? JSON.stringify(fileUrls) : null, // Store as JSON string
                status: "Open",
            },
        });

        console.log('✅ Support ticket created:', ticket.id);

        return NextResponse.json({
            success: true,
            ticketId: ticket.id,
            message: 'Support ticket submitted successfully'
        });

    } catch (error) {
        console.error('Support ticket error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit support ticket' },
            { status: 500 }
        );
    }
}