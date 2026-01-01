import type { Request, Response } from "express";
import { fetchAllStudents } from "../services/fetchAllStudents";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student"
}

export const getAllStudents = async (req: AuthenticateRequest, res: Response) => {
    const role = req.role;

    if (role !== "teacher") {
        return res.status(403).json({ success: false, error: "Forbidden, teacher access required." })
    }

    try {
        const result = await fetchAllStudents();

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