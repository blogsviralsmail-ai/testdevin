import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}
  private storagePath = './storage/app/public';

  async uploadFile(file: Express.Multer.File, vendorId: number) {
    return { filename: file.filename, path: file.path, url: `/storage/${file.filename}`, size: file.size };
  }

  async deleteFile(filename: string) {
    const filePath = path.join(this.storagePath, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  }

  async getFiles(vendorId: number, type?: string) {
    const dir = path.join(this.storagePath, 'media');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).map(f => ({ name: f, path: `/storage/media/${f}` }));
  }
}
