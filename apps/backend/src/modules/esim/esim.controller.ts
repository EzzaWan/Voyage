import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { EsimService } from './esim.service';

@Controller() // Do NOT prefix with /api. Global prefix handles it.
export class EsimController {
  constructor(private readonly esimService: EsimService) {}

  @Get('countries')
  async getCountries() {
    const data = await this.esimService.getLocations();
    return data.locationList;
  }

  @Get('countries/:code/plans')
  async getPlans(@Param('code') code: string) {
    const data = await this.esimService.getPackages(code);
    return data.packageList;
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.esimService.getPlan(id);
  }

  @Post('esims/:id/topup')
  async topUp(
    @Param('id') id: string,
    @Body() body: { packageCode: string }
  ) {
    return { status: 'not_implemented_yet', id };
  }
}
