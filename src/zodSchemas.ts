import * as z from "zod";

export const signUpSchema = z.object({
    "name": z.string(),
    "email": z.email(),
    "password": z.string().min(6),
    "role": z.enum(["teacher", "student"])
})

export const signInSchema = z.object({
    "email": z.email(),
    "password": z.string().min(6)
})

export const createClassSchema = z.object({
    "className": z.string()
})