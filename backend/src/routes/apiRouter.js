import { Router } from "express";

import authRouter from "./auth.routes.js";
import githubRouter from "./github.routes.js";
import agentRouter from "./agent.routes.js";
import ragRouter from "./rag.routes.js";

const apiRouter = Router();

// --- Auth Routes ---
apiRouter.use("/auth", authRouter);

// --- GitHub Routes ---
apiRouter.use("/github", githubRouter);

// --- Agent Routes ---
apiRouter.use("/agent", agentRouter);

// --- RAG Routes ---
apiRouter.use("/rag", ragRouter);

export default apiRouter;
