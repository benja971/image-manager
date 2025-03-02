import { Controller, Delete, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as sharp from 'sharp';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':fileName')
  async getFile(@Param('fileName') fileName: string, @Query('size') size: string, @Res() res: Response) {
    console.log(`Received request for file: ${fileName} with size: ${size}`);
    const ext = path.extname(fileName);

    if (!ext) {
      console.error(`Invalid file name: ${fileName}`);
      return res.status(400).send('Invalid file name');
    }

    const mimeType = this.getMimeType(ext);
    res.setHeader('Content-Type', mimeType);

    if (size && parseInt(size, 10) > 0) {
      const baseName = path.basename(fileName, ext);
      const newFileName = `${baseName}-${size}${ext}`;

      try {
        console.log(`Attempting to retrieve resized file: ${newFileName}`);
        const file = await this.imagesService.getFile(newFileName);

        if (file) {
          console.log(`Resized file found: ${newFileName}`);
          res.setHeader('Content-Disposition', `inline; filename="${newFileName}"`);
          return res.send(file);
        }
      } catch (error) {
        console.error(`Error retrieving resized file: ${newFileName}`, error);
      }

      try {
        console.log(`Generating resized image for file: ${fileName}`);
        const originalFile = await this.imagesService.getFile(fileName);
        const resizedBuffer = await sharp(originalFile).resize(parseInt(size, 10)).toBuffer();

        console.log(`Uploading resized image as: ${newFileName}`);
        await this.imagesService.uploadFile(newFileName, resizedBuffer);

        res.setHeader('Content-Disposition', `inline; filename="${newFileName}"`);
        return res.send(resizedBuffer);
      } catch (error) {
        console.error(`Error generating or uploading resized image: ${newFileName}`, error);
        return res.status(500).send('Error processing image');
      }
    }

    try {
      console.log(`Returning original file: ${fileName}`);
      const file = await this.imagesService.getFile(fileName);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.send(file);
    } catch (error) {
      console.error(`Error retrieving original file: ${fileName}`, error);
      return res.status(404).send('File not found');
    }
  }

  private getMimeType(ext: string): string {
    switch (ext.toLowerCase()) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }

  @Delete(':fileName')
  async deleteFile(@Param() { fileName }: { fileName: string }) {
    return this.imagesService.deleteFile(fileName);
  }
}
