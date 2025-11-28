import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserEsimsByEmail(email: string) {
    // Find user by email first
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return empty array if user doesn't exist yet (no orders)
      return [];
    }

    // Use the relation defined in schema: User -> profiles
    return this.prisma.esimProfile.findMany({
      where: {
        userId: user.id
      },
      include: {
        order: true // Optional: include order details if needed
      }
    });
  }
}
