import { z } from "zod";

/**
 * The contact form's rules. The same schema runs in the browser (react-hook-form) and on the
 * server (the route handler), so the two can never disagree.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is a bit long. Keep it under 80 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(120, "That email address is too long.")
    .email("That does not look like an email address."),
  subject: z
    .string()
    .trim()
    .max(120, "Keep the subject under 120 characters.")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(2000, "Please keep the message under 2000 characters."),
  /** Honeypot: hidden from people, so only bots fill it in. Never validated as an error. */
  website: z.string().optional(),
});

export type ContactValues = z.infer<typeof contactSchema>;
