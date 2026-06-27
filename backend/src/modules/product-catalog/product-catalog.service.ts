import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class ProductCatalogService {
  constructor(private prisma: PrismaService) {}
}
