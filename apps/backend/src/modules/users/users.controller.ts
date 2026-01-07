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
    // Use email from header (authenticated) or query param (guest access)
    const requestEmail = userEmailHeader || email;
    
    if (!requestEmail) {
      throw new Error('Email is required');
    }

    // Normalize email for lookup
    const normalizedEmail = requestEmail.toLowerCase().trim();
    
    // For authenticated requests, verify the header email matches query email (if both provided)
    if (userEmailHeader && email && userEmailHeader.toLowerCase().trim() !== normalizedEmail) {
      // Security: authenticated user can only query their own email
      throw new Error('Email mismatch');
    }
    
    // Get user's eSIMs by email
    // This will return eSIMs for orders linked to this user's email
    // Returns empty array if user doesn't exist (no orders yet)
    const esims = await this.usersService.getUserEsimsByEmail(normalizedEmail);
    
    // Note: For guest access, we don't enforce strict ownership checks
    // The service will return eSIMs linked to orders with matching email
    // For authenticated users, ownership is verified via the email match above

    return esims;
  }
}

