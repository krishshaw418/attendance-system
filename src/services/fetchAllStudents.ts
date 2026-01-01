import { db } from "../config/db";

export const fetchAllStudents = async () => {
    try {
        const students = await db.prisma.user.findMany({
            where: {
                role: "student"
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (students.length !== 0) {
            return {
                success: true,
                data: students
            }
        } else {
            return {
                success: false,
                error: "No students found!"
            }
        }

    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}