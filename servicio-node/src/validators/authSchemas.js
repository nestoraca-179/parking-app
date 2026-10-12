const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

module.exports = { loginSchema };
