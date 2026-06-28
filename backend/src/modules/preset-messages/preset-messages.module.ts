import { Module } from '@nestjs/common';
import { PresetMessagesController } from './preset-messages.controller';
import { PresetMessagesService } from './preset-messages.service';
@Module({ controllers: [PresetMessagesController], providers: [PresetMessagesService], exports: [PresetMessagesService] })
export class PresetMessagesModule {}
