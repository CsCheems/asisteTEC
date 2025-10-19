import { Context } from "../deps.ts";
import { getDatabase } from "../utils/database.ts";

interface AppState {
  user?: {
    id: number;
    rol: string;
    nombre: string;
  };
}

export async function getDashboard(ctx: Context<AppState>) {
  try {
    const db = await getDatabase();

    const queries = {
      totalUsuarios: "SELECT COUNT(*) as count FROM usuarios",
      totalAlumnos: "SELECT COUNT(*) as count FROM alumnos",
      totalProfesores: "SELECT COUNT(*) as count FROM profesores",
      totalMaterias: "SELECT COUNT(*) as count FROM materias",
      totalAsistencias: "SELECT COUNT(*) as count FROM asistencias",
      justificacionesPendientes:
        "SELECT COUNT(*) as count FROM justificaciones WHERE estado = 'Pendiente'",
    };

    const [
      usersResult,
      studentsResult,
      teachersResult,
      subjectsResult,
      attendanceResult,
      justificationsResult,
    ] = await Promise.all(
      Object.values(queries).map((q) => db.queryObject<{ count: number }>(q))
    );

    ctx.response.status = 200;
    ctx.response.body = {
      dashboard: {
        totalUsuarios: usersResult.rows[0]?.count || 0,
        totalAlumnos: studentsResult.rows[0]?.count || 0,
        totalProfesores: teachersResult.rows[0]?.count || 0,
        totalMaterias: subjectsResult.rows[0]?.count || 0,
        totalAsistencias: attendanceResult.rows[0]?.count || 0,
        justificacionesPendientes: justificationsResult.rows[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error("Get dashboard error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

export async function createStudent(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { correo, contraseña, nombre, matricula, carrera, semestre } = body;

    if (!correo || !contraseña || !nombre || !matricula) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Campos requeridos faltantes" };
      return;
    }

    const db = await getDatabase();

    // Check if email already exists
    const existingEmail = await db.queryObject(
      "SELECT id FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (existingEmail.rows.length > 0) {
      ctx.response.status = 409;
      ctx.response.body = { error: "El correo ya está registrado" };
      return;
    }

    // Check if matricula already exists
    const existingMatricula = await db.queryObject(
      "SELECT id FROM alumnos WHERE matricula = $1",
      [matricula]
    );

    if (existingMatricula.rows.length > 0) {
      ctx.response.status = 409;
      ctx.response.body = { error: "La matrícula ya está registrada" };
      return;
    }

    // Create user
    const userResult = await db.queryObject<{ id: number }>(
      "INSERT INTO usuarios (correo, contraseña, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id",
      [correo, contraseña, nombre, "Alumno"]
    );

    const userId = userResult.rows[0].id;

    // Create student record
    const studentResult = await db.queryObject<{ id: number }>(
      "INSERT INTO alumnos (usuario_id, matricula, carrera, semestre) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, matricula, carrera || null, semestre || null]
    );

    const studentId = studentResult.rows[0].id;

    const actorId = ctx.state.user?.id ?? userId;
    const actorRol = ctx.state.user?.rol ?? "Alumno";

    // Registrar log
    await db.queryArray(
      "INSERT INTO logs_auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)",
      [
        actorId,
        "CREAR_ALUMNO",
        actorRol === "Alumno"
          ? `El alumno ${nombre} (${matricula}) se registró`
          : `Nuevo alumno ${nombre} (${matricula}) creado por ${actorRol}`,
      ]
    );

    ctx.response.status = 201;
    ctx.response.body = {
      mensaje: "Alumno creado exitosamente",
      alumno: {
        id: studentId,
        usuarioId: userId,
        correo,
        nombre,
        matricula,
        carrera,
        semestre,
      },
    };
  } catch (error) {
    console.error("Create student error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
}

