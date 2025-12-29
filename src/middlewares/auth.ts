import type { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/verifyToken";
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from "jsonwebtoken";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student";
}

export const authenticateRequest = (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            "success": false,
            "error": "Token missing!"
        })
    }

    try {
        const decoded = verifyJWT(token);
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (error: any) {
        console.log(error);
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ success: false, message: error.message });
        }
        if (error instanceof JsonWebTokenError) {
            return res.status(401).json({ success: false, message: error.message });
        }
        if (error instanceof NotBeforeError) {
            return res.status(401).json({ success: false, message: error.message });
        }
    }
}