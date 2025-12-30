import { db } from "../config/db";
import { generateJWT } from "../utils/genToken";
import bcrypt from "bcrypt";

interface userData {
    email: string;
    password: string;
}

export const findUser = async (data: userData) => {
    try {

        const user = await db.prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        if (user) {
            const isPasswordCorrect = await bcrypt.compare(data.password, user.password);

            if (isPasswordCorrect) {

                const token = generateJWT({
                    userId: user.id,
                    role: user.role
                })

                return {
                    success: true,
                    token: token
                }
            } else {
                return {
                    success: false,
                    error: "Incorrect password!"
                }
            }
        }

        return {
            success: false,
            error: "User not found!"
        }

    } catch (error: any) {
        console.log(error);
        throw new Error(error);
    }
}