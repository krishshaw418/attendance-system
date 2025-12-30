import type { Request, Response } from "express";
import { studentIdSchema } from "../zodSchemas";
import { addStudentToClass } from "../services/addStudentToClass";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student";
}

export const addToClass = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;
    const role = req.role;

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized request!" });
    }

    if (role !== "teacher") {
        return res.status(403).json({ success: false, error: "Forbidden, teacher access required." });
    }

    const parsed = studentIdSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: JSON.parse(parsed.error.message) });
    }

    try {
        const classId = req.params.id;
        if (classId) {
            const result = await addStudentToClass(userId, classId, parsed.data.studentId);
            if (result.success) {
                return res.status(200).json({
                    success: result.success,
                    data: result.data
                })
            } else {
                return res.status(404).json({
                    success: result.success,
                    error: result.error
                })
            }
        } else {
            return res.status(400).json({
                success: false,
                error: "Missing class id params!"
            })
        }
        
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error!" });
    }
}