/**
 * @module aws
 * @description AWS SDK configuration for Rekognition (face recognition), S3 (file storage), and SES (email).
 */
const AWS = require('aws-sdk');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// Validate required credentials
if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
  console.warn('⚠️  AWS credentials not configured. Face recognition and S3 storage will fail.');
}

// Configure AWS SDK
AWS.config.update({
  region: awsConfig.region,
  credentials: new AWS.Credentials({
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  }),
});

// Initialize AWS services
const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const ses = new AWS.SES();

module.exports = awsConfig;
module.exports.rekognition = rekognition;
module.exports.s3 = s3;
module.exports.ses = ses;
