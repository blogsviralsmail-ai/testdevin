import { Controller, Get, Post, Delete, Param, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { MediaService } from './media.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private service: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './storage/app/public/media',
      filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
  }))
  async upload(@VendorId() vendorId: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(file, vendorId);
  }

  @Delete(':filename')
  async delete(@Param('filename') filename: string) { return this.service.deleteFile(filename); }

  @Get()
  async getFiles(@VendorId() vendorId: number, @Query('type') type?: string) { return this.service.getFiles(vendorId, type); }
}
