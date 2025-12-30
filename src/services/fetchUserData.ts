import { db } from "../config/db";

export const fetchUserData = async (id: string) => {
    
    try {
        const user = await db.prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (user) {
            return {
                success: true,
                fetchedData: user
            }
        } else {
            return {
                success: false,
                error: "User not found!"
            }
        }

    } catch (error: any) {
        console.log(error);
        throw new Error(error);
    }
}