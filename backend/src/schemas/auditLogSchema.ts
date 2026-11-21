
import { z } from 'zod';

// Memastikan tanggal menggunakan format YYYY-MM-DD
// dan merupakan tanggal kalender yang benar.
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

export const auditLogQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int('page harus bilangan bulat')
      .min(1, 'page minimal 1')
      .default(1),

    pageSize: z.coerce
      .number()
      .int('pageSize harus bilangan bulat')
      .min(1, 'pageSize minimal 1')
      .max(100, 'pageSize maksimal 100')
      .default(20),

    action: z.string().max(50, 'action maksimal 50 karakter').optional(),

    targetTable: z
      .string()
      .max(50, 'targetTable maksimal 50 karakter')
      .optional(),

    targetId: z.coerce
      .number()
      .int('targetId harus bilangan bulat')
      .positive('targetId harus lebih dari 0')
      .optional(),

    userId: z.coerce
      .number()
      .int('userId harus bilangan bulat')
      .positive('userId harus lebih dari 0')
      .optional(),

    from: z
      .string()
      .refine(validDate, 'from harus berupa tanggal valid YYYY-MM-DD')
      .optional(),

    to: z
      .string()
      .refine(validDate, 'to harus berupa tanggal valid YYYY-MM-DD')
      .optional(),
  })
  .strict('Query mengandung parameter yang tidak dikenal')
  .refine(
    (query) => !query.from || !query.to || query.from <= query.to,
    {
      message: 'from tidak boleh lebih besar dari to',
      path: ['from'],
    },
  );

export const auditLogIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int('id harus bilangan bulat')
    .positive('id harus lebih dari 0'),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type AuditLogIdParam = z.infer<typeof auditLogIdParamSchema>;
