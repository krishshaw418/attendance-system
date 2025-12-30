import { Router } from "express";
import { createClass } from "../controllers/createClass";
import { addToClass } from "../controllers/addToClass";
import { getClass } from "../controllers/getClass";
import { authenticateRequest } from "../middlewares/auth";

const router = Router();

router.post("/class", authenticateRequest, createClass);
router.post("/class/:id/add-student", authenticateRequest, addToClass);
router.get("/class/:id", authenticateRequest, getClass);

export default router;