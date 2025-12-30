import { db } from "../config/db";
import { fetchUserData } from "./fetchUserData";

export const fetchClassData = async (classId: string, studentId?: string, teacherId?: string) => {
    try {

        if (studentId) {
            const enrolledClass = await db.prisma.class.findUnique({
                where: {
                    id: classId,
                    strudentIds: {
                        has: studentId
                    }
                },
            });

            if (enrolledClass) {
                const students = await Promise.all(
                    enrolledClass.strudentIds.map(async (stdId) => {
                        const result = await fetchUserData(stdId);
                        const student = result.fetchedData;
                        return student
                    })
                );

                return {
                    success: true,
                    enrolledClass,
                    students: students
                }
            } else {
                return {
                    success: false,
                    error: "Not enrolled in any class yet!"
                }
            }
        } else if(teacherId) {
            const ownedClass = await db.prisma.class.findUnique({
                where: {
                    id: classId,
                    teacherId
                }
            });

            if (ownedClass) {
                const students = await Promise.all(
                    ownedClass.strudentIds.map(async (stdId) => {
                            const result = await fetchUserData(stdId);
                            const student = result.fetchedData;
                            return student
                        }
                    )
                )
                console.log(students);

                return {
                    success: true,
                    ownedClass,
                    students: students
                }
            } else {
                return {
                    success: false,
                    error: "You haven't created any classes yet!"
                }
            }
        }

    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
}