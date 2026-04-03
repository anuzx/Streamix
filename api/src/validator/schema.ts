import { z } from "zod"

export const RegisterSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  password: z.string().min(6).max(30),
  username: z.string()
})


export const LoginSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string()
})

export const TweetSchema = z.object({
  content: z.string()
})

export const PlaylistSchema = z.object({
  name: z.string(),
  description: z.string()
})
