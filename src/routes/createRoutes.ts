import { Router } from "express";
import { createClass } from "../controllers/createClass";


const router = Router();

router.post("/class", createClass);

export default router;