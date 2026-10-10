import { userMenuEntries } from './user-row-actions';

describe('userMenuEntries', () => {
  it('lists resend then a destructive suspend for an active user who must set a password', () => {
    expect(userMenuEntries({ canResend: true, statusBlocked: false, isActive: true })).toEqual([
      { key: 'resend', label: 'ส่งคำเชิญซ้ำ' },
      { key: 'suspend', label: 'ระงับการใช้งาน', destructive: true },
    ]);
  });

  it('offers a normal reactivate for a suspended user', () => {
    expect(userMenuEntries({ canResend: false, statusBlocked: false, isActive: false })).toEqual([
      { key: 'reactivate', label: 'เปิดใช้งานอีกครั้ง' },
    ]);
  });

  it('is empty when nothing is allowed, so the row gets no menu button', () => {
    expect(userMenuEntries({ canResend: false, statusBlocked: true, isActive: true })).toEqual([]);
  });

  it('keeps only resend when the status change is blocked', () => {
    expect(
      userMenuEntries({ canResend: true, statusBlocked: true, isActive: true }).map((e) => e.key),
    ).toEqual(['resend']);
  });
});
