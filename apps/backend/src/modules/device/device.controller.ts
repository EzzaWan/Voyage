import { Controller, Get, Query } from '@nestjs/common';
import { DeviceService } from './device.service';

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get('device/models')
  async getModels(@Query('q') query?: string) {
    if (query) {
      return {
        models: this.deviceService.searchModels(query),
      };
    }
    return {
      models: this.deviceService.getAllModels(),
    };
  }

  @Get('device/check')
  async checkCompatibility(
    @Query('model') model: string,
    @Query('country') country?: string,
  ) {
    if (!model) {
      return {
        error: 'Model parameter is required',
      };
    }

    return this.deviceService.checkCompatibility(model, country);
  }
}
