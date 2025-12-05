import { PrismaService } from '../../prisma.service';

/**
 * Get userId from email address
 * This is used throughout the backend where user identification is needed
 */
export async function getUserIdFromEmail(
  prisma: PrismaService,
  email: string
): Promise<string | null> {
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });

  return user?.id || null;
}

