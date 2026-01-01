import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import authRoutes from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";
import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { verifyJWT } from "./utils/verifyToken";
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from "jsonwebtoken";

let PORT = process.env.PORT!;

const app = express();

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", classRoutes);

app.get("/", async (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Server is running!" });
})

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

interface ModifiedSocket extends WebSocket {
    user: {
        userId?: string;
        role?: "teacher" | "student"
    }
}

interface SocketMessage {
    event: string;
    data: {
        studentId: string;
        status: "present" | "absent"
    }
}
  
wss.on('connection', (ws: ModifiedSocket) => {
    ws.on('error', console.error);

    const urlObj = new URL(ws.url, process.env.WS_BASE_URL);
    
    const params = Object.fromEntries(urlObj.searchParams);
    
    const token = params.token;

    if (token) {
        try {
            const decoded = verifyJWT(token);
            ws.user = { userId: decoded.userId, role: decoded.role }
            console.log(ws.user);

        } catch (error: any) {
            console.log(error);
            if (error instanceof TokenExpiredError) {
                ws.close(1008, error.message);
            }
            if (error instanceof JsonWebTokenError) {
                ws.close(1008, error.message);
            }
            if (error instanceof NotBeforeError) {
                ws.close(1008, error.message);
            }
        }
    } else {
        ws.close(1008, "Token missing!");
    }

    ws.on('message', (msg) => {

        const message: SocketMessage = JSON.parse(msg.toString());
        const studentId = message.data.studentId;
        const status = message.data.status;

        if (ws.user.role === "teacher") {
            if (globalThis.activeSession) {
                globalThis.activeSession.attendance.set(studentId, status);
                console.log(globalThis.activeSession);
            } else {
                return ws.send(JSON.stringify({
                    success: false,
                    error: "No active attendance session found!",
                    code: 1008
                }))
            }
        }

        ws.send(msg.toString());
    })

    ws.on('close', () => {
        console.log("Client disconnected!");
    })
})

server.listen(PORT, () => {
    console.log(`Listening at port: ${PORT}`);
    console.log(`Websocket endpoint: ws//localhost:${PORT}/ws`);
})
