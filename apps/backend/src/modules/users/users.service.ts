import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserEsims(userId: string) {
    // Use the relation defined in schema: User -> profiles
    return this.prisma.esimProfile.findMany({
      where: {
        userId: userId
      },
      include: {
        order: true // Optional: include order details if needed
      }
    });
  }
}
