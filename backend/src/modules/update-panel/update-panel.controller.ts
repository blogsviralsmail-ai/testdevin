import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { UpdatePanelService } from './update-panel.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('update-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('update-panel')
export class UpdatePanelController {
  constructor(private service: UpdatePanelService) {}
}
