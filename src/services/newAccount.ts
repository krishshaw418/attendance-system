import { db } from "../config/db";
import { generateJWT } from "../utils/genToken";
import bcrypt from "bcrypt";

interface userData {
    name: string;
    email: string;
    password: string;
    role: "teacher" | "student"
}

export const createNewAccount = async (data: userData) => {
    try {

        const existingUser = await db.prisma.user.findMany({
            where: {
                email: data.email
            }
        });

        if (existingUser.length !== 0) {
            return {
                success: false,
                error: "Email already exist"
            }
        }

        const hashedPassword = await bcrypt.hash(data.password, parseInt(process.env.SALT_ROUNDS!));

        const newUser = await db.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role
            }
        });

        const token = generateJWT({ userId: newUser.id, role: newUser.role });

        return {
            success: true,
            savedData: {
                "_id": newUser.id,
                "name": newUser.name,
                "email": newUser.email,
                "role": newUser.role
            },
            token: token
        }

    } catch (error: any) {
        console.log(error);
        throw new Error(error);
    }
}