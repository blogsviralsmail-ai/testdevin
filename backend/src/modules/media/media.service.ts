import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}
  private storagePath = path.resolve('./storage/app/public');

  async uploadFile(file: Express.Multer.File, vendorId: number) {
    return { filename: file.filename, path: file.path, url: `/storage/${file.filename}`, size: file.size };
  }

  async deleteFile(filename: string) {
    const sanitized = path.basename(filename);
    if (sanitized !== filename || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }
    const filePath = path.resolve(this.storagePath, sanitized);
    if (!filePath.startsWith(this.storagePath)) {
      throw new BadRequestException('Invalid file path');
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  }

  async getFiles(vendorId: number, type?: string) {
    const dir = path.join(this.storagePath, 'media');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).map(f => ({ name: f, path: `/storage/media/${f}` }));
  }
}
