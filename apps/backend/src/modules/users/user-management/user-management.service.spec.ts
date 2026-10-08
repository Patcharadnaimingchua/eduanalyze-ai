import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RequestUser } from '../../auth/request-user.interface';
import { UserManagementService } from './user-management.service';

const scope = (programId: string) => ({
  id: `s-${programId}`,
  facultyId: null,
  departmentId: null,
  programId,
});

function requester(userId: string, roles: Role[]): RequestUser {
  return { userId, email: `${userId}@x.test`, roles, mustChangePassword: false };
}

function setup(opts: {
  target?: { roles: Role[]; scopes: ReturnType<typeof scope>[] } | null;
  coveredPrograms?: string[];
}) {
  const userService = {
    findOneWhere: jest.fn(async () => {
      if (!opts.target) throw new NotFoundException('User not found');
      return {
        id: 'target',
        scopes: opts.target.scopes,
        userRoles: opts.target.roles.map((role) => ({ role })),
      };
    }),
    setActiveStatus: jest.fn().mockResolvedValue({ id: 'target' }),
  };
  const userRoleService = {
    assignRole: jest.fn().mockResolvedValue({}),
    revokeRole: jest.fn().mockResolvedValue({}),
  };
  const covered = opts.coveredPrograms ?? [];
  const scopeResolver = {
    buildUserScopeOrFilter: jest.fn().mockResolvedValue([]),
    getEffectiveScopes: jest.fn().mockResolvedValue([]),
    isCovered: jest.fn((a: { programId: string | null }) => covered.includes(a.programId ?? '')),
  };
  const service = new UserManagementService(
    {} as never,
    userService as never,
    userRoleService as never,
    {} as never,
    scopeResolver as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, userService, userRoleService };
}

const staff = (...programs: string[]) => ({
  roles: ['STAFF'] as Role[],
  scopes: programs.map(scope),
});

describe('UserManagementService.updateActiveStatus', () => {
  it('rejects suspending yourself with a Thai 403, before any lookup', async () => {
    const { service, userService } = setup({ target: staff('p1') });
    const call = service.updateActiveStatus('me', false, requester('me', ['ADMIN']));
    await expect(call).rejects.toThrow(ForbiddenException);
    await expect(call).rejects.toThrow('ไม่สามารถระงับ');
    expect(userService.setActiveStatus).not.toHaveBeenCalled();
  });

  it('rejects SUPER_ADMIN suspending themselves', async () => {
    const { service } = setup({ target: staff('p1') });
    await expect(
      service.updateActiveStatus('me', false, requester('me', ['SUPER_ADMIN'])),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([
    ['another ADMIN', ['ADMIN']],
    ['an ADMIN who also has STAFF', ['STAFF', 'ADMIN']],
    ['a SUPER_ADMIN', ['SUPER_ADMIN']],
    ['an INSTRUCTOR', ['INSTRUCTOR']],
  ] as [string, Role[]][])('ADMIN cannot suspend %s', async (_n, roles) => {
    const { service, userService } = setup({
      target: { roles, scopes: [scope('p1')] },
      coveredPrograms: ['p1'],
    });
    await expect(
      service.updateActiveStatus('target', false, requester('a1', ['ADMIN'])),
    ).rejects.toThrow('จัดการได้เฉพาะบัญชีเจ้าหน้าที่');
    expect(userService.setActiveStatus).not.toHaveBeenCalled();
  });

  it('ADMIN cannot reactivate another ADMIN either', async () => {
    const { service } = setup({
      target: { roles: ['ADMIN'], scopes: [scope('p1')] },
      coveredPrograms: ['p1'],
    });
    await expect(
      service.updateActiveStatus('target', true, requester('a1', ['ADMIN'])),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ADMIN suspends a STAFF whose scopes are all inside their own', async () => {
    const { service, userService } = setup({
      target: staff('p1', 'p2'),
      coveredPrograms: ['p1', 'p2'],
    });
    await service.updateActiveStatus('target', false, requester('a1', ['ADMIN']));
    expect(userService.setActiveStatus).toHaveBeenCalledWith('target', false);
  });

  it('ADMIN is refused account-wide suspend when one scope is outside, and told to remove their scope', async () => {
    const { service, userService } = setup({
      target: staff('p1', 'p9'),
      coveredPrograms: ['p1'],
    });
    const call = service.updateActiveStatus('target', false, requester('a1', ['ADMIN']));
    await expect(call).rejects.toThrow(ForbiddenException);
    await expect(call).rejects.toThrow('ถอดขอบเขตของคุณออก');
    expect(userService.setActiveStatus).not.toHaveBeenCalled();
  });

  it('ADMIN can still reactivate a multi-scope STAFF', async () => {
    const { service, userService } = setup({
      target: staff('p1', 'p9'),
      coveredPrograms: ['p1'],
    });
    await service.updateActiveStatus('target', true, requester('a1', ['ADMIN']));
    expect(userService.setActiveStatus).toHaveBeenCalledWith('target', true);
  });

  it('SUPER_ADMIN can suspend ADMIN and STAFF', async () => {
    for (const roles of [['ADMIN'], ['STAFF']] as Role[][]) {
      const { service, userService } = setup({
        target: { roles, scopes: [scope('p9')] },
      });
      await service.updateActiveStatus('target', false, requester('sa', ['SUPER_ADMIN']));
      expect(userService.setActiveStatus).toHaveBeenCalledWith('target', false);
    }
  });

  it('keeps the 404 when the target is outside the ADMIN scope', async () => {
    const { service } = setup({ target: null });
    await expect(
      service.updateActiveStatus('target', false, requester('a1', ['ADMIN'])),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('UserManagementService role changes', () => {
  it('ADMIN cannot assign or revoke STAFF on another ADMIN', async () => {
    const { service, userRoleService } = setup({
      target: { roles: ['ADMIN'], scopes: [scope('p1')] },
      coveredPrograms: ['p1'],
    });
    const admin = requester('a1', ['ADMIN']);
    await expect(service.assignRole('target', 'STAFF', admin)).rejects.toThrow(ForbiddenException);
    await expect(service.revokeRole('target', 'STAFF', admin)).rejects.toThrow(ForbiddenException);
    expect(userRoleService.assignRole).not.toHaveBeenCalled();
    expect(userRoleService.revokeRole).not.toHaveBeenCalled();
  });

  it('ADMIN may revoke STAFF from a STAFF user in scope', async () => {
    const { service, userRoleService } = setup({
      target: staff('p1'),
      coveredPrograms: ['p1'],
    });
    await service.revokeRole('target', 'STAFF', requester('a1', ['ADMIN']));
    expect(userRoleService.revokeRole).toHaveBeenCalledWith('target', 'STAFF');
  });

  it('SUPER_ADMIN may grant ADMIN to a STAFF user', async () => {
    const { service, userRoleService } = setup({ target: staff('p1') });
    await service.assignRole('target', 'ADMIN', requester('sa', ['SUPER_ADMIN']));
    expect(userRoleService.assignRole).toHaveBeenCalledWith('target', 'ADMIN');
  });
});
