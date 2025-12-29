import { Router } from "express";
import { signUp } from "../controllers/signUp";
import { login } from "../controllers/login";
import { getUserData } from "../controllers/getUserData";
import { authenticateRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/signup", signUp);
router.post("/auth/login", login);
router.get("/auth/me", authenticateRequest, getUserData);

export default router;