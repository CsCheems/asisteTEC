// src/utils/jwt.ts

import { createJWT, verifyJWT } from "../deps.ts";
import { config } from "../config.ts";
// 1. Importa JWTPayload desde el archivo central de tipos
import type { JWTPayload } from "../types.ts";

// La clave se importa y prepara una sola vez cuando el módulo se carga. Correcto.
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(config.jwt.secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

// La interfaz JWTPayload ya no es necesaria aquí, se importa desde types.ts

export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const token = await createJWT(
    { alg: "HS256", typ: "JWT" },
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
    },
    key
  );
  return token;
}

/**
 * Verifica un token JWT.
 * @returns Una Promise que se resuelve con el JWTPayload si el token es válido.
 * @throws Un error si el token es inválido, expirado o tiene una firma incorrecta.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    // verifyJWT ya lanza un error si la firma es incorrecta o el token está malformado.
    const payload = await verifyJWT(token, key);

    // 2. Añadimos una validación extra para la estructura del payload.
    if (!isJWTPayload(payload)) {
      throw new Error("Estructura de payload de JWT inválida.");
    }

    // Si todo está bien, TypeScript confía en que es un JWTPayload.
    return payload;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error de verificación de token: ${error.message}`);
    } else {
      throw new Error(`Error de verificación de token: ${String(error)}`);
    }
  }
}

function isJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Record<string, unknown>).id === "number" &&
    typeof (payload as Record<string, unknown>).correo === "string" &&
    typeof (payload as Record<string, unknown>).rol === "string"
  );
}
