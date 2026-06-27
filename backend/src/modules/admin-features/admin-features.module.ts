import { Module } from '@nestjs/common';
import { AdminFeaturesController } from './admin-features.controller';
import { AdminFeaturesService } from './admin-features.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminFeaturesController],
  providers: [AdminFeaturesService],
})
export class AdminFeaturesModule {}
