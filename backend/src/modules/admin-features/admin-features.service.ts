import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminFeaturesService {
  constructor(private prisma: PrismaService) {}

  // ====== TRANSLATIONS ======
  async getTranslations(locale?: string, search?: string) {
    try {
      let where = 'WHERE 1=1';
      const params: unknown[] = [];
      if (locale) { where += ' AND locale = ?'; params.push(locale); }
      if (search) { where += ' AND (translation_key LIKE ? OR translation_value LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      return await this.prisma.$queryRawUnsafe(
        `SELECT * FROM translations ${where} ORDER BY id DESC LIMIT 200`, ...params,
      );
    } catch {
      return [];
    }
  }

  async createTranslation(data: Record<string, unknown>) {
    try {
      await this.prisma.$executeRawUnsafe(
        'INSERT INTO translations (uid, locale, translation_key, translation_value, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        uuidv4(), data.locale || 'en', data.translation_key || data.key || '',
        data.translation_value || data.value || '',
      );
    } catch {}
    return { success: true };
  }

  async updateTranslation(id: number, data: Record<string, unknown>) {
    try {
      await this.prisma.$executeRawUnsafe(
        'UPDATE translations SET translation_key = ?, translation_value = ?, locale = ?, updated_at = NOW() WHERE id = ?',
        data.translation_key || data.key || '', data.translation_value || data.value || '',
        data.locale || 'en', id,
      );
    } catch {}
    return { success: true };
  }

  async deleteTranslation(id: number) {
    try {
      await this.prisma.$executeRawUnsafe('DELETE FROM translations WHERE id = ?', id);
    } catch {}
    return { success: true };
  }

  // ====== CONTACT INQUIRIES ======
  async getContactInquiries(search?: string) {
    try {
      if (search) {
        return await this.prisma.$queryRawUnsafe(
          'SELECT * FROM contact_inquiries WHERE name LIKE ? OR email LIKE ? OR message LIKE ? ORDER BY created_at DESC',
          `%${search}%`, `%${search}%`, `%${search}%`,
        );
      }
      return await this.prisma.$queryRawUnsafe(
        'SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 200',
      );
    } catch {
      return [];
    }
  }

  async deleteContactInquiry(id: number) {
    try {
      await this.prisma.$executeRawUnsafe('DELETE FROM contact_inquiries WHERE id = ?', id);
    } catch {}
    return { success: true };
  }

  // ====== ADDONS ======
  async getAddons() {
    try {
      return await this.prisma.$queryRawUnsafe(
        'SELECT * FROM addons ORDER BY id DESC',
      );
    } catch {
      return [];
    }
  }

  async toggleAddon(id: number, data: Record<string, unknown>) {
    try {
      await this.prisma.$executeRawUnsafe(
        'UPDATE addons SET status = ?, updated_at = NOW() WHERE id = ?',
        data.status ?? 0, id,
      );
    } catch {}
    return { success: true };
  }

  // ====== LICENCE ======
  async getLicence() {
    try {
      const settings = await this.prisma.site_settings.findMany({
        where: {
          name: { in: ['licence_key', 'licence_status', 'licence_type', 'licence_expiry', 'licence_domain'] },
        },
      });
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.name || ''] = s.value || '';
      }
      return {
        key: result['licence_key'] || '',
        status: result['licence_status'] || 'active',
        type: result['licence_type'] || 'extended',
        expiry: result['licence_expiry'] || '',
        domain: result['licence_domain'] || '',
      };
    } catch {
      return { key: '', status: 'active', type: 'extended', expiry: '', domain: '' };
    }
  }

  async updateLicence(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      const name = `licence_${key}`;
      try {
        await this.prisma.site_settings.upsert({
          where: { name },
          update: { value: String(value) },
          create: { uid: uuidv4(), name, value: String(value) },
        });
      } catch {}
    }
    return { success: true };
  }
}
