
import * as z from "zod";

export const registrationSchema = z.object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Phone number must be 10 digits starting with 6-9."),
    password: z.string().min(8, "Password must be at least 8 characters long.")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
