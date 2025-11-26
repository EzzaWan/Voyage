import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('esims')
  async getEsims(@Query('userId') userId: string) {
    // In real app, get userId from AuthGuard/Request
    return this.usersService.getUserEsims(userId);
  }
}

