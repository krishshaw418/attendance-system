import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import authRoutes from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";
import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { verifyJWT } from "./utils/verifyToken";
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from "jsonwebtoken";
import { persistAttendance } from "./services/persistAttandance";

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

        } catch (error: any) {
            console.log(error);
            if (error instanceof TokenExpiredError) {
                ws.send(JSON.stringify({
                    event: "ERROR",
                    datd: {
                        message: error.message
                    }
                }))
                ws.close();
            }
            if (error instanceof JsonWebTokenError) {
                ws.send(JSON.stringify({
                    event: "ERROR",
                    datd: {
                        message: error.message
                    }
                }))
                ws.close();
            }
            if (error instanceof NotBeforeError) {
                ws.send(JSON.stringify({
                    event: "ERROR",
                    datd: {
                        message: error.message
                    }
                }))
                ws.close();
            }
        }
    } else {
        ws.send(JSON.stringify({
            event: "ERROR",
            datd: {
                message: "Missing Token!"
            }
        }))
        ws.close();
    }

    ws.on('message', async (msg) => {

        const message: SocketMessage = JSON.parse(msg.toString());
        if (message.event === "ATTENDANCE_MARKED") {
            const studentId = message.data.studentId;
            const status = message.data.status;

            if (ws.user.role === "teacher") {
                if (globalThis.activeSession) {
                    globalThis.activeSession.attendance.set(studentId, status);
                    console.log(globalThis.activeSession);
                } else {
                    return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "No active attendance session"
                    }
                }))
                }
            } else {
                return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "Forbidden, teacher event only"
                    }
                }))
            }

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(msg.toString());
                }
            })
        }
        if (message.event === "TODAY_SUMMARY") {
            if (ws.user.role === "teacher") {
                if (globalThis.activeSession) {
                    globalThis.total = globalThis.activeSession.attendance.size;
                globalThis.present = 0;
                globalThis.absent = 0;
                Array.from(globalThis.activeSession.attendance).forEach((entry) => {
                    if (entry[1] === "present") {
                        globalThis.present++;
                    } else {
                        globalThis.absent++;
                    }
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            event: "TODAY_SUMMARY",
                            data: {
                                present: globalThis.present,
                                absent: globalThis.absent,
                                total: total
                            }
                        }));
                    }
                })
                }
            } else {
                return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "Forbidden, teacher event only"
                    }
                }))
            }
        }
        if (message.event === "MY_ATTENDANCE") {
            if (ws.user.role === "student") {
                if (globalThis.activeSession) {
                    if (ws.user.userId) {
                    const status = globalThis.activeSession.attendance.get(ws.user.userId);

                    if (status) {
                        return ws.send(JSON.stringify({
                            event: "MY_ATTENDANCE",
                            data: {
                                status: status
                            }
                        }))
                    } else {
                        return ws.send(JSON.stringify({
                            event: "MY_ATTENDANCE",
                            data: {
                                status: "Not yet updated!"
                            }
                        }))
                    }
                }
                }
            } else {
                return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "Forbidden, student event only"
                    }
                }))
            }
        }
        if (message.event === "DONE") {
            if (ws.user.role === "teacher") {
                if (globalThis.activeSession) {
                    try {
                    const activeSession = globalThis.activeSession;
                    await Promise.all(
                        Array.from(activeSession.attendance).map((entry) => {
                            persistAttendance(activeSession.classId, entry[0], entry[1])
                        })
                    );

                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                event: "DONE",
                                data: {
                                    message: "Attendance persisted",
                                    present: globalThis.present,
                                    absent: globalThis.absent,
                                    total: globalThis.total
                                }
                            }));
                        }
                    });

                    globalThis.present = 0;
                    globalThis.absent = 0;
                    globalThis.total = 0;
                    globalThis.activeSession = null

                } catch (error) {
                    return ws.send(JSON.stringify({
                        event: "ERROR",
                        data: {
                            "message": "Internal server error!"
                        }
                    }))
                }
                }
            } else {
                return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "Forbidden, teacher event only"
                    }
                }))
            }
        }
    })

    ws.on('close', () => {
        console.log("Client disconnected!");
    })
})

server.listen(PORT, () => {
    console.log(`Listening at port: ${PORT}`);
    console.log(`Websocket endpoint: ws//localhost:${PORT}/ws`);
})
