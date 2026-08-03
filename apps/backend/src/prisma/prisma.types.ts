import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

// Accepted by any service method that may run standalone (against the
// singleton PrismaService) or inside an existing prisma.$transaction
// callback (against the tx client), so a chain of service calls can be
// composed atomically without duplicating their logic.
export type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;
