import type { Request, Response } from "express";
import { signInSchema } from "../zodSchemas";
import { findUser } from "../services/findUser";

export const logIn = async (req: Request, res: Response) => {
    const parsed = signInSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ success: false, message: JSON.parse(parsed.error.message)[0].message });
    }

    try {
        const data = parsed.data;
        const result = await findUser(data);

        if (result.success) {
            if (result.token) {
                res.set('authorization', result.token);
                res.status(200).json({
                    success: result.success,
                    data: {
                        token: result.token
                    }
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