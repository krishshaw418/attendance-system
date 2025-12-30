import { Router } from "express";
import { signUp } from "../controllers/signUp";
import { logIn } from "../controllers/logIn";
import { getUserData } from "../controllers/getUserData";
import { authenticateRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/signup", signUp);
router.post("/auth/login", logIn);
router.get("/auth/me", authenticateRequest, getUserData);

export default router;