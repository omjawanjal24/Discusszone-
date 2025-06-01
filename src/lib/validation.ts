import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@mitwpu.edu.in') || email.endsWith('@mitwpu.ac.in') || email.endsWith('@mituniversity.edu.in'), {
    message: 'Must be a valid MIT-WPU email address'
  }),
  prn: z.string().length(10, { message: 'PRN must be exactly 10 digits' }).regex(/^\d+$/, { message: "PRN must contain only digits" }),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  role: z.enum(['student', 'faculty'], { required_error: 'Role is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@mitwpu.edu.in') || email.endsWith('@mitwpu.ac.in') || email.endsWith('@mituniversity.edu.in'), {
    message: 'Must be a valid MIT-WPU email address'
  }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }).regex(/^\d+$/, { message: "OTP must contain only digits" }),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
