import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';

@Injectable()
export class ImagesService {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async getFile(fileName: string): Promise<Buffer> {
    try {
      const fileStream = await this.minioService.client.getObject(this.configService.get('s3.bucketName'), fileName);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        fileStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        fileStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        fileStream.on('error', reject);
      });
    } catch (error) {
      throw new NotFoundException(`File with name ${fileName} not found`);
    }
  }

  async uploadFile(fileName: string, file: Buffer): Promise<void> {
    await this.minioService.client.putObject(this.configService.get('s3.bucketName'), fileName, file, {});
  }

  deleteFile(fileName: string): Promise<void> {
    return this.minioService.client.removeObject(this.configService.get('s3.bucketName'), fileName);
  }
}
