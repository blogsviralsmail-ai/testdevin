import { Module } from '@nestjs/common';
import { UpdatePanelController } from './update-panel.controller';
import { UpdatePanelService } from './update-panel.service';
@Module({ controllers: [UpdatePanelController], providers: [UpdatePanelService], exports: [UpdatePanelService] })
export class UpdatePanelModule {}
