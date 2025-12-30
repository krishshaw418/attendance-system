import type { Request, Response } from "express";
import { fetchClassData } from "../services/fetchClassData";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student";
}

export const getClass = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;
    const role = req.role;
    const classId = req.params.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized request!" });
    }

    if (!classId) {
        return res.status(400).json({ success: false, error: "Missing class id params!" });
    }

    try {
        if (role === "teacher") {
            const result = await fetchClassData(classId, undefined, userId);

            if (result?.success) {
                return res.status(200).json({
                    success: result.success,
                    data: {
                        "_id": result.ownedClass?.id,
                        "className": result.ownedClass?.className,
                        "teacherId": result.ownedClass?.teacherId,
                        "students": result.students
                    }
                })
            } else {
                return res.status(404).json({
                    success: result?.success,
                    error: result?.error
                })
            }
        }

        if (role === "student") {
            const result = await fetchClassData(classId, userId, undefined);
            if (result?.success) {
                return res.status(200).json({
                    success: result.success,
                    data: {
                        "_id": result.enrolledClass?.id,
                        "className": result.enrolledClass?.className,
                        "teacherId": result.enrolledClass?.teacherId,
                        "students": result.students
                    }
                })
            } else {
                return res.status(404).json({
                    success: result?.success,
                    error: result?.error
                })
            }
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "internal server error!" });
    }
}