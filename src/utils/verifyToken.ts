import jwt, { type JwtPayload}from "jsonwebtoken";

interface payLoad extends JwtPayload {
    "userId": string,
    "role": "teacher" | "student"
}

export const verifyJWT = (token: string) => {
    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRET!) as payLoad;
        return decoded;
    } catch (error) {
        throw error;
    }
}