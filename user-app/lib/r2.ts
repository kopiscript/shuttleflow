import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!endpoint) {
    throw new Error("Missing R2_ENDPOINT");
}

if (!accessKeyId) {
    throw new Error("Missing R2_ACCESS_KEY_ID");
}

if (!secretAccessKey) {
    throw new Error("Missing R2_SECRET_ACCESS_KEY");
}

if (!bucketName) {
    throw new Error("Missing R2_BUCKET_NAME");
}

export const r2 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export const R2_BUCKET_NAME = bucketName;