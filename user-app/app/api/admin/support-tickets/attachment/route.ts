//support-tickets/attachment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";
import { getSession } from "@/lib/session"; // use your actual existing import

export async function GET(request: NextRequest) {
    try {
        // ✅ Admin authentication check
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");

        if (!key) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing attachment key",
                },
                {
                    status: 400,
                }
            );
        }

        if (!key.startsWith("support-tickets/")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid attachment",
                },
                {
                    status: 400,
                }
            );
        }

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        const object = await r2.send(command);

        if (!object.Body) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Attachment not found",
                },
                {
                    status: 404,
                }
            );
        }

        const stream = object.Body.transformToWebStream();

        return new Response(stream, {
            status: 200,
            headers: {
                "Content-Type":
                    object.ContentType || "application/octet-stream",

                "Content-Disposition":
                    `inline; filename="${key.split("/").pop()}"`,

                "Cache-Control":
                    "private, max-age=300",
            },
        });

    } catch (error) {
        console.error("Failed to fetch R2 attachment:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to load attachment",
            },
            {
                status: 500,
            }
        );
    }
}