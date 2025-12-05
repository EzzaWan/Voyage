import { Controller, Get, Query, Headers } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma.service';
import { getUserIdFromEmail } from '../../common/utils/get-user-id';
import { assertOwnership } from '../../common/utils/assert-ownership';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('esims')
  async getEsims(
    @Query('email') email: string,
    @Headers('x-user-email') userEmailHeader: string | undefined,
  ) {
    // Use email from header or query param (query for backward compatibility)
    const requestEmail = userEmailHeader || email;
    
    if (!requestEmail) {
      throw new Error('Email is required');
    }

    // Validate ownership: ensure the requesting user matches the email
    const requestingUserId = await getUserIdFromEmail(this.prisma, requestEmail);
    
    if (!requestingUserId) {
      return [];
    }

    // Get user's eSIMs
    const esims = await this.usersService.getUserEsimsByEmail(requestEmail);
    
    // Verify ownership for each eSIM profile
    for (const esim of esims) {
      if (esim.userId) {
        assertOwnership({
          userId: requestingUserId,
          ownerId: esim.userId,
          resource: 'eSIM',
        });
      }
    }

    return esims;
  }
}

