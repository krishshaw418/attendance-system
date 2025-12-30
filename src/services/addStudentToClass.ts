import { db } from "../config/db"

export const addStudentToClass = async (teacherId: string, classId: string, studentId: string) => {
    try {
        const Class = await db.prisma.class.findUnique({
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
            if (Class.strudentIds.find(id => id === studentId)) {
                return {
                    success: true,
                    data: Class
                }
            } else {
                const updatedClass = await db.prisma.class.update({
                    where: {
                        id: Class.id
                    },
                    data: {
                        strudentIds: {
                            push: studentId
                        }
                    }
                })

                return {
                    success: true,
                    data: updatedClass
                }
            }
        }

    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}