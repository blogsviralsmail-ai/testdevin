import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { ProductCatalogService } from './product-catalog.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('product-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-catalog')
export class ProductCatalogController {
  constructor(private service: ProductCatalogService) {}
}
