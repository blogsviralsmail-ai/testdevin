import { Module } from '@nestjs/common';
import { VendorFeaturesController } from './vendor-features.controller';
import { VendorFeaturesService } from './vendor-features.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorFeaturesController],
  providers: [VendorFeaturesService],
})
export class VendorFeaturesModule {}
