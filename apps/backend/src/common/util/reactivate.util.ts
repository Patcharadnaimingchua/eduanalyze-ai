import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Reactivating restores a soft-deleted row, so the partial unique indexes that only
// cover active rows are checked up front for a readable message; this catches the
// race where another request takes the same key between that check and the update.
export async function conflictOnDuplicate<T>(operation: Promise<T>, message: string): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw error;
  }
}
