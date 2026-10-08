import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';

describe('EmailService send-failure log', () => {
  it('logs a shortened address, never the full one', async () => {
    const config = { get: jest.fn(() => undefined) };
    const service = new EmailService(config as never);
    (service as unknown as { transporter: unknown }).transporter = {
      sendMail: jest.fn().mockRejectedValue(new Error('smtp down')),
    };
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(
      service.sendMail({ to: 'somchai@example.com', subject: 's', html: 'h' }),
    ).rejects.toThrow('smtp down');

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).toContain('s***@example.com');
    expect(logged).not.toContain('somchai');
    errorSpy.mockRestore();
  });
});
