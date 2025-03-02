import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';

@Injectable()
export class ImagesService {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(fileName: string, file: Buffer): Promise<void> {
    await this.minioService.client.putObject(
      this.configService.get('s3.bucketName'),
      fileName,
      file,
      {},
    );
  }

  getFileUrl(fileName: string): Promise<string> {
    return this.minioService.client.presignedGetObject(
      this.configService.get('s3.bucketName'),
      fileName,
      24 * 60 * 60 * 7,
    );
  }

  async getFile(fileName: string): Promise<Buffer<ArrayBuffer>> {
    try {
      const fileStream = await this.minioService.client.getObject(
        this.configService.get('s3.bucketName'),
        fileName,
      );

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

  deleteFile(fileName: string): Promise<void> {
    return this.minioService.client.removeObject(
      this.configService.get('s3.bucketName'),
      fileName,
    );
  }

  getUploadUrl(fileName: string): Promise<string> {
    return this.minioService.client.presignedPutObject(
      this.configService.get('s3.bucketName'),
      fileName,
      24 * 60 * 60,
    );
  }

  async uploadFileAndReturnUrl(
    fileName: string,
    file: Buffer,
  ): Promise<string> {
    await this.uploadFile(fileName, file);
    return this.getFileUrl(fileName);
  }

  async listFiles(): Promise<string[]> {
    const stream = this.minioService.client.listObjects(
      this.configService.get('s3.bucketName'),
    );

    const fileNames: string[] = [];

    for await (const obj of stream) {
      fileNames.push(obj.name);
    }

    return fileNames;
  }
}
