import { Module } from '@nestjs/common';
import { AiCallController } from './ai-call.controller';
import { AiCallService } from './ai-call.service';
@Module({ controllers: [AiCallController], providers: [AiCallService], exports: [AiCallService] })
export class AiCallModule {}
