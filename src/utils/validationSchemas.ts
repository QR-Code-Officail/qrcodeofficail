import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    country: z.string().min(2, 'Country must be specified'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const qrCodeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['static', 'dynamic']),
    dataType: z.enum(['url', 'text', 'email', 'sms', 'phone', 'wifi', 'contact', 'event', 'location', 'pdf']),
    content: z.record(z.any(), { required_error: 'Content object is required' }),
    style: z.object({
      foregroundType: z.enum(['color', 'gradient']).optional(),
      foregroundColor: z.string().optional(),
      gradientType: z.enum(['linear', 'radial']).optional(),
      gradientColors: z.array(z.string()).optional(),
      backgroundColor: z.string().optional(),
      dotsPattern: z.enum(['square', 'dots', 'rounded', 'classy', 'extra-rounded']).optional(),
      cornersType: z.enum(['square', 'dot', 'extra-rounded', 'out-rounded']).optional(),
      cornersDotsType: z.enum(['square', 'dot']).optional(),
      logoUrl: z.string().optional(),
      logoMargin: z.number().optional(),
      logoWidth: z.number().optional(),
      logoHeight: z.number().optional(),
      frameType: z.string().optional(),
      frameText: z.string().optional(),
      frameTextColor: z.string().optional(),
      frameColor: z.string().optional(),
    }).optional(),
  }),
});

export const updateQrStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'active', 'paused']),
  }),
});

export const subscriptionPurchaseSchema = z.object({
  body: z.object({
    packageName: z.string(),
    productId: z.string(),
    purchaseToken: z.string(),
  }),
});
