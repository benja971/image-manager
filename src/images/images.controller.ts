import { Controller, Delete, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as sharp from 'sharp';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('upload-url')
  getUploadUrl(@Query() { fileName }: { fileName: string }) {
    return this.imagesService.getUploadUrl(fileName);
  }
  @Get(':fileName')
  async getFile(@Param() { fileName }: { fileName: string }, @Query() query: { size?: string }, @Res() res: Response) {
    console.log(`Received request for file: ${fileName} with size: ${query.size}`);
    const ext = path.extname(fileName);

    if (!ext) {
      console.error(`Invalid file name: ${fileName}`);
      return res.status(400).send('Invalid file name');
    }

    res.setHeader('Content-Type', 'Content type: image/png');

    const size = query.size;

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

        console.log(`Generating resized image for file: ${fileName}`);
        const generated = sharp(await this.imagesService.getFile(fileName)).resize(parseInt(size, 10));

        const buffer = await generated.toBuffer();

        console.log(`Uploading resized image as: ${newFileName}`);
        await this.imagesService.uploadFile(newFileName, buffer);

        res.setHeader('Content-Disposition', `inline; filename="${newFileName}"`);

        return res.send(buffer);
      }
    }

    console.log(`Returning original file: ${fileName}`);

    const file = await this.imagesService.getFile(fileName);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    res.send(file);
  }

  @Get(':fileName/url')
  async getFileUrl(@Param() { fileName }: { fileName: string }) {
    return this.imagesService.getFileUrl(fileName);
  }

  @Get()
  async listFiles() {
    return this.imagesService.listFiles();
  }

  @Delete(':fileName')
  async deleteFile(@Param() { fileName }: { fileName: string }) {
    return this.imagesService.deleteFile(fileName);
  }
}
