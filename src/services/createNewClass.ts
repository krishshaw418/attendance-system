import { db } from "../config/db"

export const createNewClass = async (teacherId:string, className: string) => {
    try {
        const newClass = await db.prisma.class.create({
            data: {
                className,
                teacherId
            }
        });

        if (newClass) {
            return {
                success: true,
                data: newClass
            }
        } else {
            return {
                success: false,
                error: "Couldn't create new class now. Please try again later."
            }
        }
    } catch (error: any) {
        console.log(error);
        throw new Error(error);
    }
}