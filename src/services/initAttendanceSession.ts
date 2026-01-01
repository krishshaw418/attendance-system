import { db } from "../config/db";

export const initAttendanceSession = async (teacherId: string, classId: string) => {
    try {
        const Class = db.prisma.class.findFirst({
            where: {
                id: classId,
                teacherId
            }
        });

        if (!Class) {
            return {
                success: false,
                error: "Class not found!"
            }
        } else {
            globalThis.activeSession = {
                classId: classId,
                startedAt: new Date().toISOString(),
                attendance: new Map()
            }

            console.log(globalThis.activeSession);
            return {
                success: true,
                data: {
                    classId: classId,
                    startedAt: globalThis.activeSession.startedAt
                }
            }
        }
    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}