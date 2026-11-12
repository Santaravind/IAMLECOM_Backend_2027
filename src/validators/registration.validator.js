// src/validators/registration.validator.js

import { z } from 'zod';

export const registrationSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Full name must be at least 3 characters')
      .max(80, 'Full name must not exceed 80 characters')
      .regex(/^[\p{L}][\p{L}\s.'-]{2,79}$/u, 'Enter a valid full name with title'),

    email: z
      .string()
      .email('Enter a valid email address')
      .transform((v) => v.toLowerCase().trim()),

    countryCode: z.string().min(1, 'Country code is required'),

    mobile: z
      .string()
      .regex(/^\d{6,14}$/, 'Enter a valid mobile number (6 to 14 digits)'),

    designation: z
      .string()
      .min(2, 'Designation must be at least 2 characters'),

    institution: z
      .string()
      .min(2, 'Institution must be at least 2 characters'),

    country: z
      .string()
      .min(2, 'Country is required'),

    address: z
      .string()
      .min(10, 'Address must be at least 10 characters'),

    categoryId: z.enum(['A', 'B', 'C', 'D'], {
      errorMap: () => ({ message: 'Select a valid registration category' }),
    }),

    categoryName: z.string().min(1, 'Category name is required'),

    presentation: z.enum(['oral', 'poster', 'attending'], {
      errorMap: () => ({ message: 'Select a valid presentation option' }),
    }),

    abstractTitle: z.string().optional().nullable(),

    period: z.string().min(1, 'Registration period is required'),

    applicableFee: z.string().min(1, 'Applicable fee is required'),

    payMode: z.enum(['upi', 'neft', 'swift'], {
      errorMap: () => ({ message: 'Select a valid payment mode' }),
    }),

    payerName: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),

    utr: z
      .string()
      .regex(/^[A-Za-z0-9]{6,35}$/, 'UTR must be 6–35 alphanumeric characters'),

    payDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Enter a valid payment date')
      .refine((val) => new Date(val) <= new Date(Date.now() + 24 * 60 * 60 * 1000), 'Payment date cannot be in the future')
      .refine(
        (val) => new Date(val) >= new Date('2026-11-01'),
        'Payment date cannot be before registration opened (01/11/2026)'
      ),

    payRemarks: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.presentation !== 'attending') {
        return Boolean(data.abstractTitle && data.abstractTitle.trim().length >= 5);
      }
      return true;
    },
    {
      message: 'Abstract title is required for oral/poster presentations (min 5 chars)',
      path: ['abstractTitle'],
    }
  );

