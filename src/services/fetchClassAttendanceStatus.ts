import { db } from "../config/db";

export const fetchClassAttendanceStatus = async (classId: string, studentId: string) => {
    try {

        const Class = await db.prisma.class.findFirst({
            where: {
                id: classId
            }
        });

        if (Class) {
            const attendance = await db.prisma.attendance.findFirst({
            where: {
                classId,
                studentId
            },
            select: {
                classId: true,
                status: true
            }
        });

        if (attendance) {
            return {
                success: true,
                data: {
                    classId: attendance.classId,
                    status: attendance.status
                }
            }
        } else {
            return {
                success: true,
                data: {
                    classId: classId,
                    status: null
                }
            }
        }
        } else {
            return {
                success: false,
                error: "Class not found!"
            }
        }

    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}