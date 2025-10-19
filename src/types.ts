// src/types.ts

/**
 * Define la estructura del payload que se almacena dentro del token JWT.
 * Esto nos da autocompletado y seguridad de tipos al decodificar el token.
 */
export interface JWTPayload {
    id: number;
    correo: string;
    rol: string;
    nombre: string; // ✅ Añadir este campo
}


/**
 * Define la forma del estado (`state`) que se adjunta al Context de Oak.
 * Le decimos a TypeScript que nuestro estado puede contener opcionalmente los datos del usuario.
 */
export interface AppState {
  user?: JWTPayload; // La propiedad 'user' es opcional porque no todas las rutas están autenticadas.
}
