import type { Request, Response } from "express";
import { classIdSchema } from "../zodSchemas";
import { initAttendanceSession } from "../services/initAttendanceSession";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student"
}

export const startAttendance = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized request!" });
    }

    const role = req.role;
    if (role !== "teacher") {
        return res.status(403).json({ success: false, error: "Forbidden, teacher access required." });
    }

    const parsed = classIdSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: JSON.parse(parsed.error.message) });
    }

    try {
        const result = await initAttendanceSession(userId, parsed.data.classId);

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

    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error!" });
    }
}