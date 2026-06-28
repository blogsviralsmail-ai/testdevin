import { Module } from '@nestjs/common';
import { BotReplyController } from './bot-reply.controller';
import { BotReplyService } from './bot-reply.service';
@Module({ controllers: [BotReplyController], providers: [BotReplyService], exports: [BotReplyService] })
export class BotReplyModule {}
