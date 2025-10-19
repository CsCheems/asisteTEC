import { Router } from "../deps.ts";
import { login, register } from "../controllers/authController.ts";

const router = new Router();

router.post("/auth/login", login);
router.post("/auth/register", register);

export default router;

