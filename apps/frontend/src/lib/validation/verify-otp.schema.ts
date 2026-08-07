import { z } from 'zod';
import { otpCodeSchema } from './common';

export const verifyOtpSchema = z.object({
  code: otpCodeSchema,
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
