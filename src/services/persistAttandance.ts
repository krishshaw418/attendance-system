import { db } from "../config/db";

export const persistAttendance = async (classId: string, studentId: string, status: "present" | "absent") => {
    try {

        const Class = await db.prisma.class.findUnique({
            where: {
                id: classId
            }
        });

        if (Class) {
            const student = Class.strudentIds.find(id => id === studentId);
            if (student) {
                await db.prisma.attendance.create({
                    data: {
                        classId,
                        studentId,
                        status
                    }
                });
            }
        }

    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}