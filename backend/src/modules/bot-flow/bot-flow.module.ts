import { Module } from '@nestjs/common';
import { BotFlowController } from './bot-flow.controller';
import { BotFlowService } from './bot-flow.service';
@Module({ controllers: [BotFlowController], providers: [BotFlowService], exports: [BotFlowService] })
export class BotFlowModule {}
