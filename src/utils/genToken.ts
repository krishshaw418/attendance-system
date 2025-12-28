import jwt, { type JwtPayload}from "jsonwebtoken";

interface payLoad extends JwtPayload {
    "userId": string,
    "role": "teacher" | "student"
}

export const generateJWT = (payLoad: payLoad) => {
    var token = jwt.sign(payLoad, process.env.JWT_SECRET!, { algorithm: 'HS256' });
    return token;
}