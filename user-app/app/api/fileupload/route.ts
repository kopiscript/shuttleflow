import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No file uploaded",
                },
                {
                    status: 400,
                }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Only JPG and PNG files are allowed",
                },
                {
                    status: 400,
                }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: "File must be smaller than 5MB",
                },
                {
                    status: 400,
                }
            );
        }

        const safeFileName = file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

        const objectKey =
            `support-tickets/${crypto.randomUUID()}-${safeFileName}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: objectKey,
            Body: buffer,
            ContentType: file.type,
        });

        await r2.send(command);

        console.log("✅ Uploaded to R2:", objectKey);

        return NextResponse.json({
            success: true,
            fileUrl: objectKey,
        });

    } catch (error) {
        console.error("R2 upload error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to upload file",
            },
            {
                status: 500,
            }
        );
    }
}