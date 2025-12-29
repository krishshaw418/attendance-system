import type { Request, Response } from "express";
import { fetchUserData } from "../services/fetchUserData";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student";
}

export const getUserData = async (req: AuthenticateRequest, res: Response) => {

    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Invalid token or missing token!"
        })
    }
    
    try {
        const result = await fetchUserData(userId);
        if (result.success) {
            return res.status(200).json({
                success: result.success,
                data: result.fetchedData
            })
        } else {
            return res.status(401).json({
                success: result.success,
                error: result.error
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal server error!"
        })
    }
}