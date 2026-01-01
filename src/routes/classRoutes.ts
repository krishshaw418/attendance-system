import { Router } from "express";
import { createClass } from "../controllers/createClass";
import { addToClass } from "../controllers/addToClass";
import { getClass } from "../controllers/getClass";
import { getAllStudents } from "../controllers/getAllStudents";
import { getMyAttendance } from "../controllers/getMyAttendance";
import { startAttendance } from "../controllers/startAttendance";
import { authenticateRequest } from "../middlewares/auth";

const router = Router();

router.post("/class", authenticateRequest, createClass);
router.get("/students", authenticateRequest, getAllStudents);
router.post("/attendance/start", authenticateRequest, startAttendance);
router.post("/class/:id/add-student", authenticateRequest, addToClass);
router.get("/class/:id/my-attendance", authenticateRequest, getMyAttendance);
router.get("/class/:id", authenticateRequest, getClass);

export default router;