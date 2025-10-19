// src/app.ts

import { Application } from "./deps.ts";
import { config } from "./config.ts";
// No necesitas initializeDatabase aquí, el servidor no se inicia solo.
import authRoutes from "./routes/authRoutes.ts";
import assistanceRoutes from "./routes/assistanceRoutes.ts";
import justificationsRoutes from "./routes/justificationsRoutes.ts";
import adminRoutes from "./routes/adminRoutes.ts";

const app = new Application(); // Crea la app

// --- Todos tus middlewares (Logger, Error, CORS) van aquí ---
// Logger middleware
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

// Error handling middleware
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        console.error("Error:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
    }
});

// CORS middleware
app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    ctx.response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200;
        return;
    }
    await next();
});


// --- Todas tus rutas van aquí ---
app.use(authRoutes.routes());
app.use(assistanceRoutes.routes());
app.use(justificationsRoutes.routes());
app.use(adminRoutes.routes());

// Health check endpoint (o cualquier otra ruta final)
app.use(async (ctx) => {
    if (ctx.request.url.pathname === "/health") {
        ctx.response.status = 200;
        ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
    } else {
        ctx.response.status = 404;
        ctx.response.body = { error: "Not found" };
    }
});

// ¡LA CLAVE! Exporta la instancia de la app sin iniciarla.
export { app };
