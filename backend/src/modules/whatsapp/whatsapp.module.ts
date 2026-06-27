import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappTemplateService } from './whatsapp-template.service';
import { WhatsappTemplateController } from './whatsapp-template.controller';
import { MessageQueueProcessor } from './processors/message-queue.processor';
import { WebsocketGateway } from '../../gateway/websocket.gateway';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'message-queue' },
      { name: 'webhook-queue' },
      { name: 'media-queue' },
    ),
  ],
  controllers: [WhatsappController, WhatsappWebhookController, WhatsappTemplateController],
  providers: [WhatsappService, WhatsappTemplateService, MessageQueueProcessor, WebsocketGateway],
  exports: [WhatsappService, WhatsappTemplateService],
})
export class WhatsappModule {}
