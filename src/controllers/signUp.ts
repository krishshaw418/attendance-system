import type { Request, Response } from "express";
import { signUpSchema } from "../zodSchemas";
import { createNewAccount } from "../services/newAccount";

export const signUp = async (req: Request, res: Response) => {
    const parsed = signUpSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.message });
    }

    try {
        const data = parsed.data;
        const result = await createNewAccount(data);

        if (result.success) {
            if (result.token) {
                res.setHeader("token", result.token);
                res.status(201).json({
                    success: true,
                    data: result.savedData
                })
            }
        } else {
            res.status(400).json({
                success: result.success,
                error: result.error
            })
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, error: "Internal server error!" });
    }
}