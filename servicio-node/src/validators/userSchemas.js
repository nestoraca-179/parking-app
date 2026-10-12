const { z } = require('zod');

const passwordRule = z
  .string()
  .min(8, 'Password must have at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const roleRule = z.enum(['ADMIN', 'OPERATOR']);

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username may only contain letters, numbers, dots, underscores and hyphens')
    .transform((value) => value.toLowerCase()),
  password: passwordRule,
  fullName: z.string().trim().min(1).max(100),
  role: roleRule,
  active: z.boolean().default(true),
});

const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100).optional(),
    role: roleRule.optional(),
    active: z.boolean().optional(),
    password: passwordRule.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

module.exports = { createUserSchema, updateUserSchema };
