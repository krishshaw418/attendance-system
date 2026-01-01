import type { Request, Response } from "express";
import { fetchClassAttendanceStatus } from "../services/fetchClassAttendanceStatus";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student"
}

export const getMyAttendance = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;
    const role = req.role;
    const classId = req.params.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized request!" });
    }

    if (role !== "student") {
        return res.status(403).json({ success: false, error: "Forbidden, student access required!" });
    }

    if (!classId) {
        return res.status(400).json({ success: false, error: "Missing class id params!" });
    }

    try {
        const result = await fetchClassAttendanceStatus(classId, userId);
        if (result.success) {
            return res.status(200).json({
                success: result.success,
                data: result.data
            })
        } else {
            return res.status(404).json({
                success: result.success,
                data: result.error
            })
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error!" });
    }
}