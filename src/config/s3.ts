import { registerAs } from '@nestjs/config';

export interface S3Config {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region: string;
  bucketName: string;
}

export default registerAs(
  's3',
  (): S3Config => ({
    endPoint: process.env.BUCKET_HOST,
    port: parseInt(process.env.BUCKET_PORT, 10),
    useSSL: true,
    accessKey: process.env.BUCKET_ACCESS_KEY,
    secretKey: process.env.BUCKET_SECRET_KEY,
    region: process.env.BUCKET_REGION,
    bucketName: process.env.BUCKET_NAME,
  }),
);
