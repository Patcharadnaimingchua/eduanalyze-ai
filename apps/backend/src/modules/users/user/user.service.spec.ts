import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from './user.service';

function setup(row: unknown) {
  const findUnique = jest.fn().mockResolvedValue(row);
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  return { service: new UserService(prisma), findUnique };
}

describe('UserService.findAuthContext', () => {
  it('returns the account with its current roles, in a single call', async () => {
    const { service, findUnique } = setup({
      id: 'u1',
      isActive: true,
      mustChangePassword: false,
      userRoles: [{ role: 'STAFF' }, { role: 'INSTRUCTOR' }],
    });
    const result = await service.findAuthContext('u1');
    expect(result.roles).toEqual(['STAFF', 'INSTRUCTOR']);
    expect(result).not.toHaveProperty('userRoles');
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, include: { userRoles: { select: { role: true } } } }),
    );
  });

  it('has no roles when the user holds none', async () => {
    const { service } = setup({ id: 'u1', isActive: true, userRoles: [] });
    expect((await service.findAuthContext('u1')).roles).toEqual([]);
  });

  it('is a 404 for an unknown id', async () => {
    const { service } = setup(null);
    await expect(service.findAuthContext('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
