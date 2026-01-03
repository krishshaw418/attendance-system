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

export const studentIdSchema = z.object({
    "studentId": z.string()
})

export const classIdSchema = z.object({
    "classId": z.string()
})

export const socketMessage = z.object({
    "event": z.enum(["ATTENDANCE_MARKED", "TODAY_SUMMARY", "MY_ATTENDANCE", "DONE"]),
    "data": z.optional(z.object({
        "studentId": z.string(),
        "status": z.enum(["present", "absent"])
    }))
})