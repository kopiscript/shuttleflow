import { S3Client } from "@aws-sdk/client-s3";

let _r2: S3Client | null = null;
let _bucketName: string | null = null;

export function getR2Client(): S3Client {
    if (_r2) return _r2;

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint) throw new Error("Missing R2_ENDPOINT");
    if (!accessKeyId) throw new Error("Missing R2_ACCESS_KEY_ID");
    if (!secretAccessKey) throw new Error("Missing R2_SECRET_ACCESS_KEY");

    _r2 = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });

    return _r2;
}

export function getR2BucketName(): string {
    if (_bucketName) return _bucketName;
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) throw new Error("Missing R2_BUCKET_NAME");
    _bucketName = bucketName;
    return _bucketName;
}

// Convenience re-exports for callers that use the old names
/** @deprecated Use getR2Client() instead */
export const r2 = new Proxy({} as S3Client, {
    get(_target, prop) {
        return (getR2Client() as unknown as Record<string | symbol, unknown>)[prop];
    },
});