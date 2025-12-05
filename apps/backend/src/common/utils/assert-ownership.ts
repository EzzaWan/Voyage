import { AppError } from '../errors/app-error';

export interface AssertOwnershipParams {
  userId: string;
  ownerId: string | null | undefined;
  resource: string;
}

export function assertOwnership(params: AssertOwnershipParams): void {
  const { userId, ownerId, resource } = params;

  if (!ownerId) {
    throw new AppError(
      `${resource} does not have an owner`,
      404,
      'RESOURCE_NOT_FOUND'
    );
  }

  if (userId !== ownerId) {
    throw new AppError(
      `You do not have permission to access this ${resource.toLowerCase()}`,
      403,
      'FORBIDDEN'
    );
  }
}
