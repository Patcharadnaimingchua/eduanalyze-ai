import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../../prisma/prisma.types';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    passwordHash: string | null,
    fullName: string,
    tx: PrismaClientOrTx = this.prisma,
    mustChangePassword = false,
  ) {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`Email "${email}" is already in use`);
    }
    return tx.user.create({
      data: { email, passwordHash, fullName, mustChangePassword },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }
    return user;
  }

  async findById(id: string, tx: PrismaClientOrTx = this.prisma) {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  // Generic passthrough — the caller (UserManagementService) builds the
  // `where` clause, including any scope-containment filter, so this stays
  // a thin single-entity service per CONVENTIONS.md §6.
  async findAll(where: Prisma.UserWhereInput) {
    return this.prisma.user.findMany({ where });
  }

  // Same query-level filter contract as findAll — used by UserManagementService
  // to enforce "exists but outside your scope" as a 404, not a 403 (§3a:
  // User is personal data, unlike Faculty/Department).
  async findOneWhere(where: Prisma.UserWhereInput) {
    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async setActiveStatus(id: string, isActive: boolean) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }
}
