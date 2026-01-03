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
import { socketMessage } from "./zodSchemas";
import { verifyStudentId } from "./services/verifyStudentId";

let PORT = process.env.PORT!;

const app = express();

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", classRoutes);

app.get("/", async (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Server is running!" });
})

const server = http.createServer(app);

// Created websocket layer over http server
const wss = new WebSocketServer({ server, path: "/ws" });

interface ModifiedSocket extends WebSocket {
    user: {
        userId?: string;
        role?: "teacher" | "student"
    }
}
  
wss.on('connection', (ws: ModifiedSocket) => {
    ws.on('error', console.error);

    // Extracting token from the url for access verification
    const urlObj = new URL(ws.url, process.env.WS_BASE_URL);
    
    const params = Object.fromEntries(urlObj.searchParams);
    
    const token = params.token;

    if (token) {
        try {
            // Verify JWT
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

        const parsed = socketMessage.safeParse(JSON.parse(msg.toString()));

        if (!parsed.success) {
            return ws.send(JSON.stringify({
                "event": "ERROR",
                "data": JSON.parse(parsed.error.message)
            }))
        }

        const message = parsed.data;

        if (message.event === "ATTENDANCE_MARKED") {
            if (message.data) {
                const studentId = message.data.studentId;
                try {
                    const result = await verifyStudentId(studentId);
                    if (!result.success) {
                        return ws.send(JSON.stringify({
                            event: "ERROR",
                            data: {
                                message: result.error
                            }
                        }))
                    }
                } catch (error) {
                    return ws.send(JSON.stringify({
                        event: "ERROR",
                        data: {
                            message: "Malformed studentId!"
                        }
                    }))
                }
                
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
            } else {
                return ws.send(JSON.stringify({
                    event: "ERROR",
                    data: {
                        "message": "Missing data field!"
                    }
                }))
            }
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
                        "message": "Forbidden, student event only"
                    }
                }))
            }
        }
        if (message.event === "DONE") {
            if (ws.user.role === "teacher") {
                if (globalThis.activeSession) {
                    try {
                    // Persisting session data on db
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

                    // Clearing in-memory session after persisting data on the db
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
        }
    })

    ws.on('close', () => {
        console.log("Client disconnected!");
    })
})

server.listen(PORT, () => {
    console.log(`HTTP server listening at port: ${PORT}`);
    console.log(`Websocket endpoint: ws//localhost:${PORT}/ws`);
})
