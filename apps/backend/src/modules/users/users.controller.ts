import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('esims')
  async getEsims(@Query('email') email: string) {
    // User identified by email (from Clerk frontend)
    return this.usersService.getUserEsimsByEmail(email);
  }
}

