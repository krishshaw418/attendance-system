import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import authRoutes from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";

let PORT = process.env.PORT!;

const app = express();

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", classRoutes);

app.get("/", async (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Server is running!" });
})

app.listen(PORT, () => {
    console.log(`Listening at port: ${PORT}`);
})
