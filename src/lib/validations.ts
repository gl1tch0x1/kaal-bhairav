import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username is too long"),
  password: z.string().min(1, "Password is required").max(100, "Password is too long"),
});

export const SearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200, "Query is too long"),
  queryType: z.string().optional().default("all"),
  investigationId: z.string().optional(),
});
