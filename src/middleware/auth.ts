import { Context, Middleware } from "../deps.ts"; 
import { verifyToken } from "../utils/jwt.ts";
import { AppState } from "../types.ts";


export const authMiddleware: Middleware<AppState> = async (ctx, next) => {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Token no proporcionado o formato incorrecto" };
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    ctx.state.user = payload;
    await next();
  } catch (error) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Token inválido o expirado" };

    // 2. MANEJA EL ERROR DE TIPO 'unknown'
    if (error instanceof Error) {
      console.error("Auth error:", error.message);
    } else {
      console.error("Auth error:", error);
    }
    return;
  }
};

export function requireRole(...roles: string[]): Middleware<AppState> {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "No autenticado" };
      return;
    }

    if (!roles.includes(user.rol)) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Acceso denegado: rol no autorizado" };
      return;
    }

    await next();
  };
}
