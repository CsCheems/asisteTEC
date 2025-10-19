import { Context, compare, hash } from "../deps.ts";
import { getDatabase } from "../utils/database.ts";
import { generateToken } from "../utils/jwt.ts";

export async function login(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { correo, contraseña } = body;

    if (!correo || !contraseña) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Correo y contraseña son requeridos" };
      return;
    }

    const db = await getDatabase();
    
    // Get user
    const result = await db.queryObject<{
      id: number;
      correo: string;
      contraseña: string;
      rol: string;
      bloqueado: boolean;
      intentos_fallidos: number;
      nombre: string;
    }>(
      "SELECT id, correo, contraseña, rol, bloqueado, intentos_fallidos, nombre FROM usuarios WHERE correo = $1",
      [correo]
    );

    const user = result.rows[0];

    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Credenciales inválidas" };
      return;
    }

    if (user.bloqueado) {
      ctx.response.status = 429;
      ctx.response.body = { error: "Cuenta bloqueada por demasiados intentos fallidos" };
      return;
    }

    // Verify password
    const passwordMatch = await compare(contraseña, user.contraseña);

    if (!passwordMatch) {
      // Increment failed attempts
      const newAttempts = user.intentos_fallidos + 1;
      const shouldBlock = newAttempts >= 5;

      await db.queryArray(
        "UPDATE usuarios SET intentos_fallidos = $1, bloqueado = $2 WHERE id = $3",
        [newAttempts, shouldBlock, user.id]
      );

      ctx.response.status = 401;
      ctx.response.body = { error: "Credenciales inválidas" };
      return;
    }

    // Reset failed attempts on successful login
    await db.queryArray(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado = false WHERE id = $1",
      [user.id]
    );

    // Generate JWT token
    const token = await generateToken({
      id: user.id,
      correo: user.correo,
      rol: user.rol,
      nombre: user.nombre,
    });

    // Log the login
    await db.queryArray(
      "INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)",
      [user.id, "LOGIN", `Usuario ${correo} inició sesión exitosamente`]
    );

    ctx.response.status = 200;
    ctx.response.body = {
      token,
      usuario: {
        id: user.id,
        correo: user.correo,
        rol: user.rol,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

export async function register(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { correo, contraseña, nombre, rol } = body;

    if (!correo || !contraseña || !nombre || !rol) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Todos los campos son requeridos" };
      return;
    }

    const db = await getDatabase();

    // Check if user already exists
    const existingUser = await db.queryObject(
      "SELECT id FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (existingUser.rows.length > 0) {
      ctx.response.status = 409;
      ctx.response.body = { error: "El correo ya está registrado" };
      return;
    }

    // Hash password
    const hashedPassword = await hash(contraseña);

    // Create user
    const result = await db.queryObject<{ id: number }>(
      "INSERT INTO usuarios (correo, contraseña, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id",
      [correo, hashedPassword, nombre, rol]
    );

    const userId = result.rows[0].id;

    // Log the registration
    await db.queryArray(
      "INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)",
      [userId, "REGISTRO", `Nuevo usuario ${correo} registrado con rol ${rol}`]
    );

    ctx.response.status = 201;
    ctx.response.body = {
      mensaje: "Usuario registrado exitosamente",
      usuario: {
        id: userId,
        correo,
        rol,
      },
    };
  } catch (error) {
    console.error("Register error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

