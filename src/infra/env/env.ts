import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  JWT_EXP_IN_HOURS: z.coerce.number().optional().default(1),
  EMAIL: z.string(),
  PASSWORD: z.string(),
  EMAIL_HOST: z.string().optional().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().optional().default(465),
  RETURN_PERIOD_DAYS: z.coerce.number().optional().default(30),
  EMAIL_TEST_RECIPIENT: z.string(),
  BUFFER_IMAGE_TEST: z.string(),
  PORT: z.coerce.number().optional().default(3333),
})

export type Env = z.infer<typeof envSchema>
