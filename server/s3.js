const { S3Client } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET;

if (!region) {
    throw new Error("S3 is not configured: set AWS_REGION.");
}

if (!bucketName) {
    throw new Error("S3 is not configured: set AWS_S3_BUCKET.");
}

// When access keys are not supplied, the AWS SDK uses its default credential
// provider chain (for example, an IAM role in a deployed environment).
const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined;

const s3 = new S3Client({ region, credentials });

module.exports = { s3, BUCKET: bucketName };
