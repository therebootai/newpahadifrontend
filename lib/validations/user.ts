import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ==========================================
// CREATE STAFF / ADMIN SCHEMA
// ==========================================
export const createStaffSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  role: z.enum(['admin', 'staff'], {
    message: "Role must be 'admin' or 'staff'",
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ==========================================
// UPDATE USER SCHEMA (Admin / Staff)
// ==========================================
export const updateUserSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  role: z.enum(['admin', 'staff', 'customer']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
