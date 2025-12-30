import type { Request, Response } from "express";
import { createClassSchema } from "../zodSchemas";
import { createNewClass } from "../services/createNewClass";
import { success } from "zod";

interface AuthenticateRequest extends Request {
    userId?: string;
    role?: "teacher" | "student";
}

export const createClass = async (req: AuthenticateRequest, res: Response) => {
    const userId = req.userId;
    const role = req.role;
    const parsed = createClassSchema.safeParse(req.body);

    if (role !== "teacher") {
        return res.status(401).json({ success: false, error: "Only teachers can create a new class." });
    }

    if (!parsed.success) {
        return res.status(400).json({ success: false, error: JSON.parse(parsed.error.message)[0].message });
    }

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized request!" });
    }

    try {
        const result = await createNewClass(userId, parsed.data.className);

        if (result.success) {
            return res.status(201).json({ success: result.success, data: result.data });
        } else {
            return res.status(201).json({ success: result.success, error: result.error });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error!" });
    }
}