import { db } from "../config/db";

export const verifyStudentId = async (studentId: string) => {
    try {
        const student = await db.prisma.user.findUnique({
            where: {
                id: studentId
            }
        });

        if (student) {
            return {
                success: true,
                message: "Valid studentId"
            }
        } else {
            return {
                success: false,
                error: "Invalid studentId!"
            }
        }
    } catch (error: any) {
        console.log(error);
        throw new Error(error);
    }
}