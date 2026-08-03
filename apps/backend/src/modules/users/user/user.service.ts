import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  ) {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`Email "${email}" is already in use`);
    }
    return tx.user.create({
      data: { email, passwordHash, fullName },
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
}
