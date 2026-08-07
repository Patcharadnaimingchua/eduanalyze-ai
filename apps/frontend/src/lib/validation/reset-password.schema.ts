import { z } from 'zod';
import { passwordSchema } from './common';

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
